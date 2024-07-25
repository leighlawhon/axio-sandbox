"use client";

import React, { useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import ChatHandler from "@/app/components/chat-handler";
import StoryOutline from "@/app/components/CYOA/sel-story-outline-getter";

const ChooseAdventure = () => {
    const [pageCodeVisible, setPageCodeVisible] = useState<boolean>(false);
    const envCode = process.env.NEXT_PUBLIC_BA_CODE

    const checkCode = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.value, envCode)
        // if (event.target.value === envCode) {
        setPageCodeVisible(true);
        // }

    }
    return (
        <main className={styles.main}>
            <input type="text" onChange={checkCode} />
            {/* {pageCodeVisible && ( */}

            <div className={styles.chat}>
                <ChatHandler threadRoute="storyoutlinethreads">
                    <StoryOutline getChatHandler={function (content: string): void {
                        throw new Error("Function not implemented.");
                    }} chatHandlerData={{
                        story_name: "",
                        story_characters: [],
                        story_plots: []
                    }} />
                </ChatHandler>
            </div>


            {/* )} */}
        </main>

    );
};

export default ChooseAdventure;
