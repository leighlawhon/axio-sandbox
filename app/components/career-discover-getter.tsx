import React, { useEffect, useState } from 'react';
import { AssistantStream } from "openai/lib/AssistantStream";
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import Spinner from './spinner';
import styles from "./chat.module.css";
import CareerGoodAt from './career-good-at';
import CharacterrReq from './career-required';

type ChatProps = {
    careertitle: string;
};

const CareerDiscoverGetter = ({
    careertitle,
}: ChatProps) => {

    return (
        <div>
            <h3>Discover {`${careertitle}`}</h3>
            <div className={styles.chatContainer}>
                <CareerGoodAt careertitle={careertitle} />
                <CharacterrReq careertitle={careertitle} />
            </div>
        </div>
    );
};

export default CareerDiscoverGetter;