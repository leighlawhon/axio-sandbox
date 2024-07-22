import React, { Suspense, useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import CareerGoodAt from './career-good-at';
import CharacterReq from './career-required';
import GoodAt from './career-good-at';
import TopTraits from './career-toptraits';
import CareerPrepare from './career-prepare';

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
    const rendervalue = (value: any) => {
        if (typeof value === 'object') {
            return Object.values(value).join(', ');
        }
        return value;
    };
    return tabArr.map((contentTitle: any, tabIndex: number) => (

        <Tabs.Content className="TabsContent " key={`tab-content-${tabIndex}`} value={`tab-${tabIndex}`}>
            <h2 className="text-sky-600 text-xl font-bold text-center">Imagine a career as a {contentTitle}</h2>
            <CharacterReq careertitle={contentTitle} />
            <div className=" career_banner p-1">
                <ul className="list-none grid grid-cols-5 gap-4">
                    {Object.entries(careerContents[tabIndex]).map(([key, value]) => (
                        key !== 'career_name' ? <li className="text-xs" key={`career-content-${tabIndex}-${key}`}>{key}: {rendervalue(value)}</li> : null
                    ))}
                </ul>
                </div>
            <div className="grid grid-cols-6 h-fit mt-3">
                <div className="col-span-2">
                    <h3 className=" text-sky-600 text-lg mb-3 font-bold">Your future resume...</h3>
                    <GoodAt careertitle={contentTitle} />
                </div>
                <div className="col-span-4">
                    <h3 className=" text-sky-600 text-lg  mb-3 font-bold">What it takes to succeed</h3>
                    <div className="">
                        <TopTraits careertitle={contentTitle} />
                    </div>
                </div>
            </div>
            <h3 className=" text-sky-600 text-lg  mb-3 font-bold">Next Steps</h3>
            <CareerPrepare careertitle={contentTitle} />
        </Tabs.Content>


    ))
})

export default React.memo(CareerTabs);