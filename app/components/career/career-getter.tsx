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
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
};

const CareerGetter = ({
  functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: CareerGetterProps) => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [careers, setCareers] = useState([]);
  const [careertitles, setCareertitles] = useState([]);
  const [goodatContents, setGoodatContents] = useState(Array<object>);
  const [messageDone, setMessageDone] = useState(false);
  const [callTypeProp, setCallTypeProp] = useState('');
  const [startSpinner, setStartSpinner] = useState(false);
  const [canRender, setCanRender] = useState(false);


  // automatically scroll to bottom of chat

  // create a new threadID when chat component created
  useEffect(() => {
    const createThread = async () => {
      try {
        const res = await fetch(`/api/assistants/careerthreads`, {
          method: "POST",
        });
        const data = await res.json();
        setThreadId(data.threadId);
      } catch (error) {
        alert("Something wonky here. Try again. It will work.");
        console.error("Error creating thread:", error);
      }
    };
    if (threadId === null) {
      createThread();
    }
  }, []);

  useEffect(() => {
    if (messageDone && callTypeProp === 'GETCAREERS') {
      console.log(typeof messages[messages.length - 1].text, messages[messages.length - 1].text, "CHECKING PARSING");
      const careerparsed = JSON.parse(messages[messages.length - 1].text);
      console.log(careerparsed, "CAREER PARSED");
      setCanRender(true);
      setCareers(careerparsed);
      setCareertitles(careerparsed.map((career) => {
        return career.career_name
      }));
    }
  }, [messageDone, callTypeProp, messages]);

  //send message for career to assistant
  // content: `based on my career choice of ${careertitle} and my uploaded profile, proivde me with a list of reasons I would be good at this job, in an Arrray format with items in a String format only, without markdown. Only return an Array format. Do not include comments or expalantions.`,

  const handleGetCareers = async () => {
    setInputDisabled(true);
    if (!threadId) return;
    try {
      setStartSpinner(true);
      const response = await fetch(
        `/api/assistants/careerthreads/${threadId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: `based on my profile from the uploaded document, proivde me with a list of 2 careers that I would be good at. Do not include comments or expalantions. Output only plain text. Do not output markdown. Each career should be in the following JSON format: 
            [ 
              {
                "career_name": string,
                "education": string,
                "field_of_study": array,
                "skills": array,
                "job_outlook":string,
                "median_salary": string},
              }
            ]`


          }),
        }
      );
      const stream = AssistantStream.fromReadableStream(response.body);
      handleReadableStream(stream, "GETCAREERS");
    } catch (error) {
      console.error("Error getting careers:", error);
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
    <div className="grid item-center">
      <button className={`${inputDisabled ? "disableButton" : ""} row-1 bg-blue-500 p-3 m-auto rounded-lg text-white`} onClick={handleGetCareers} disabled={inputDisabled}>
        Recommend Jobs
        {startSpinner ? <div className="flex justify-center"><Spinner /></div> : null}
      </button>
      {
        careers.length > 0 && canRender &&
        <>
          {
            careertitles.length > 0 ?
              <CareerTabs
                canRender={canRender}
                tabArr={careertitles}
                careerContents={careers}
              />
              : null
          }
        </>
      }
    </div>
  );
};

export default CareerGetter;
