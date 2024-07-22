import React, { Suspense, useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import CareerGoodAt from './career-good-at';
import CharacterReq from './career-required';
import GoodAt from './career-good-at';

interface CareerTabsProps {
    // Define your props here
    canRender: boolean;
    tabArr: string[];
    careerContents: Array<object>;
}

interface CareerTabsHeaderProps {
    // Define your props here
    tabArr: string[];
}
interface CareerTabsContentProps {
    // Define your props here
    careerContents: Array<object>;
    tabArr: string[];
    activeTab: string;
}

const CareerTabs = ({ tabArr, careerContents, canRender }: CareerTabsProps) => {
    const [activeTab, setActiveTab] = useState<string>('tab-0');
    const [careerContentsDone, setCareerContentsDone] = useState(false);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };
    useEffect(() => {
        if (tabArr.length > 0) {
            setCareerContentsDone(true);
            console.log(canRender, careerContents, 'TEST CAN RENDER RENDERING TWICE');
        }
    }, []);

    return (
        <div>
            {careerContentsDone &&
                (<Tabs.Root onValueChange={handleTabChange} className="TabsRoot m-auto mt-3" defaultValue="tab-0" >
                    <RenrderTabsList tabArr={tabArr} />
                    <RenderTabsContents tabArr={tabArr} activeTab={activeTab} careerContents={careerContents} />
                </Tabs.Root>)
            }
        </div>
    );
};


const RenrderTabsList = React.memo(({ tabArr }: CareerTabsHeaderProps) => {

    return (
        <div>
            {(
                <Tabs.List className="TabsList" aria-label="Your Career recommendations">
                    {tabArr.map((career_name: string, index: number) => (
                        <Tabs.Trigger key={`tab-header-${index}`} className="TabsTrigger" value={`tab-${index}`}>
                            {career_name}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
            )}
        </div>
    )
});


const RenderTabsContents = React.memo(({ activeTab, tabArr, careerContents }: CareerTabsContentProps) => {
    const [careerContentsDone, setCareerContentsDone] = useState(false);
    useEffect(() => {
        if (tabArr.length > 0) {
            setCareerContentsDone(true);
        }
    }, []);
    return tabArr.map((contentTitle: any, tabIndex: number) => (

        <Tabs.Content className="TabsContent " key={`tab-content-${tabIndex}`} value={`tab-${tabIndex}`}>
            <h3 className="text-lg font-bold text-center">Discover {contentTitle}</h3>
            <CharacterReq careertitle={contentTitle} />
            <div className="flex">
                <div className=" pr-5">
                    <h4 className="text-md font-bold">General Infomation</h4>
                    {Object.entries(careerContents[tabIndex]).map(([key, value]) => (
                        <li key={`career-content-${tabIndex}-${key}`}>{key}: {value}</li>
                    ))}
                </div>
                <div className="">
                    <h4 className="text-md font-bold">Scenarios Utilizing My Strengths</h4>
                    <GoodAt careertitle={contentTitle} />
                </div>
            </div>

        </Tabs.Content>


    ))
})

export default React.memo(CareerTabs);