"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "./spinner";
import { stripMarkdown, transformResponse } from "../utils/career-utlities";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import CareerBarChart from "./bar-chart";

type CharacterReqtProps = {
    careertitle: string;
    handleGetCareerReq: (careertitle: string) => void;
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
};

const CharacterrReq = ({
    careertitle,
    handleGetCareerReq,
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: CharacterReqtProps) => {
    const [messages, setMessages] = useState([]);
    const [threadId, setThreadId] = useState("");
    const [characterReq, setCharacterReq] = useState<any>([]);
    const [messageParsed, setMessageParsed] = useState<any>([]);
    const [messageDone, setMessageDone] = useState(false);
    const [startSpinner, setStartSpinner] = useState(false);

    useEffect(() => {
        const createThread = async () => {
            const res = await fetch(`/api/assistants/threads`, {
                method: "POST",
            });
            const data = await res.json();
            setThreadId(data.threadId);
            console.log(data, careertitle, 'THREADID!!!!!!');
        };
        if (careertitle !== "") {
            createThread();
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/threads/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: `based on my career choice of ${careertitle} proivde me with a list of the characteristics that are required for this career. The characteristics for the career should be chosen from those that are in my uploaded profile. The my_score value should be the value from my uploaded profile. The career_score should be the 100 - my_score. Do not include comments or expalantions. Only return a JSON format. Each characteristic should be in the following JSON format:  
                        - "characteristic": string, 
                        - "my_score": number
                        - "career_score": number`
                    }),
                }
            );
            console.log(response.body, 'RESPONSE BODY!!!!!!');
            const stream = AssistantStream.fromReadableStream(response.body);
            handleReadableStream(stream);
        };
        if (threadId !== "") {
            fetchData();
        }
    }, [threadId]);

    useEffect(() => {
        messageDone && messages.length > 0 ? parseMessages(messages) : null;
    }, [messageDone]);

    useEffect(() => {
        setCharacterReq(messageParsed);
    }, [messageParsed]);

    const parseMessages = async (messages) => {
        console.log(messages, 'PARSE MESSAGES!!!!!!');
        // const stripedjson = await stripMarkdown(messages[messages.length - 1].text);
        // const parsed = JSON.parse(stripedjson);
        // console.log(parsed, 'PARSED!!!!!!');
        // setMessageParsed(parsed)
    };

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
        console.log('REQ MESSAGE DONE!!!!!!');
    };

    const handleReadableStream = (stream: AssistantStream) => {
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

    useEffect(() => {
        if (messageDone && characterReq) {
            // Render the component once the message is done and characterReq is available
            console.log('Rendering the component...');
        }
    }, [messageDone, characterReq]);

    return (
        <div className="">
            {/*
            {messageDone && characterReq ?
                <CareerBarChart data={characterReq} /> :
                startSpinner ? <Spinner /> : null} */}
        </div>
    );
};

export default CharacterrReq;
