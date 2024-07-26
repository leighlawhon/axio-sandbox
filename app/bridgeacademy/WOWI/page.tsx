"use client";

import React, { Suspense, useContext, useEffect, useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import FileViewer from "@/app/components/file-viewer";
import CareerGetter from "@/app/components/career/career-getter";
import ChatHandler from "@/app/components/chat-handler";
import { useAuth } from "@/app/components/AuthContext";

const WOWI: React.FC = () => {

    const { authenticated } = useAuth();

    const [showUI, setShowUI] = useState<boolean>(false);

    const handleFileStatus = (status: string) => {
        console.log('Received file status:', status);
        status === 'completed' ? setShowUI(true) : setShowUI(false);
        // You can now use the file status in page.tsx
    };

    const careerInterface = [{
        career_name: null,
        education: null,
        field_of_study: [''],
        skills: [''],
        job_outlook: null,
        median_salary: null
    }];

    return (
        <main className={styles.main}>
            {authenticated && (
                <div>
                    <div className={`p-3 w-72 text-center m-auto`}>
                        <FileViewer titletext="Attach WOWI Results" onFileStatus={handleFileStatus} />
                    </div>
                    {showUI && (
                        <div>
                            <ChatHandler
                                threadRoute="careerthreads"
                                chatHandlerDataInitState={careerInterface}
                            >
                                <CareerGetter
                                    fetchingData={false}
                                    messageDone={false}
                                    getChatHandler={function (content: string): void {
                                        throw new Error("Function not implemented.");
                                    }}
                                    chatHandlerData={careerInterface}
                                />
                            </ChatHandler>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};

export default WOWI;
