import React, { use, useEffect, useState } from 'react';

interface CareerListProps { careers: { roles: string, text: string }[] }
const CareerList: React.FC<CareerListProps> = ({ careers }) => {
    const [parsedCareers, setParsedCareers] = useState<{ career: string, education: string, field_of_study: string }[] | { [key: string]: string }[]>([]);
    // const [parsedCareers, setParsedCareers] = useState<string>([{ career: string, education: string, field_of_study: string, job_outlook: string, median_salary: string, related_occupations: string, skills: string }]);
    console.log('Careers:', careers);
    const stripJsonTags = (text: string): string => {
        if (text.startsWith('```json') && text.endsWith('```')) {
            return text.slice(7, -3);
        }
        return text;
    };

    const lowercaseKeys = (arr: { [key: string]: string }[]): { [key: string]: string }[] => {
        return arr.map((obj) => {
            const newObj: { [key: string]: any } = {};
            for (const key in obj) {
                newObj[key.toLowerCase()] = obj[key];
            }
            return newObj;
        });
    };

    useEffect(() => {
        try {
            if (!careers || careers.length === 0) return;
            const careersParsed = JSON.parse(stripJsonTags(careers[0].text));
            const keyslowercase = lowercaseKeys(careersParsed);
            setParsedCareers(keyslowercase);
            console.log('Parsed careers:', careersParsed, parsedCareers);
        } catch (error) {
            console.error('Error parsing careers data:', error);
        }
    }, [careers]);
    // const parseCareers = (): string => {
    const exploreMore = async (title: string) => {

    }
    return (
        <div>
            <h2>Career List</h2>
            <div className="flex">
                {parsedCareers.map((_career, _index) => {
                    return (
                        <>
                            <div key={`career-${_index}`}>{_career.career}</div>
                            <button onClick={() => exploreMore(_career.career)}>Explore This Career</button>
                        </>
                    )
                })
                }
            </div>
        </div>
    );
};

export default CareerList;