"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from "../ui/spinner";
import CareerTabs from "./career-tabs";
import { parsedJSON, stripMarkdown } from "../../utils/career-utlities";

type MessageProps = {
  role: "user" | "assistant" | "code";
  text: string;
};


type CareerGetterProps = {
  getChatHandler: (content: string) => void;
  messageDone: boolean;
  fetchingData: boolean;
  chatHandlerData: {
    career_name: string,
    education: string,
    field_of_study: string[],
    skills: string[],
    job_outlook: string,
    median_salary: string,
  }[];

};

const CareerGetter = ({
  getChatHandler,
  chatHandlerData,
  messageDone,
  fetchingData,
}: CareerGetterProps) => {

  const [inputDisabled, setInputDisabled] = useState(false);
  const [careers, setCareers] = useState([]);
  const [careertitles, setCareertitles] = useState([]);
  const [startSpinner, setStartSpinner] = useState(false);


  useEffect(() => {
    if (messageDone && !fetchingData) {
      console.log("CAREER DATA", chatHandlerData);
      setCareers(chatHandlerData)
      setCareertitles(chatHandlerData.map((career) => career.career_name));
    }
  }, [fetchingData]);

  const handleGetCareers = async () => {
    console.log("GET CAREERS");
    setInputDisabled(true);
    const content = `based on my profile from the uploaded document, proivde me with a list of 2 careers that I would be good at. Each career should be in the following JSON format: 
            [ 
              {
                "career_name": string,
                "education": string,
                "field_of_study": array,
                "skills": array,
                "job_outlook":string,
                "median_salary": string
              }
            ]`
    await getChatHandler(content);
  }


  return (
    <div className="grid item-center">
      <button className={`${inputDisabled ? "disableButton" : ""} row-1 bg-blue-500 p-3 m-auto rounded-lg text-white`} onClick={handleGetCareers} disabled={inputDisabled}>
        Recommend Jobs
        {startSpinner ? <div className="flex justify-center"><Spinner /></div> : null}
      </button>
      {
        careertitles.length > 0 &&
        <>
          <CareerTabs
            tabHeaderArr={careertitles}
            careerContents={careers}
          />
        </>
      }
    </div>
  );
};

export default CareerGetter;
