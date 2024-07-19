"use client";

import React, { Suspense, useContext, useEffect, useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import Chat from "../../components/chat";
import FileViewer from "@/app/components/file-viewer";
import { AssistantStream } from "openai/lib/AssistantStream";
import ChatCareer from "@/app/components/career-getter";
const WOWI = () => {
    const [showUI, setShowUI] = useState<boolean>(false);

    const handleFileStatus = (status: string) => {
        console.log('Received file status:', status);
        status === 'completed' ? setShowUI(true) : setShowUI(false);
        // You can now use the file status in page.tsx
    };
    return (

        <main className={styles.main}>
            <div className={`p-3 w-72 text-center m-auto`}>
                <FileViewer titletext="Attach WOWI Results" onFileStatus={handleFileStatus} />
            </div>
            {showUI && (
                <div >
                    <div className={styles.chat}>
                        <ChatCareer />
                    </div>
                </div>
            )}
        </main>

    );
};

export default WOWI;
