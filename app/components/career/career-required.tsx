"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import CareerBarChart from "../bar-chart";
import { parsedJSON } from "../../utils/career-utlities";
import QAAccordion from "../ui/qa-accordian";

type CharacterReqtProps = {
    careertitle: string;
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
};

const CharacterReq = ({
    careertitle,
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: CharacterReqtProps) => {
    const [messages, setMessages] = useState([]);
    const [threadId, setThreadId] = useState(null);
    const [messageDone, setMessageDone] = useState(false);
    const [startSpinner, setStartSpinner] = useState(false);
    const [apiCalled, setApiCalled] = useState(false);
    const [characterReq, setCharacterReq] = useState([]);
    const [jobSat, setJobSat] = useState([]);

    const [callTypeProp, setCallTypeProp] = useState('');

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
            handleGetReq(careertitle);
            setApiCalled(true);
        }
    }), [threadId, careertitle, apiCalled];

    useEffect(() => {
        if (messageDone && callTypeProp === 'GETREQ') {
            const reqAtParsed = JSON.parse(messages[messages.length - 1].text);
            console.log(reqAtParsed, "reqAtParsed");
            setCharacterReq(reqAtParsed.career_training);
            setJobSat(reqAtParsed.job_satisfaction);
        }
    }, [messageDone, callTypeProp]);

    const handleGetReq = async (careertitle: string) => {
        if (!threadId) return;
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/careerthreads/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content:
                            `Pull all sections and corresponding data scores out of my uploaded profile file.
                            Do not include comments or expalantions. Output only plain text. Do not output markdown. Use the following JSON format:
                            {
                                career_training: [
                                    {
                                        "characteristic": string,
                                        "my_score": number,
                                        "population_score": string
                                        "same_education_score": string
                                    }
                                ],
                                job_satisfaction: [
                                    {
                                        "prefference_name" : string,
                                        "my_preference": string,
                                    }
                                ]
                            }
                        `
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream, "GETREQ");
        } catch (error) {
            console.error("Error getting career REQ:", error);
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

    /* Stream Event Handlers */

    // textCreated - create new assistant message
    const handleTextCreated = () => {
        appendMessage("assistant", "");
    };

    // textDelta - append text to last assistant message
    const handleTextDelta = (delta) => {
        if (delta.value != null) {
            appendToLastMessage(delta.value);
        }
        if (delta.annotations != null) {
            annotateLastMessage(delta.annotations);
        }
    };

    // imageFileDone - show image in chat
    const handleImageFileDone = (image) => {
        appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
    };

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

    // Call parseMessages directly in handleRunCompleted
    const handleRunCompleted = async () => {
        setStartSpinner(false);
        await setMessageDone(true);
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
            });
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        });
    };

    return (
        <div className="required">
            <div className="QA text-sm mb-3">
                <QAAccordion characterReq={characterReq} jobSat={jobSat} />
            </div>
            {messageDone && characterReq ? (
                <CareerBarChart data={characterReq} />
            ) : startSpinner ? (
                <Spinner />
            ) : null}
        </div>
    );
};

export default CharacterReq;
