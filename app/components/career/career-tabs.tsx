import React, { Suspense, useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import PDFData from './career-pdf-data';
import TopTraits from './career-toptraits';
import CareerPrepare from './career-prepare';
import ChatHandler from '../chat-handler';
import FutureResume from './career-future-resume';

interface CareerTabsProps {
    tabHeaderArr: string[];
    careerContents: Array<object>;
}

interface CareerTabsHeaderProps {
    tabHeaderArr: string[];
}
interface CareerTabsContentProps {
    careerContents: Array<object>;
    tabHeaderArr: string[];
    activeTab: string;
}

const CareerTabs = ({ tabHeaderArr, careerContents }: CareerTabsProps) => {
    const [activeTab, setActiveTab] = useState<string>('tab-0');
    const [careerContentsDone, setCareerContentsDone] = useState(false);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };
    useEffect(() => {
        if (tabHeaderArr.length > 0) {
            setCareerContentsDone(true);
        }
    }, []);

    return (
        <div>
            {careerContentsDone &&
                (<Tabs.Root onValueChange={handleTabChange} className="TabsRoot m-auto mt-3" defaultValue="tab-0" >
                <RenrderTabsList tabHeaderArr={tabHeaderArr} />
                <RenderTabsContents tabHeaderArr={tabHeaderArr} activeTab={activeTab} careerContents={careerContents} />
                </Tabs.Root>)
            }
        </div>
    );
};


const RenrderTabsList = React.memo(({ tabHeaderArr }: CareerTabsHeaderProps) => {

    return (
        <div>
            {(
                <Tabs.List className="TabsList" aria-label="Your Career recommendations">
                    {tabHeaderArr.map((career_name: string, index: number) => (
                        <Tabs.Trigger key={`tab-header-${index}`} className="TabsTrigger" value={`tab-${index}`}>
                            {career_name}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
            )}
        </div>
    )
});


const RenderTabsContents = React.memo(({ activeTab, tabHeaderArr, careerContents }: CareerTabsContentProps) => {
    const [careerContentsDone, setCareerContentsDone] = useState(false);
    useEffect(() => {
        if (tabHeaderArr.length > 0) {
            setCareerContentsDone(true);
        }
    }, []);
    const rendervalue = (value: any) => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    };
    const futureResumeInterface = [{
        trait_name: null,
        example: null
    }];
    const topTraitsInterface = [{
        trait_name: null,
        my_aptitude: null,
        use_example: null
    }];
    const CareerPrepareInterface = [{
        task_name: null,
        detailed_steps: [''],
        task_time: null,
        estimated_cost: null,
        resource_links: ['']
    }];
    const pdfDataInterface = {
        career_training: [
            {
                characteristic: null,
                my_score: 0,
                population_score: null,
                same_education_score: null
            }
        ],
        job_satisfaction: [
            {
                prefference_name: null,
                my_preference: null,
            }
        ]
    };
    return tabHeaderArr.map((contentTitle: any, tabIndex: number) => (

        <Tabs.Content className="TabsContent " key={`tab-content-${tabIndex}`} value={`tab-${tabIndex}`}>
            <h2 className="text-blue-600 text-xl font-bold text-center">Imagine a career as a {contentTitle}</h2>
            <ChatHandler chatHandlerDataInitState={pdfDataInterface} threadRoute="careerthreads">
                <PDFData
                    fetchingData={false}
                    getChatHandler={function (content: string): void {
                        throw new Error("Function not implemented.");
                    }}
                    messageDone={false}
                    chatHandlerData={pdfDataInterface}
                    careertitle={contentTitle} />
            </ChatHandler>
            <div className=" career_banner p-1">
                <ul className="list-none grid grid-cols-5 gap-4">
                    {Object.entries(careerContents[tabIndex]).map(([key, value]) => (
                        key !== 'career_name' ? <li className="text-xs" key={`career-content-${tabIndex}-${key}`}>{key}: {rendervalue(value)}</li> : null
                    ))}
                </ul>
                </div>
            <div className="grid grid-cols-6 h-fit mt-3">
                <div className="col-span-2">
                    <h3 className=" text-blue-600 text-lg mb-3 font-bold">Your future resume...</h3>
                    <button className="mb-3 mt-1 border-2 px-2 border-blue-400 text-blue-400 font-bold border-solid rounded-md bg-white">Work Portfolio</button>
                    <ChatHandler chatHandlerDataInitState={futureResumeInterface} threadRoute="careerthreads">
                        <FutureResume
                            fetchingData={false}
                            getChatHandler={function (content: string): void {
                                throw new Error("Function not implemented.");
                            }}
                            messageDone={false}
                            chatHandlerData={futureResumeInterface}
                            careertitle={contentTitle}
                        />
                    </ChatHandler>
                </div>
                <div className="col-span-4">
                    <h3 className=" text-blue-600 text-lg  mb-3 font-bold">What it takes to succeed</h3>
                    <div className="">
                        <ChatHandler chatHandlerDataInitState={topTraitsInterface} threadRoute="careerthreads">
                            <TopTraits
                                fetchingData={false}
                                getChatHandler={function (content: string): void {
                                    throw new Error("Function not implemented.");
                                }}
                                messageDone={false}
                                chatHandlerData={topTraitsInterface}
                                careertitle={contentTitle}
                            />
                        </ChatHandler>
                    </div>
                </div>
            </div>
            <h3 className=" text-blue-600 text-lg  mb-3 font-bold">Next Steps</h3>
            <ChatHandler chatHandlerDataInitState={CareerPrepareInterface} threadRoute="careerthreads">
                <CareerPrepare
                    fetchingData={false}
                    getChatHandler={function (content: string): void {
                        throw new Error("Function not implemented.");
                    }}
                    messageDone={false}
                    chatHandlerData={CareerPrepareInterface}
                    careertitle={contentTitle}
                />
            </ChatHandler>
        </Tabs.Content>


    ))
})

export default React.memo(CareerTabs);