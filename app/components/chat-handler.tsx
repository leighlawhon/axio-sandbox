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
    chatHandlerDataInitState: any;
    children: React.ReactNode;
};

const ChatHandler: React.FC<ChatHandlerProps> = ({
    chatHandlerDataInitState,
    threadRoute,
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
    children,
}) => {
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [chatHandlerData, setChatHandlerData] = useState<{} | []>(chatHandlerDataInitState);
    const [chatContent, setChatContent] = useState("");
    const [messageDone, setMessageDone] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [threadStarted, setThreadStarted] = useState(false);

    const [startSpinner, setStartSpinner] = useState(false);
    const [newThreadCompleted, setNewThreadCompleted] = useState(false);
    // const fetchingDataRef = useRef(fetchingData); // Create a mutable reference
    const apiResponseRef = useRef<any>(null);

    useEffect(() => {
        console.log(typeof apiResponseRef.current?.threadId !== 'undefined', !fetchingData, chatContent !== "", "USE EFFECT");
        if (

            typeof apiResponseRef.current?.threadId !== 'undefined' &&
            !fetchingData &&
            chatContent !== ""
        ) {
            tryFetch(chatContent);
        }
    }, [apiResponseRef.current?.threadId, fetchingData, chatContent]);

    useEffect(() => {
        if (chatContent && typeof apiResponseRef.current?.threadId === 'undefined' && !fetchingData && !threadStarted) {
            createThread();
        }
    }, [chatContent, apiResponseRef.current?.threadId, fetchingData]);

    useEffect(() => {
        if (messageDone) {
            setFetchingData(false);
            console.log(messages[messages.length - 1].text, "MESSAGE BEFORE PARSED");
            try {
                const parsed = JSON.parse(messages[messages.length - 1].text);
                setChatHandlerData(parsed);
            } catch (error) {
                console.error("Error parsing JSON:", error, messages[messages.length - 1].text);
            }
            console.log("4.) MESSAGES PARSED");
            // console.log(parsed, "STORY PARSED");
        }
    }, [messageDone]);

    const getChatHandler = async (content: string) => {
        console.log("1.) GET CHAT HANDLER CALLED", fetchingData, apiResponseRef.current?.threadId);
        setChatContent(content);
    };
    const tryFetch = async (content: string) => {
        setFetchingData(true);
        console.log("3.) TRY FETCH CALLED", fetchingData);
        setInputDisabled(true);
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/${threadRoute}/${apiResponseRef.current?.threadId}/messages`,
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
        setThreadStarted(true);
        console.log("2.) CREATE THREAD CALLED", typeof apiResponseRef.current?.threadId === 'undefined', fetchingData);
        try {
            const res = await fetch(`/api/assistants/${threadRoute}`, {
                method: "POST",
            });
            const data = await res.json();
            apiResponseRef.current = data;
            setNewThreadCompleted(true);
            console.log(data, "THREAD DATA", fetchingData, typeof apiResponseRef.current?.threadId === 'undefined');
        } catch (error) {
            console.error("Error creating thread:", error);
        }
    };

    const submitActionResult = async (
        runId: string,
        toolCallOutputs: { output: string; tool_call_id: string }[]
    ) => {
        const response = await fetch(
            `/api/assistants/${threadRoute}/${apiResponseRef.current?.threadId}/actions`,
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
        setChatContent("");
    };

    const handleReadableStream = (
        stream: AssistantStream,
    ) => {
        stream.on("textCreated", handleTextCreated);
        stream.on("textDelta", handleTextDelta);

        stream.on("imageFileDone", handleImageFileDone);

        stream.on("toolCallCreated", toolCallCreated);
        stream.on("toolCallDelta", toolCallDelta);
        stream.on("messageDone", async (event) => {
            console.log(event, "MESSAGE DONE");
            if (event.content[0].type === "text") {
                const { text } = event.content[0];
                // const { annotations } = text;
                // const citations: string[] = [];

                // let index = 0;
                // for (let annotation of annotations) {
                //     text.value = text.value.replace(annotation.text, "[" + index + "]");
                //     const { file_citation } = annotation;
                //     if (file_citation) {
                //         const citedFile = await openai.files.retrieve(file_citation.file_id);
                //         citations.push("[" + index + "]" + citedFile.filename);
                //     }
                //     index++;
                // }

                // console.log(text.value);
                // console.log(citations.join("\n"));
            }
        });

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
        // console.log(annotations, "ANNOTATIONS");    
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
    return React.Children.map(children, (child: React.ReactElement<any>) => {
        // Enhancing each child with additional props
        return React.cloneElement(child, { messageDone, fetchingData, getChatHandler, chatHandlerData });
    });
};

export default ChatHandler;
