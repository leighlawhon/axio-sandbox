"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
import { Tabs } from "@radix-ui/themes";
import CareerTabs from "./career-tabs";
import { parsedJSON, stripMarkdown } from "../../utils/career-utlities";
// import { UserMessage, AssistantMessage, CodeMessage } from "./career-ui-ele";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};


type PrepareProps = {
    fetchingData: boolean;
    getChatHandler: (content: string) => void
    messageDone: boolean;
    chatHandlerData: {
        task_name: string,
        detailed_steps: string[],
        task_time: string,
        estimated_cost: string,
        resource_links: string[]
    }[],
    careertitle: string;
};

const CareerPrepare = ({
    fetchingData,
    getChatHandler,
    messageDone,
    chatHandlerData,
    careertitle,
}: PrepareProps) => {
    const [prepareList, setPrepareList] = useState([]);

    useEffect(() => {
        if (!fetchingData) {
            handleGetPrepare(careertitle);
        }
    }), [];

    useEffect(() => {
        if (messageDone && !fetchingData) {
            setPrepareList(chatHandlerData);
        }
    }, [messageDone, chatHandlerData]);

    const handleGetPrepare = async (careertitle: string) => {
        const content = `
        based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of 3 tasks that I can do to prepare for a career in ${careertitle}. 
        Each task should have task_name, detailed_steps on how to accomplish the task, the task_time that it will take to complete the task, an estimated_cost for the task, and up to 3 resource_links from the internet that can help with the task.
        Do not include comments or expalantions. Output only plain text. Do not output markdown. Use the following JSON format:
        [
            {
                "task_name": string,
                "detailed_steps": string[],
                "task_time": string,
                "estimated_cost": string,
                "resource_links": string[]
            }
        ]`
        getChatHandler(content);

    }

    return (
        <>
                <div className="list-none grid grid-cols-3">
                    {messageDone && careertitle ?
                        prepareList.map((prepareItem, index) => (
                            <div className="pr-3" key={`prepare-${index}`}>
                                <h4 className="text-md text-blue-900 font-bold">{prepareItem.task_name}</h4>
                                <p><strong>Time to complete: </strong>{prepareItem.task_time}</p>
                                <p><strong>Steps:</strong></p>
                                <ol className="list-decimal  list-inside">
                                    {
                                        prepareItem.detailed_steps.map((step, index) => (<li key={`prepare-steps${index}`} >
                                            {step}
                                            <br />
                                            <button className="mb-3 mt-1 border-2 px-2 border-blue-400 text-blue-400 font-bold border-solid rounded-md bg-white">Let's go!</button>
                                        </li>))
                                    }
                                </ol>

                                <p><strong>Estimated Cost: </strong>{prepareItem.estimated_cost}</p>
                                <p><strong>Links</strong></p>
                                <ul>
                                    {prepareItem.resource_links.map((resource, index) => (
                                        <li key={`resource-${index}`}>
                                            <a href={resource} target="_blank" rel="noreferrer">{resource}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )) : null}
            </div>
        </>
    );
};

export default CareerPrepare;
