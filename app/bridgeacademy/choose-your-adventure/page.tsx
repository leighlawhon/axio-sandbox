"use client";

import React, { Suspense, useContext, useEffect, useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import Chat from "../../components/chat";
import FileViewer from "@/app/components/file-viewer";
import { AssistantStream } from "openai/lib/AssistantStream";
import CareerGetter from "@/app/components/career/career-getter";
import StoryOutline from "@/app/components/CYOA/sel-story-outline-getter";
const ChooseAdventure = () => {
    const [showUI, setShowUI] = useState<boolean>(false);
    const [pageCodeVisible, setPageCodeVisible] = useState(false);
    const envCode = process.env.NEXT_PUBLIC_BA_CODE

    const handleFileStatus = (status: string) => {
        console.log('Received file status:', status);
        status === 'completed' ? setShowUI(true) : setShowUI(false);
        // You can now use the file status in page.tsx
    };

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
                <StoryOutline />
            </div>


            {/* )} */}
        </main>

    );
};

export default ChooseAdventure;
