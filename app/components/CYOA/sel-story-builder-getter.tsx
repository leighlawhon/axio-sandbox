"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
import CareerTabs from "../career/career-tabs";
import { parsedJSON, stripMarkdown } from "../../utils/career-utlities";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};


type StoryBuilderProps = {
    plots: { plot_title: string, plot_description: string }[];
    protagonist: string;
    ageGroup: string;
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
};

const StoryBuilder = ({
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
    plots,
    ageGroup,
    protagonist,
}: StoryBuilderProps) => {
    const [userInput, setUserInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [storyBuilder, setStoryBuilder] = useState<{ scene_name: string, fictional_scene: string, scene_response_a: string, scene_response_b: string }[]>([{ scene_name: null, fictional_scene: null, scene_response_a: null, scene_response_b: null }]);
    const [storyScenes, setStoryScenes] = useState([]);
    const [storyPlotPoints, setStoryPlotPoints] = useState([]);

    const [storyMessageDone, setMessageDone] = useState(false);
    const [callTypeProp, setCallTypeProp] = useState('');
    const [startSpinner, setStartSpinner] = useState(false);
    const apiResponseBuilderRef = useRef(null);

    const [newThreadCompleted, setNewThreadCompleted] = useState(false);

    useEffect(() => {
        const createBuilderThread = async () => {
            try {
                const res = await fetch(`/api/assistants/storybuilderthreads`, {
                    method: "POST",
                });
                const data = await res.json();
                apiResponseBuilderRef.current = data;
                setNewThreadCompleted(true);
            } catch (error) {
                console.error("Error creating thread:", error);
            }
        };
        // if (apiResponseBuilderRef.current === null) {
        createBuilderThread();


    }, []);
    useEffect(() => {
        if (newThreadCompleted && plots.length > 0) {
            console.log(apiResponseBuilderRef.current, "NEW THREAD COMPLETED");
            // if (plots.length > 0) {
            //     getStoryBuilder(plots[0].plot_description);
            // }

        }
    }, [newThreadCompleted, plots]);

    useEffect(() => {
        if (storyMessageDone) {
            console.log(messages[messages.length - 1].text, "STORY Builder MESSAGE");
            const storyBuilderparsed = JSON.parse(messages[messages.length - 1].text);
            console.log(storyBuilderparsed, "STORY Builder PARSED");
            // if (storyBuilderparsed.fictional_scene === "") {
            //     setStoryBuilder([storyBuilderparsed]);
            // } else {
            setStoryBuilder([...storyBuilder, storyBuilderparsed]);
            // }
        }
    }, [storyMessageDone]);

    //send message for career to assistant
    // content: `based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of reasons I would be good at this job, in an Arrray format with items in a String format only, without markdown. Only return an Array format. Do not include comments or expalantions.`,
    const next_plot = (plotIndex: number) => {
        if (plotIndex + 2 !== plots.length) {
            return `For response A and response B actions they should lead to this plot ${plots[plotIndex + 2].plot_description} `
        } else {
            return '';
        }
    }


    const getStoryBuilder = async (plotIndex: number, response) => {
        if (!newThreadCompleted) return;
        let next_scene = plots[plotIndex].plot_description
        next_scene += response;
        console.log("BUILDER API called", plots[plotIndex], apiResponseBuilderRef.current.threadId)
        setInputDisabled(true);
        try {
            // plots.length === plotIndex ? setStartSpinner(false) : return;
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/storybuilderthreads/${apiResponseBuilderRef.current.threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: `
                        Write a scene for ${ageGroup} audience and this plot ${plots[plotIndex].plot_description}. ${next_plot(plotIndex)}. The response actions should only be for the protagonist, ${protagonist}.`
                    }),
                }
            );
            const stream = AssistantStream.fromReadableStream(response.body);
            setMessageDone(false);
            handleReadableStream(stream);
        } catch (error) {
            console.error("Error getting threeActStory:", error);
        }
    }

    const submitActionResult = async (runId, toolCallOutputs) => {
        const response = await fetch(
            `/api/assistants/storybuilderthreads/${threadId}/actions`,
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
            <button
                onClick={() => {
                    getStoryBuilder(0, `For response A and response B actions they should lead to this plot ${plots[1].plot_description} `);
                }} className="mx-auto w-1/6 text-center mb-3 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">
                Start Story
            </button>
            {storyBuilder.map((scene, index) => {
                return (
                    <div className="w-5/6 m-auto" key={index}>
                        <div>
                            <div className="scene-image">

                            </div>
                            <div>
                                {scene.scene_name && <h3 className=" my-3 text-sky-700 text-md font-bold text-center">{scene.scene_name} (Scene: {index} of {plots.length + 1})</h3>}
                                <div>{scene.fictional_scene}</div>
                            </div>

                        </div>
                        {
                            plots.length !== index && scene.scene_name ? (
                                <div className="mt-3 flex">
                                    <button onClick={() => {
                                        getStoryBuilder(index, scene.scene_response_a)
                                    }} className="mb-3 mr-2 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">{scene.scene_response_a}</button>
                                    <button onClick={() => {
                                        getStoryBuilder(index, scene.scene_response_b)
                                    }} className="mb-3 ml-2 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">{scene.scene_response_b}</button>
                                </div>) : null
                        }
                    </div>
                )
            })}
        </>
    );
};

export default StoryBuilder;
