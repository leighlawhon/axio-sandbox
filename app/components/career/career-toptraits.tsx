"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import CareerBarChart from "./bar-chart";
import { parsedJSON } from "../../utils/career-utlities";
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

type TopTraitstProps = {
    fetchingData: boolean;
    getChatHandler: (content: string) => void;
    messageDone: boolean;
    chatHandlerData: {
        trait_name: string,
        my_aptitude: string,
        use_example: string
    }[];
    careertitle: string;
};

const TopTraits = ({
    careertitle,
    getChatHandler,
    messageDone,
    chatHandlerData,
    fetchingData,

}: TopTraitstProps) => {
    const [topTraitsList, setTopTraitsList] = useState([]);
    useEffect(() => {
        if (!fetchingData) {
            handleGetTopTraits(careertitle);
        }
    }), [];

    useEffect(() => {
        if (messageDone && !fetchingData) {
            setTopTraitsList(chatHandlerData);
        }
    }, [messageDone, chatHandlerData]);


    const handleGetTopTraits = async (careertitle: string) => {
        const content =
            `Based on the selection of ${careertitle}, and the pulled traits from the profile file, what are the top 3 traits that are most important for success in this career?
            For each trait, provide a detailed description of how my aptitude from my profile matches this trait, being sure to highlight if I need to improve in this area. 
            For the example of how the trait is used in the career, use an illustrative example.
            Do not include comments or expalantions. Output only plain text. Do not output markdown.
            Use the following JSON format:
            [
                {
                    "trait_name": string,
                    "my_aptitude": string,
                    "use_example": string
                }
            ]`
        getChatHandler(content);
    }

    return (
        <div className="toptraits grid grid-cols-3  pl-4 border-s-4 border-gray-100">

            {messageDone && (
                topTraitsList.map((traitItem, index) => (
                    <div key={`toptraits${index}`} className="col-span-1 pr-4">
                        <h4 className="text-blue-900 text-md font-bold">{traitItem.trait_name}</h4>
                        <button className="mb-3 mt-1 border-2 px-2 border-blue-400 text-blue-400 font-bold border-solid rounded-md bg-white">Take me to a course</button>
                        <p><strong>My Aptitude: </strong>{traitItem.my_aptitude}</p>
                        <p><strong>In the role: </strong>{traitItem.use_example}</p>
                    </div>
                ))


            )}
        </div>
    );
};

export default TopTraits;
