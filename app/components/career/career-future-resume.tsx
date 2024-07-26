"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";


type FutureResumeProps = {
    fetchingData: boolean;
    getChatHandler: (content: string) => void
    messageDone: boolean;
    chatHandlerData: {
        trait_name: null,
        example: null
    }[];
    careertitle: string;
};

const FutureResume = ({
    fetchingData,
    getChatHandler,
    messageDone,
    chatHandlerData,
    careertitle,
}: FutureResumeProps) => {
    const [futureResume, setFutureResume] = useState([]);
    useEffect(() => {
        if (!fetchingData) {
            console.log("PDF DATA");
            handleGetFutureResume(careertitle);
        }
    }), [];

    useEffect(() => {
        if (messageDone && !fetchingData) {
            setFutureResume(chatHandlerData);
        }
    }, [messageDone, chatHandlerData]);

    const handleGetFutureResume = async (careertitle: string) => {

        const content = `based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of scenarios that illustrate how my top 3 traits (either career training or job satisfaction) and can be utlize for a successful career in ${careertitle}.  
        Speak in the past tense and use my name from my uploaded document. 
        Each scenario will have a trait_name followed by the example, 
        Do not include comments or expalantions. Output only plain text. Do not output markdown. Use the following example JSON format:
        [
            {"trait_name": "Organizational Skills", "example": "Patrick meticulously planned several event logistics and ensured all details were covered."},
        ]`;
        getChatHandler(content);
    }

    return (
        <div className="pr-3">
            {/* <Suspense fallback={<div><Spinner /></div>}> */}
            {
                futureResume.map((futureResumeTrait, index) => {
                    return (
                        <p key={index}>
                            <strong>{futureResumeTrait.trait_name}:</strong> {futureResumeTrait.example}
                        </p>
                    )
                })
            }
            {/* </Suspense> */}
        </div>
    );
};

export default FutureResume;
