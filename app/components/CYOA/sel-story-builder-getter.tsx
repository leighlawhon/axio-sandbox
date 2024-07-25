"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};

type StoryBuilderProps = {
    chatHandlerData: { scene_name: string, fictional_scene: string, scene_response_a: string, scene_response_b: string };
    getChatHandler: (content: string,) => void;
    plots: { plot_title: string, plot_description: string }[];
    protagonist: string;
    ageGroup: string;
};

const StoryBuilder = ({
    chatHandlerData,
    getChatHandler,
    plots,
    ageGroup,
    protagonist,
}: StoryBuilderProps) => {
    const [story, setStory] = useState([]);
    useEffect(() => {
        plots.map((plot) => console.log(plot.plot_title, "PLOTS"));

        // console.log(plots, chatHandlerData, "builder");
        if (chatHandlerData.scene_name) {
            setStory((prevStory) => [...prevStory, chatHandlerData]);
        }

    }, [plots, chatHandlerData]);

    const next_plot = (plotIndex: number, response: string) => {
        console.log(plots.length, plotIndex, "NEXT PLOT");

        if (plotIndex === plots.length) {
            return `For response A and response B actions they should lead to this plot ${response} `
        } else {
            return `For response A and response B actions they should lead to this plot ${plots[plotIndex].plot_description + response} `
        }

    }

    const getStoryBuilder = async (plotIndex: number, response) => {
        // console.log(plotIndex, story, "story", plots[plotIndex].plot_title, "PLOTINDEX!!!!!!!")

        let content = '';
        // if (plotIndex === 0) {
        //     content = `Write a scene for ${ageGroup} audience and this plot ${plots[plotIndex].plot_description}. ${next_plot(plotIndex + 1, response)}. The response actions should only be for the protagonist, ${protagonist}.`
        // } else {
        content = `Write a scene for ${ageGroup} audience and this plot ${plots[plotIndex].plot_description}. ${next_plot(plotIndex + 1, response)}. The response actions should only be for the protagonist, ${protagonist}. Return valid JSON`
        // }
        // // console.log(content, "storybuildercalled");
        getChatHandler(content);
    }

    return (
        <>
            {plots.length > 0 && (
                <>
                    <button
                        onClick={() => {
                            getStoryBuilder(0, '');
                        }} className="mx-auto w-1/6 text-center mb-3 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">
                        Start Story
                    </button>
                    {story.length > 0 && story.map((scene, index) => {
                        return (
                            <div className="w-5/6 m-auto mb-6" key={index}>
                                <div>
                                    <div className="scene-image">

                                    </div>
                                    <div>
                                        {scene.scene_name && <h3 className=" my-3 text-sky-700 text-md font-bold text-center">{scene.scene_name} (Scene: {index + 1} of {plots.length})</h3>}
                                        <div>{scene.fictional_scene}</div>
                                    </div>

                                </div>
                                {
                                    plots.length !== index + 1 && scene.scene_name ? (
                                        <div className="mt-3 flex">
                                            <button onClick={() => {
                                                getStoryBuilder(index + 1, scene.scene_response_a)
                                            }} className="mb-3 mr-2 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">{scene.scene_response_a}</button>
                                            <button onClick={() => {
                                                getStoryBuilder(index + 1, scene.scene_response_b)
                                            }} className="mb-3 ml-2 mt-1 border-2 px-2 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white">{scene.scene_response_b}</button>
                                        </div>) : <div className="text-center text-lg font-bold my-3">The End</div>
                                }
                            </div>
                        )
                    })}
                </>
            )}
        </>
    );
};

export default StoryBuilder;
