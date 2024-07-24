import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
import { parsedJSON, stripMarkdown } from "../../utils/career-utlities";
import StoryBuilder from "./sel-story-builder-getter";
import SelectAgeGroup from "../ui/select";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};

type StoryOutlineProps = {
    functionCallHandler?: (
        toolCall: RequiredActionFunctionToolCall
    ) => Promise<string>;
};

const StoryOutline = ({
    functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: StoryOutlineProps) => {
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [storyOutlineData, setStoryOutlineData] = useState<{
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
        const createOutlineThread = async () => {
            try {
                const res = await fetch(`/api/assistants/storyoutlinethreads`, {
                    method: "POST",
                });
                const data = await res.json();
                apiResponseOutlineRef.current = data;
                setNewThreadCompleted(true);
            } catch (error) {
                console.error("Error creating thread:", error);
            }
        };

        createOutlineThread();
    }, []);

    useEffect(() => {
        if (newThreadCompleted) {
            console.log(apiResponseOutlineRef.current, "NEW THREAD COMPLETED");
        }
    }, [newThreadCompleted]);

    useEffect(() => {
        if (storyMessageDone) {
            const storyoutlineparsed = JSON.parse(
                messages[messages.length - 1].text
            );
            console.log(storyoutlineparsed, "STORY PARSED");
            setStoryOutlineData(storyoutlineparsed);
        }
    }, [storyMessageDone]);

    const handleInputSubmit = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        const inputvalue = document.getElementById(
            "settheme"
        ) as HTMLInputElement;
        console.log(inputvalue.value);
        getStoryOutline(inputvalue.value !== '' ? inputvalue.value : 'random');

    };

    const getStoryOutline = async (theme: string) => {
        if (!newThreadCompleted) return;
        console.log("OUTLINE API called", ageGroup, apiResponseOutlineRef.current.threadId);
        setInputDisabled(true);
        try {
            setStartSpinner(true);
            const response = await fetch(
                `/api/assistants/storyoutlinethreads/${apiResponseOutlineRef.current.threadId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content: `Write a story outline that uses a theme of ${theme}. Write the story for ${ageGroup} age group`,
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
            `/api/assistants/storyoutlinethreads/${threadId}/actions`,
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
            <h1 className="font-bold text-sky-600 text-xl text-center">Choose Your Adventure</h1>
            <div className="w-1/3 mx-auto">
                <label htmlFor="settheme" className="flex-none mr-2 text-xs">
                    Set Theme: (leave blank for AI to decide)
                </label>
                <div className="flex flex-row mb-3">
                    <SelectAgeGroup onValueChange={(value: string) => { setAgeGroup(value) }} />
                </div>
                <div className="flex w-full  items-center">
                    <input
                        id="settheme"
                        className="grow mr-2 px-2 py-1 border-1 border-black border-solid"
                        placeholder="what is your story to be about?"
                    />{" "}
                    <button className="border-2 px-2 py-1 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white" onClick={handleInputSubmit}>Submit</button>

                </div>
            </div>
            <hr className="mt-4" />
            <h2 className="text-lg text-center font-bold text-sky-600 mt-2">{storyOutlineData.story_name}</h2>
            {storyMessageDone && (
                <StoryBuilder
                    plots={storyOutlineData.story_plots}
                    ageGroup={ageGroup}
                    protagonist={
                        storyOutlineData.story_characters.find(
                            (char) => char.character_type === "protagonist"
                        )?.character_name
                    }
                />
            )}
        </div>
    );
};

export default StoryOutline;
