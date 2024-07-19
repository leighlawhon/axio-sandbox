import Markdown from "react-markdown";
import styles from "./chat.module.css";

type MessageProps = {
    role: "user" | "assistant" | "code";
    text: string;
};


export const UserMessage = ({ text }: { text: string }) => {
    return <div className={styles.userMessage}>{text}</div>;
};

export const AssistantMessage = ({ text }: { text: string }) => {
    return (
        <div className={styles.assistantMessage}>
            <Markdown>{text}</Markdown>
        </div>
    );
};

export const CodeMessage = ({ text }: { text: string }) => {
    return (
        <div className={styles.codeMessage}>
            {text.split("\n").map((line, index) => (
                <div key={index}>
                    <span>{`${index + 1}. `}</span>
                    {line}
                </div>
            ))}
        </div>
    );
};

export const Message = ({ role, text }: MessageProps) => {
    switch (role) {
        case "user":
            return <UserMessage text={text} />;
        case "assistant":
            return <AssistantMessage text={text} />;
        case "code":
            return <CodeMessage text={text} />;
        default:
            return null;
    }
};