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
    children;
    threadRoute: string;
    chatContent: string;
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
};

const ChatHandler = ({
    threadRoute,
    chatContent,
    children,
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: ChatHandlerProps) => {
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [ChatHandlerData, setChatHandlerData] = useState<{
        story_name: string;
        story_characters: any[];
        story_plots: { plot_title: string; plot_description: string }[];
    }>({
        story_name: "",
        story_characters: [],
        story_plots: [{ plot_title: "", plot_description: "" }],
    });
    const [ageGroup, setAgeGroup] = useState("any");
    const [storyPlotPoints, setStoryPlotPoints] = useState<any[]>([]);

    const [storyMessageDone, setMessageDone] = useState(false);
    const [callTypeProp, setCallTypeProp] = useState("");
    const [startSpinner, setStartSpinner] = useState(false);
    const apiResponseOutlineRef = useRef<any>(null);

    const [newThreadCompleted, setNewThreadCompleted] = useState(false);

    useEffect(() => {
        const createThread = async () => {
            try {
                const res = await fetch(`/api/assistants/${threadRoute}`, {
                    method: "POST",
                });
                const data = await res.json();
                apiResponseOutlineRef.current = data;
                setNewThreadCompleted(true);
            } catch (error) {
                console.error("Error creating thread:", error);
            }
        };

        createThread();
    }, []);

    useEffect(() => {
        if (newThreadCompleted) {
            console.log(apiResponseOutlineRef.current, "NEW THREAD COMPLETED");
        }
    }, [newThreadCompleted]);

    useEffect(() => {
        if (storyMessageDone) {
            const ChatHandlerparsed = JSON.parse(
                messages[messages.length - 1].text
            );
            console.log(ChatHandlerparsed, "STORY PARSED");
            setChatHandlerData(ChatHandlerparsed);
        }
    }, [storyMessageDone]);


    const getChatHandler = async () => {
        if (!newThreadCompleted) return;
        console.log("OUTLINE API called", apiResponseOutlineRef.current.threadId);
        setInputDisabled(true);
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/ChatHandlerthreads/${apiResponseOutlineRef.current.threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: chatContent,
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream);
        } catch (error) {
            console.error("Error getting threeActStory:", error);
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
        appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
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

    return (
        <div className="grid item-center">
            {children(getChatHandler, ChatHandlerData)}
        </div>
    );
};

export default ChatHandler;
