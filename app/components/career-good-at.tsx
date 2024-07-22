"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "./spinner";
import { Tabs } from "@radix-ui/themes";
import CareerTabs from "./career-tabs";
import { parsedJSON, stripMarkdown } from "../utils/career-utlities";
// import { UserMessage, AssistantMessage, CodeMessage } from "./career-ui-ele";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};


type GoodAtProps = {
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
    careertitle: string;
};

const GoodAt = ({
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
    careertitle,
}: GoodAtProps) => {
    const [messages, setMessages] = useState([]);
    const [apiCalled, setApiCalled] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [goodatContents, setGoodatContents] = useState([]);
    const [messageDone, setMessageDone] = useState(false);
    const [callTypeProp, setCallTypeProp] = useState('');
    const [startSpinner, setStartSpinner] = useState(false);
    // automatically scroll to bottom of chat

    // create a new threadID when chat component created
    useEffect(() => {
        const createThread = async () => {
            try {
                const res = await fetch(`/api/assistants/threads`, {
                    method: "POST",
                });
                const data = await res.json();
                setThreadId(data.threadId);
            } catch (error) {
                console.error("Error creating thread:", error);
            }
        };
        if (threadId === null) {
            createThread();
        }
        console.log("NEW THREAD!!!!!!", threadId, typeof threadId, "test");
    }, [careertitle]);
    useEffect(() => {
        if (threadId !== null && careertitle !== null && !apiCalled) {
            console.log(threadId)
            handleGetGoodAt(careertitle);
            setApiCalled(true);
        }
    }), [threadId, careertitle, apiCalled];
    useEffect(() => {
        if (messageDone && callTypeProp === 'GETGOODAT') {
            const goodAtParsed = parsedJSON(messages[messages.length - 1].text);
            console.log(messages, messages.length, goodAtParsed, 'GOOD AT MESSAGE!!!!!!');
            setGoodatContents(goodAtParsed);
        };
        scrollToBottom();
    }, [messageDone, callTypeProp]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGetGoodAt = async (careertitle: string) => {
        if (!threadId) return;
        try {
            console.log('GOOD AT CALL!!!!!!', threadId);
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/threads/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: `based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of scenarios that illustrate how my top 3 traits for this job can be utlize for this job, in an Arrray format with items in a String format only, without markdown. Only return an Array format. Do not include comments or expalantions.`,
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream, "GETGOODAT");
        } catch (error) {
            console.error("Error getting career good at:", error);
        }
    }


    const submitActionResult = async (runId, toolCallOutputs) => {
        const response = await fetch(
            `/api/assistants/threads/${threadId}/actions`,
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
    /*
        =======================
        === STREAM EVENTS ===
        =======================
      */
    // textCreated - create new assistant message
    const handleTextCreated = () => {
        appendMessage("assistant", "");
    };

    // textDelta - append text to last assistant message
    const handleTextDelta = (delta) => {
        if (delta.value != null) {
            appendToLastMessage(delta.value);
        };
        if (delta.annotations != null) {
            annotateLastMessage(delta.annotations);
        }
    };

    // imageFileDone - show image in chat
    const handleImageFileDone = (image) => {
        appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
    }

    // toolCallCreated - log new tool call
    const toolCallCreated = (toolCall) => {
        if (toolCall.type != "code_interpreter") return;
        appendMessage("code", "");
    };

    // toolCallDelta - log delta and snapshot for the tool call
    const toolCallDelta = (delta, snapshot) => {
        if (delta.type != "code_interpreter") return;
        if (!delta.code_interpreter.input) return;
        appendToLastMessage(delta.code_interpreter.input);
    };

    // handleRequiresAction - handle function call
    const handleRequiresAction = async (
        event: AssistantStreamEvent.ThreadRunRequiresAction
    ) => {
        const runId = event.data.id;
        const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
        // loop over tool calls and call function handler
        const toolCallOutputs = await Promise.all(
            toolCalls.map(async (toolCall) => {
                const result = await functionCallHandler(toolCall);
                return { output: result, tool_call_id: toolCall.id };
            })
        );

        submitActionResult(runId, toolCallOutputs);
    };

    // handleRunCompleted - re-enable the input form
    const handleRunCompleted = () => {

        setStartSpinner(false);
        setMessageDone(true);
    };

    const handleReadableStream = (stream: AssistantStream, callType?: string) => {
        callType ? setCallTypeProp(callType) : setCallTypeProp('DEFAULT');
        // messages
        stream.on("textCreated", handleTextCreated);
        stream.on("textDelta", handleTextDelta);

        // image
        stream.on("imageFileDone", handleImageFileDone);

        // code interpreter
        stream.on("toolCallCreated", toolCallCreated);
        stream.on("toolCallDelta", toolCallDelta);

        // events without helpers yet (e.g. requires_action and run.done)
        stream.on("event", (event) => {
            if (event.event === "thread.run.requires_action")
                handleRequiresAction(event);
            if (event.event === "thread.run.completed") handleRunCompleted();
        });
    };



    /*
      =======================
      === Utility Helpers ===
      =======================
    */

    const appendToLastMessage = (text) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
                text: lastMessage.text + text,
            };
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });

    };

    const appendMessage = (role, text) => {
        setMessages((prevMessages) => [...prevMessages, { role, text }]);
    };

    const annotateLastMessage = (annotations) => {
        setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            const updatedLastMessage = {
                ...lastMessage,
            };
            annotations.forEach((annotation) => {
                if (annotation.type === 'file_path') {
                    updatedLastMessage.text = updatedLastMessage.text.replaceAll(
                        annotation.text,
                        `/api/files/${annotation.file_path.file_id}`
                    );
                }
            })
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });

    }

    return (
        <>
            {threadId && careertitle && messageDone && (<Suspense fallback={<div>Loading...</div>}>
                <ul className="list-disc">
                    {messageDone && careertitle ?
                        goodatContents.map((goodatContent, index) => {
                            return (
                                <li key={index}>
                                    {goodatContent}
                                </li>
                            )
                        })
                        : startSpinner ? <div className="flex justify-center"><Spinner /></div> : null}
                </ul>
            </Suspense>)}
        </>
    );
};

export default GoodAt;
