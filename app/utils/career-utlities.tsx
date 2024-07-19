import { JSXElementConstructor, ReactElement } from "react";


export const addQuotesToKeys = (text: string): string => {
    const regex = /([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g;
    return text.replace(regex, '$1"$2":');
};
// chat cleaner
export const stripMarkdown = (text: string): string => {
    if (text.startsWith('```json') && text.endsWith('```')) {
        return text.slice(7, -3);
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

export const transformResponse = (text: string): any | any[] => {
    const data_strip = stripMarkdown(text);
    let data: any;
    try {
        data = JSON.parse(data_strip);
        console.log('Data!@!!!!!!!!!!!', data);
    } catch (error) {
        try {
            data = JSON.parse(addQuotesToKeys(data_strip));
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    }
    if (typeof data === 'string') {
        return <p>{data}</p>;
    } else if (Array.isArray(data)) {
        return data.map((item: any, index: number) => (
            typeof item === 'object' ? transformResponse(JSON.stringify(item)) : item
        ))
    } else if (typeof data === 'object' && data !== null) {
        data = lowercaseKeys(data);
        return Object.keys(data).map((key: string, index: number) => (
            typeof data[key] === 'object' ? transformResponse(JSON.stringify(data[key])) : data[key]
        ))

    } else {
        return [];
    }
};

export const transformData = (text: string): any | any[] => {
    const data_strip = stripMarkdown(text);
    let data: any;
    try {
        data = JSON.parse(data_strip);
    } catch (error) {
        try {
            data = JSON.parse(addQuotesToKeys(data_strip));
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    }
    if (typeof data === 'string') {
        return <p>{data}</p>;
    } else if (Array.isArray(data)) {
        return (
            <ul>
                {data.map((item: any, index: number) => (
                    <li key={index}>
                        {typeof item === 'object' ? transformData(JSON.stringify(item)) : item}
                    </li>
                ))}
            </ul>
        );
    } else if (typeof data === 'object' && data !== null) {
        data = lowercaseKeys(data);
        return (
            <ul>
                {Object.keys(data).map((key: string, index: number) => (
                    <li key={index}>
                        <strong>{key}: </strong>
                        {typeof data[key] === 'object' ? transformData(JSON.stringify(data[key])) : data[key]}
                    </li>
                ))}
            </ul>
        );
    } else {
        return <div></div>;
    }
};
