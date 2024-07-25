import { JSXElementConstructor, ReactElement } from "react";


export const addQuotesToKeys = (text: string): string => {
    const regex = /([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g;
    return text.replace(regex, '$1"$2":');
};
// chat cleaner
export const stripMarkdown = (text: string): string => {
    if (!text.startsWith('`')) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            return text.slice(start, end + 1);
        }
        const startObj = text.indexOf('{');
        const endObj = text.lastIndexOf('}');
        if (startObj !== -1 && endObj !== -1) {
            return text.slice(startObj, endObj + 1);
        }
    }

    if (text.startsWith('```json\n') && text.endsWith('```')) {
        // console.log('json\n:', text, text.slice(8, -3), text.slice(7, -2));
        return text.slice(8, -3);
    }
    if (text.startsWith('```json') && text.endsWith('```')) {
        // console.log('```json:', text);
        return text.slice(6, -3);
    }
    return text;
};

// lowercase keys
export const lowercaseKeys = (arr: { [key: string]: string }[] | { [key: string]: string }): { [key: string]: string }[] | { [key: string]: string } => {
    if (Array.isArray(arr)) {
        return arr.map((obj) => {
            const newObj: { [key: string]: any } = {};
            for (const key in obj) {
                newObj[key.toLowerCase()] = obj[key];
            }
            return newObj;
        });
    } else if (typeof arr === 'object' && arr !== null) {
        const newObj: { [key: string]: any } = {};
        for (const key in arr) {
            newObj[key.toLowerCase()] = arr[key];
        }
        return newObj;
    } else {
        return arr;
    }
};


// apparently if there is only 1 item, JSON parse will mapping will return obj, rather than [obj]
export const parsedJSON = async (text: string) => {
    const stripped = await stripMarkdown(text);
    if (stripped) {
        const parsedObject = JSON.parse(stripped);
        const lowercaseObject = lowercaseKeys(parsedObject);
        return lowercaseObject;
    }
    return null;
};

//CALLS


