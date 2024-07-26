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
import QAAccordion from "./qa-accordian";


type PDFDataProps = {
    getChatHandler: (content: string) => void;
    fetchingData: boolean;
    messageDone: boolean;
    chatHandlerData: {
        career_training: {
            characteristic: string,
            my_score: number,
            population_score: string,
            same_education_score: string
        }[],
        job_satisfaction: {
            prefference_name: string,
            my_preference: string,
        }[]
    };
    careertitle: string;
};

const PDFData = ({
    getChatHandler,
    messageDone,
    fetchingData,
    chatHandlerData,
    careertitle,
}: PDFDataProps) => {
    // const [startSpinner, setStartSpinner] = useState(false);
    const [careerTraining, setCareerTraining] = useState([]);
    const [jobSat, setJobSat] = useState([]);
    // const fetchingDataRef = useRef(fetchingData); // Create a mutable reference
    // useEffect(() => {
    //     fetchingDataRef.current = fetchingData; // Update the reference when fetchingData changes
    // }, [fetchingData]);

    useEffect(() => {
        if (!fetchingData) {
            handleGetReq(careertitle);
        }
    }), [];

    useEffect(() => {
        if (messageDone && !fetchingData) {
            setCareerTraining(chatHandlerData.career_training);
            setJobSat(chatHandlerData.job_satisfaction);
        }
    }, [messageDone, chatHandlerData]);

    const handleGetReq = async (careertitle: string) => {
        if (!fetchingData) {
            const content = `Pull all sections and corresponding data scores out of my uploaded profile file.
        {
            "career_training": [
                {
                    "characteristic": string,
                    "my_score": number,
                    "population_score": string,
                    "same_education_score": string
                }
            ],
            "job_satisfaction": [
                {
                    "prefference_name" : string,
                    "my_preference": string,
                }
            ]
        }
    `
            await getChatHandler(content);
        }

    }

    return (
        <>
            {careerTraining.length > 0 && (
                <div className="required">
                    <div className="QA text-sm mb-3">
                        <QAAccordion careerTraining={careerTraining} jobSat={jobSat} />
                    </div>
                    <CareerBarChart chartdata={careerTraining} />
                </div>
            )}
        </>
    );
};

export default PDFData;
