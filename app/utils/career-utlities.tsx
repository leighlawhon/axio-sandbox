import { JSXElementConstructor, ReactElement } from "react";


export const addQuotesToKeys = (text: string): string => {
    const regex = /([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g;
    return text.replace(regex, '$1"$2":');
};
// chat cleaner
export const stripMarkdown = (text: string): string => {
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
export const parsedJSON = (text: string) => {
    return JSON.parse(stripMarkdown(text))
};

//CALLS


