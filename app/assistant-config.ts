export let careerAssistantId = ""; // set your assistant ID here

if (careerAssistantId === "") {
  careerAssistantId = process.env.OPENAI_ASSISTANT_ID_CAREER;
}

export let selCYOAAssistantId = ""; // set your assistant ID here

if (selCYOAAssistantId === "") {
  selCYOAAssistantId = process.env.OPENAI_ASSISTANT_ID_SELCYOA;
}

export let assistantId = ""; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID_CAREER;
}

export let selStoryBuilderAssistantId = ""; // set your assistant ID here

if (selStoryBuilderAssistantId === "") {
  selStoryBuilderAssistantId = process.env.OPENAI_ASSISTANT_ID_STORYBUILDER;
}


