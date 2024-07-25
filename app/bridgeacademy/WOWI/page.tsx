"use client";

import React, { Suspense, useContext, useEffect, useState } from "react";
import styles from "./page.module.css"; // use simple styles for demonstration purposes
import FileViewer from "@/app/components/file-viewer";
import CareerGetter from "@/app/components/career/career-getter";
import ChatHandler from "@/app/components/chat-handler";
const WOWI = () => {
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
            <input type="text" onChange={checkCode} />
            {/* {pageCodeVisible && ( */}
                <div>
                    <div className={`p-3 w-72 text-center m-auto`}>
                        <FileViewer titletext="Attach WOWI Results" onFileStatus={handleFileStatus} />
                    </div>
                    {showUI && (

                        <div >
                        <ChatHandler
                            threadRoute="careerthreads"
                            chatHandlerDataInitState={careerInterface}
                        >
                            <CareerGetter
                                newThreadCompleted={false}
                                fetchingData={false}
                                messageDone={false}
                                getChatHandler={function (content: string): void {
                                    throw new Error("Function not implemented.");
                                }}
                                chatHandlerData={careerInterface} />
                        </ChatHandler>

                        </div>
                    )}
                </div>
            {/* )} */}
        </main>

    );
};

export default WOWI;
