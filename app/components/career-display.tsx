import React, { useEffect, useState } from 'react';
import { stripMarkdown, lowercaseKeys, transformResponse } from '../utils/career-utlities';
import CareerTabs from './career-tabs'

interface CareerDisplayProps {
    careers: { roles: string, text: string }[],
    handleGetCareerGoodAt: (careertitle: string) => Promise<any>,
    handleGetCareerReq: (careertitle: string) => Promise<any>,
}

const CareerDisplay: React.FC<CareerDisplayProps> = ({ careers, handleGetCareerGoodAt, handleGetCareerReq }) => {
    const [parsedCareers, setParsedCareers] = useState<any[]>([]);
    const [careerNames, setCareerNames] = useState<any[]>([]);
    useEffect(() => {
        if (careers.length > 0) {
            // console.log(careers, careers.length, 'CAREERS!!!!!!');
            // careers.map((career: any, index: number) => {
            //     const parsedCareer = JSON.parse(stripMarkdown(career.text));
            //     setParsedCareers([...parsedCareers, parsedCareer]);
            // })
            // console.log("test", typeof stripMarkdown(careers[careers.length - 1].text), JSON.parse(stripMarkdown(careers[careers.length - 1].text)))
            // const parsedCareers = JSON.parse(stripMarkdown(careers[careers.length - 1].text));
            // setParsedCareers(parsedCareers);
        }
        // if (careers.length > 0) {
        //     console.log(parsedCareers, careers, 'PARSED CAREERS!!!!!!');
        // }
        // setCareerNames(transformResponse(careers[0].text).map((career: any) => career.career));
    }, [careers]);
    const tenpfunc = async () => { };
    return (
        <div>
            {/* <h2 className={"text-center text-xl font-bold"}>Career List</h2>
            <CareerTabs fetchTabContentApi={handleGetCareerGoodAt} handleGetCareerReq={handleGetCareerReq} />
        */}
        </div> 
    );
};

export default CareerDisplay;
