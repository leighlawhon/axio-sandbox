"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "./spinner";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import CareerBarChart from "./bar-chart";
import { parsedJSON } from "../utils/career-utlities";
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

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
        console.log("NEW THREAD REQ!!!!!!", threadId, typeof threadId, "test");
    }, [careertitle]);
    useEffect(() => {
        if (threadId !== null && careertitle !== null && !apiCalled) {
            console.log(threadId)
            handleGetReq(careertitle);
            setApiCalled(true);
        }
    }), [threadId, careertitle, apiCalled];
    useEffect(() => {
        if (messageDone && callTypeProp === 'GETREQ') {
            const reqAtParsed = parsedJSON(messages[messages.length - 1].text);
            console.log(messages, messages.length, reqAtParsed, 'REQ MESSAGE!!!!!!');
            setCharacterReq(reqAtParsed.map((item) => item.career_training));
            setJobSat(reqAtParsed.map((item) => item.job_satisfaction));

        };
        scrollToBottom();
    }, [messageDone, callTypeProp]);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGetReq = async (careertitle: string) => {
        if (!threadId) return;
        try {
            console.log('REQ CALL!!!!!!', threadId);
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/threads/${threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content:
                            `based on my career choice of ${careertitle} and characteristics represented by the top-level headers and the description for each from the CAREER TRAINING POTENTIALS section of my uploaded profile, create a list of 5 of the top characteristics, based on the description, that are would be utilized to be sucessful  by a top performer with this career. 
                    
                        For the CAREER TRAINING POTENTIALS section:
                        The my_score value should be the Raw Score Value.  
                        The same_education_score and the population_score should pulled from the box with the raw score labeld 'Score Compared To'.
                        
                        based on my career choice of ${careertitle} and preferences represented by the top-level headers from the JOB SATISFACTION INDICATORS section of my uploaded profile, create a list of 5 of the top preference that are required to be sucessful in this career. 

                        For the JOB SATISFACTION INDICATORS section:
                        The preference_name value should be the header value for the section.
                        The my_preference value should a categorization of strong or nuetral based on the text in the WHAT IT INDICATES section of the preference.

                        Do not include comments or expalantions. Only return a JSON format. Return the infomation in the following JSON format:  
                        [
                            {
                                career_training: {
                                    "characteristic": string, 
                                    "my_score": number,
                                    "population_score": string
                                    "same_education_score": string
                                },
                                job_satisfaction: {
                                    "prefference_name" : string, 
                                    "my_preference": string,
                                }
                            }
                        ]`
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
        <div className="">
            <div className="QA text-sm mb-3">

                <Accordion.Root className="AccordionRoot" type="single" defaultValue="" collapsible>
                    <Accordion.Item className="AccordionItem" value="item-1" data-state="closed">
                        <Accordion.Header>
                            <Accordion.Trigger className="text-xs w-full relative" data-state="closed">
                                <span className="font-bold text-xs ">QA against PDF</span>
                                <ChevronDownIcon className="absolute right-1 top-0" />
                            </Accordion.Trigger>
                            <Accordion.Trigger />
                        </Accordion.Header>
                        <Accordion.Content>
                            {characterReq.map((item, index) => {

                                return (

                                    <p className="text-xs" key={`career-content-${index}`}>
                                        {Object.entries(item).map(([key, value]) => (
                                            <span className="pr-2" key={`career-content-${key}`}>
                                                {key}: {String(value)}
                                            </span>
                                        ))}
                                    </p>


                                )
                            })}
                            {jobSat.map((item, index) => {
                                return (
                                    <p className="text-xs" key={`job-sat-content-${index}`}>
                                        {Object.entries(item).map(([key, value]) => (
                                            <span className="pr-2" key={`job-sat-content-${key}`}>
                                                {key}: {String(value)}
                                            </span>
                                        ))}
                                    </p>
                                );
                            })}
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>

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
