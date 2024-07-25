import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};

type ChatHandlerProps = {
    threadRoute: string;
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
    children: React.ReactNode;
};

const ChatHandler: React.FC<ChatHandlerProps> = ({
    threadRoute,
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
    children,
}) => {
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [chatHandlerData, setChatHandlerData] = useState<{
        story_name: string;
        story_characters: any[];
        story_plots: { plot_title: string; plot_description: string }[];
    }>({
        story_name: "",
        story_characters: [],
        story_plots: [{ plot_title: "", plot_description: "" }],
    });
    const [chatContent, setChatContent] = useState("");
    const [storyPlotPoints, setStoryPlotPoints] = useState<any[]>([]);

    const [messageDone, setMessageDone] = useState(false);
    const [callTypeProp, setCallTypeProp] = useState("");
    const [startSpinner, setStartSpinner] = useState(false);
    const apiResponseRef = useRef<any>(null);

    const [newThreadCompleted, setNewThreadCompleted] = useState(false);
    const handleChildUpdate = () => {
        // console.log('A child component was updated');
    };

    useEffect(() => {
        if (newThreadCompleted) {
            // console.log(apiResponseRef.current, "NEW THREAD COMPLETED");
            tryFetch(chatContent);
        }
    }, [newThreadCompleted]);

    useEffect(() => {
        console.log(messages, "MESSAGES");
        if (messageDone) {
            const parsed = JSON.parse(messages[messages.length - 1].text);
            // console.log(parsed, "STORY PARSED");
            setChatHandlerData(parsed);
        }
    }, [messageDone]);

    const getChatHandler = async (content: string) => {
        // console.log("GET CHAT HANDLER CALLED", threadId);
        setChatContent(content);
        if (!threadId) {

            await createThread();
        } else {
            // console.log('threadId already exists', threadId);
            setNewThreadCompleted(true);
            setMessageDone(false)
            tryFetch(content);
        }
        // console.log(
        //     "OUTLINE API called",
        //     threadId
        // );
        // await tryFetch(chatContent);
    };
    const tryFetch = async (content: string) => {
    // console.log("TRY FETCH CALLED");
        setInputDisabled(true);
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/${threadRoute}/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: content,
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream);
        } catch (error) {
            console.error("Error getting threeActStory:", error);
        }
    }

    const createThread = async () => {

        try {
            const res = await fetch(`/api/assistants/${threadRoute}`, {
                method: "POST",
            });
            const data = await res.json();
            apiResponseRef.current = data;
            setThreadId(data.threadId);
            setNewThreadCompleted(true);
        } catch (error) {
            console.error("Error creating thread:", error);
        }
    };

    const submitActionResult = async (
        runId: string,
        toolCallOutputs: { output: string; tool_call_id: string }[]
    ) => {
        const response = await fetch(
            `/api/assistants/${threadRoute}/${threadId}/actions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runId: runId,
                    toolCallOutputs: toolCallOutputs,
                }),
            }
        );
        const stream = AssistantStream.fromReadableStream(response.body);
        handleReadableStream(stream);
    };

    const handleTextCreated = () => {
        appendMessage("assistant", "");
    };

    const handleTextDelta = (delta: any) => {
        if (delta.value != null) {
            appendToLastMessage(delta.value);
        }
        if (delta.annotations != null) {
            annotateLastMessage(delta.annotations);
        }
    };

    const handleImageFileDone = (image: any) => {
        appendToLastMessage(
            `\n![${image.file_id}](/api/files/${image.file_id})\n`
        );
    };

    const toolCallCreated = (toolCall: any) => {
        if (toolCall.type != "code_interpreter") return;
        appendMessage("code", "");
    };

    const toolCallDelta = (delta: any, snapshot: any) => {
        if (delta.type != "code_interpreter") return;
        if (!delta.code_interpreter.input) return;
        appendToLastMessage(delta.code_interpreter.input);
    };

    const handleRequiresAction = async (
        event: AssistantStreamEvent.ThreadRunRequiresAction
    ) => {
        const runId = event.data.id;
        const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
        const toolCallOutputs = await Promise.all(
            toolCalls.map(async (toolCall: RequiredActionFunctionToolCall) => {
                const result = await functionCallHandler(toolCall);
                return { output: result, tool_call_id: toolCall.id };
            })
        );
        submitActionResult(runId, toolCallOutputs);
    };

    const handleRunCompleted = () => {
        // console.log("RUN COMPLETED");
        setStartSpinner(false);
        setMessageDone(true);
    };

    const handleReadableStream = (
        stream: AssistantStream,
        callType?: string
    ) => {
        callType ? setCallTypeProp(callType) : setCallTypeProp("DEFAULT");

        stream.on("textCreated", handleTextCreated);
        stream.on("textDelta", handleTextDelta);

        stream.on("imageFileDone", handleImageFileDone);

        stream.on("toolCallCreated", toolCallCreated);
        stream.on("toolCallDelta", toolCallDelta);

        stream.on("event", (event) => {
            if (event.event === "thread.run.requires_action")
                handleRequiresAction(event);
            if (event.event === "thread.run.completed") handleRunCompleted();
        });
    };

    const appendToLastMessage = (text: string) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
                text: lastMessage.text + text,
            };
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });
    };

    const appendMessage = (role: "user" | "assistant" | "code", text: string) => {
        setMessages((prevMessages) => [...prevMessages, { role, text }]);
    };

    const annotateLastMessage = (annotations: any[]) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
            };
            annotations.forEach((annotation) => {
                if (annotation.type === "file_path") {
                    updatedLastMessage.text = updatedLastMessage.text.replaceAll(
                        annotation.text,
                        `/api/files/${annotation.file_path.file_id}`
                    );
                }
            });
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });
    };

    // return (
    //     <div className="grid item-center">
    //         {children(getChatHandler, chatHandlerData)}
    //     </div>
    // );
    return React.Children.map(children, (child: React.ReactElement<any>) => {
        // Enhancing each child with additional props
        return React.cloneElement(child, { handleChildUpdate, getChatHandler, chatHandlerData });
    });
};

export default ChatHandler;
