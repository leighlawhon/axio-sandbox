import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import CareerGoodAt from './career-good-at';
import CharacterrReq from './career-required';

interface CareerTabsProps {
    // Define your props here
    careers: any[];
}

const DiscoverTabs = ({ careers }) => (
    <Tabs.Root className="TabsRoot m-auto mt-3" defaultValue="tab-0">
        <Tabs.List className="TabsList" aria-label="Your Career recomendations">
            {careers.map((career: any, index: number) => (
                <Tabs.Trigger key={`tab-header-${index}`} className="TabsTrigger" value={`tab-${index}`}>
                    {career.career_name}
                </Tabs.Trigger>
            ))}
        </Tabs.List>
        {careers.map((career: any, index: number) => (
            <Tabs.Content className="TabsContent flex" value={`tab-${index}`}>
                <div className="flex-none w-80 pr-5" key={`tab-content-${index}`}>
                    <h2 className="text-bold mb-3 text-xl">{career.career_name}</h2>
                    <ul className="list-disc ml-5">
                        <li>{career.education}</li>
                        <li>{career.field_of_study.join(", ")}</li>
                        <li>{career.skills.join(", ")}</li>
                        <li>{career.job_outlook}</li>
                        <li>{career.median_salary}</li>
                    </ul>
                </div>
                <div className="grow border-l-2 pl-3 border-slate-100">
                    <h3 className="text-bold mb-5 text-xl">Discover a career in {`${career.career_name}`}</h3>
                    <div className="">
                        <CareerGoodAt careertitle={career.career_name} />
                        <CharacterrReq careertitle={career.career_name} />
                    </div>
                </div>
            </Tabs.Content>
        ))}

    </Tabs.Root>
);

export default DiscoverTabs;