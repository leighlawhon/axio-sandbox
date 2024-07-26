"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import ChatHandler from "@/app/components/chat-handler";
import StoryOutline from "@/app/components/CYOA/sel-story-outline-getter";
import { useAuth } from "@/app/components/AuthContext";

const ChooseAdventure: React.FC = () => {

    const { authenticated } = useAuth();
    console.log(authenticated);

    const storyInterface = {
        story_name: null,
        story_characters: [{ character_name: null, character_description: null, character_type: null }],
        story_plots: [{ plot_title: null, plot_description: null }]
    };

    return (
        <main className={styles.main}>
            {authenticated && (
                <div className={styles.chat}>
                    <ChatHandler threadRoute="storyoutlinethreads" chatHandlerDataInitState={storyInterface}>
                        <StoryOutline
                            getChatHandler={function (content: string): void {
                                throw new Error("Function not implemented.");
                            }}
                            chatHandlerData={storyInterface}
                            fetchingData={false}
                            messageDone={false}
                        />
                    </ChatHandler>
                </div>
            )}
        </main>
    );
};

export default ChooseAdventure;
