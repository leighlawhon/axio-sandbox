"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
import { Tabs } from "@radix-ui/themes";
import CareerTabs from "./career-tabs";
import { parsedJSON, stripMarkdown } from "../../utils/career-utlities";
// import { UserMessage, AssistantMessage, CodeMessage } from "./career-ui-ele";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};


type PrepareProps = {
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
    careertitle: string;
};

const CareerPrepare = ({
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
    careertitle,
}: PrepareProps) => {
    const [messages, setMessages] = useState([]);
    const [apiCalled, setApiCalled] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [prepareList, setPrepareList] = useState([]);
    const [messageDone, setMessageDone] = useState(false);
    const [callTypeProp, setCallTypeProp] = useState('');
    const [startSpinner, setStartSpinner] = useState(false);
    // automatically scroll to bottom of chat

    // create a new threadID when chat component created
    useEffect(() => {
        const createThread = async () => {
            try {
                const res = await fetch(`/api/assistants/careerthreads`, {
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
    }, [careertitle]);

    useEffect(() => {
        if (threadId !== null && careertitle !== null && !apiCalled) {
            handleGetPrepare(careertitle);
            setApiCalled(true);
        }
    }), [threadId, careertitle, apiCalled];

    useEffect(() => {
        if (messageDone && callTypeProp === 'GETPREPARE') {
            const preparedparsed = JSON.parse(messages[messages.length - 1].text);
            console.log(preparedparsed, "preparedparsed");
            setPrepareList(preparedparsed);
        }
    }, [messageDone, callTypeProp]);

    const handleGetPrepare = async (careertitle: string) => {
        if (!threadId) return;
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/careerthreads/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: `based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of 3 tasks that I can do to prepare for a career in ${careertitle}. 
                        Each task should have task_name, detailed_steps on how to accomplish the task, the task_time that it will take to complete the task, an estimated_cost for the task, and up to 3 resource_links from the internet that can help with the task.
                        Do not include comments or expalantions. Output only plain text. Do not output markdown. Use the following JSON format:
                        [
                            {
                                "task_name": string,
                                "detailed_steps": string[],
                                "task_time": string,
                                "estimated_cost": string,
                                "resource_links": [string, string, string]
                            }
                        ]`,
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream, "GETPREPARE");
        } catch (error) {
            console.error("Error getting career good at:", error);
        }
    }


    const submitActionResult = async (runId, toolCallOutputs) => {
        const response = await fetch(
            `/api/assistants/careerthreads/${threadId}/actions`,
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
            {threadId && careertitle && messageDone && (<Suspense fallback={<Spinner />}>
                <div className="list-none grid grid-cols-3">
                    {messageDone && careertitle ?
                        prepareList.map((prepareItem, index) => (
                            <div className="pr-3" key={`prepare-${index}`}>
                                <h4 className="text-md text-sky-900 font-bold">{prepareItem.task_name}</h4>
                                <p><strong>Time to complete: </strong>{prepareItem.task_time}</p>
                                <p><strong>Steps:</strong></p>
                                <ol className="list-decimal  list-inside">
                                    {
                                        prepareItem.detailed_steps.map((step, index) => (<li key={`prepare-steps${index}`} >
                                            {step}
                                            <br />
                                            <button className="mb-3 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">Let's go!</button>
                                        </li>))
                                    }
                                </ol>

                                <p><strong>Estimated Cost: </strong>{prepareItem.estimated_cost}</p>
                                <p><strong>Links</strong></p>
                                <ul>
                                    {prepareItem.resource_links.map((resource, index) => (
                                        <li key={`resource-${index}`}>
                                            <a href={resource} target="_blank" rel="noreferrer">{resource}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )) : null}
                </div>
            </Suspense>)}
        </>
    );
};

export default CareerPrepare;
