import React, { useState } from "react";
import Spinner from "../ui/spinner";
import StoryBuilder from "./sel-story-builder-getter";
import SelectAgeGroup from "../ui/select";
import ChatHandler from "../chat-handler";

type StoryOutlineProps = {
    getChatHandler: (content: string) => void;
    chatHandlerData: {
        story_name: string,
        story_characters: { character_name: string, character_description: string, character_type: string }[],
        story_plots: { plot_title: string, plot_description: string }[];
    };
};

const StoryOutline = ({
    getChatHandler,
    chatHandlerData,
}: StoryOutlineProps) => {
    const [ageGroup, setAgeGroup] = useState("any");
    const [submitted, setSubmitted] = useState(false);

    const handleInputSubmit = () => {
        const inputvalue = document.getElementById(
            "settheme"
        ) as HTMLInputElement;
        getStoryOutline(inputvalue.value !== '' ? inputvalue.value : 'random');
        setSubmitted(true);
    };

    const getStoryOutline = async (theme: string) => {
        const content = `Write a story outline that uses a theme of ${theme}. Write the story for ${ageGroup} age group`;
        getChatHandler(content);
    };

    return (
        <div className="grid item-center">
            <h1 className="font-bold text-sky-600 text-xl text-center">Choose Your Adventure</h1>
            {!submitted && <div className="lg:w-1/3 sm:w-1/2 mx-auto">
                <label htmlFor="settheme" className="text-center leading-normal  text-xs">
                    Set Theme: (leave blank for AI to decide)
                </label>
                <div className="flex flex-row mb-3">
                    <SelectAgeGroup onValueChange={(value: string) => { setAgeGroup(value) }} />
                </div>
                <div className="flex w-full  items-center">
                    <input
                        id="settheme"
                        className="grow mr-2 px-2 py-1 border-1 border-black border-solid"
                        placeholder="what is your story about?"
                    />{" "}
                    <button className="border-2 px-2 py-1 border-sky-400 text-sky-400 font-bold border-solid rounded-md bg-white" onClick={handleInputSubmit}>Submit</button>

                </div>
            </div>}
            <hr className="mt-4" />
            {chatHandlerData.story_name ? <h2 className="text-lg text-center font-bold text-sky-600 mt-2">{chatHandlerData.story_name}</h2> : submitted ? <div className="flex item-centered"><Spinner /></div> : null}
            <ChatHandler threadRoute="storybuilderthreads">
                <StoryBuilder 
                    getChatHandler={function (content: string): void {
                        throw new Error("Function not implemented.");
                    }}
                    chatHandlerData={{ scene_name: null, fictional_scene: null, scene_response_a: null, scene_response_b: null }}
                    plots={chatHandlerData.story_plots}
                    ageGroup={ageGroup} 
                    protagonist={chatHandlerData.story_characters.find((char) => char.character_type === "protagonist")?.character_name}
                />
            </ChatHandler>
            {/* <ChatHandler threadRoute="storybuilderthreads" >
                {(getChatHandler: (content: string) => void, chatHandlerData: any): React.ReactNode => <StoryBuilder getChatHandler={getChatHandler} chatHandlerData={chatHandlerData} plots={chatHandlerData.story_plots} ageGroup={ageGroup} protagonist={chatHandlerData.story_characters.find((char) => char.character_type === "protagonist")?.character_name} />}
            </ChatHandler> */}
        </div>
    );
};

export default StoryOutline;
