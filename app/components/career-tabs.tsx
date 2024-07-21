import React, { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import CareerGoodAt from './career-good-at';
import CharacterReq from './career-required';

interface CareerTabsProps {
    // Define your props here
    tabArr: string[];
    careerContents: Array<object>;
    goodAtContents: Array<object>;
    handleGetGoodAt: (careertitle: string) => Promise<any>;
    handleGetCareerReq: (careertitle: string) => Promise<any>;
}

interface CareerTabsHeaderProps {
    // Define your props here
    tabArr: string[];
    activeTab: string;
    handleTabChange: (value: string) => void;
}
interface CareerTabsContentProps {
    // Define your props here
    careerContents: Array<object>;
    tabArr: string[];
    goodAtContents: Array<object>;
    activeTab: string;
    handleTabChange: (value: string) => void;
    handleGetGoodAt: (careertitle: string) => Promise<any>;
    handleGetCareerReq: (tabId: string) => Promise<any>;
}

const CareerTabs = ({ handleGetCareerReq, handleGetGoodAt, tabArr, careerContents, goodAtContents }: CareerTabsProps) => {
    const [activeTab, setActiveTab] = useState<string>('tab-0');

    const handleTabChange = (value: string) => {
        console.log(value, 'VALUE!!!!!!');
    };

    return (
        <div>
            <Tabs.Root onValueChange={handleTabChange} className="TabsRoot m-auto mt-3" defaultValue="tab-0" >
                <RenrderTabsList handleTabChange={handleTabChange} tabArr={tabArr} activeTab={activeTab} />
                <RenderTabsContents tabArr={tabArr} handleTabChange={handleTabChange} activeTab={activeTab} goodAtContents={goodAtContents} handleGetCareerReq={handleGetCareerReq} handleGetGoodAt={handleGetGoodAt} careerContents={careerContents} />
            </Tabs.Root>
        </div>
    );
};


const RenrderTabsList = React.memo(({ tabArr, activeTab, handleTabChange }: CareerTabsHeaderProps) => {
    console.log(tabArr, 'TAB HEADERS CAREER TITLES!!!!!!');
    return (
        <Tabs.List className="TabsList" aria-label="Your Career recommendations">
            {tabArr.map((career_name: string, index: number) => (
                <Tabs.Trigger key={`tab-header-${index}`} className="TabsTrigger" value={`tab-${index}`}>
                    {career_name}
                </Tabs.Trigger>
            ))}
        </Tabs.List>
    )
});

const GoodAtContents = (title: any, handleGetGoodAt) => {

    const goodAtArr = handleGetGoodAt(title);
    console.log(title, goodAtArr, 'GOOD AT CONTENTS!!!!!!');
    if (goodAtArr.length > 0) {
        return title.forEach((goodAtObj: any) => {
            return (
                <ul>
                    {goodAtObj.map((goodAt: any) => {
                        return (
                            <li>{goodAt} </li>
                        )
                    })}
                </ul>
            )
        })
    }

}


const RenderTabsContents = React.memo(({ activeTab, tabArr, handleGetGoodAt, careerContents, goodAtContents }: CareerTabsContentProps) => {
    console.log(careerContents, 'TAB CONTENTS!!!!!!');

    return (
        <>
            {
                careerContents.length > 0 ? tabArr.map((contentTitle: any, tabIndex: number) => {
                    if (`tab-${tabIndex}` !== activeTab) {
                        return null; // Skip rendering if the tab is not active
                    } else {
                        GoodAtContents(tabArr[tabIndex], handleGetGoodAt)
                    }

                    <Tabs.Content className="TabsContent flex" key={`tab-content-${tabIndex}`} value={`tab-${tabIndex}`}>
                        {careerContents && (careerContents.map((career: any, index: number) => {
                            return (
                                <div key={`contnet-${tabIndex}`}>
                                    <h3>Discover: {contentTitle}</h3>
                                    <div className="flex-none w-80 pr-5">
                                        <ul className="list-disc ml-5">
                                            <li>{career.education}</li>
                                            {/* <li>{career.field_of_study.join(", ")}</li> */}
                                            {/* <li>{career.skills.join(", ")}</li> */}
                                            <li>{career.job_outlook}</li>
                                            <li>{career.median_salary}</li>
                                        </ul>
                                    </div>
                                    {/* <div className="grow border-l-2 pl-3 border-slate-100">
                                        <h4 className="font-bold mb-5 text-m">Discover your career match</h4>
                                        {GoodAtContents(goodAtContents, index)}
                                    </div> */}
                                </div>
                            )
                        }))}
                    </Tabs.Content>
                }) : <div></div>
            }

        </>
    )
});

export default React.memo(CareerTabs);