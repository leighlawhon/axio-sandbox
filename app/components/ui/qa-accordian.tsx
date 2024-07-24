import React, { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

interface QAItem {

}

interface QAAccordionProps {
    characterReq: string[];
    jobSat: string[];
}

const QAAccordion: React.FC<QAAccordionProps> = ({ characterReq, jobSat }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <Accordion.Root className="AccordionRoot" type="single" defaultValue="" collapsible>
            <Accordion.Item className="AccordionItem" value="item-1" data-state="closed">
                <Accordion.Header>
                    <Accordion.Trigger className="text-xs w-full relative" data-state="closed">
                        <span className="font-bold text-xs ">QA against PDF</span>
                        <ChevronDownIcon className="absolute right-1 top-0" />
                    </Accordion.Trigger>
                    <Accordion.Trigger />
                </Accordion.Header>
                <Accordion.Content>
                    <h5>CAREER TRAINING POTENTIALS</h5>
                    {characterReq.map((item, index) => {
                        return (
                            <p className="text-xs" key={`career-content-${index}`}>
                                {Object.entries(item).map(([key, value]) => (
                                    <span className="pr-2" key={`career-content-${key}`}>
                                        <strong>{key}:</strong> {String(value)}
                                    </span>
                                ))}
                            </p>
                        )
                    })}
                    <h5>JOB SATISFACTION INDICATORS</h5>
                    {jobSat.map((item, index) => {
                        return (
                            <p className="text-xs" key={`job-sat-content-${index}`}>
                                {Object.entries(item).map(([key, value]) => (
                                    <span className="pr-2" key={`job-sat-content-${key}`}>
                                        <strong>{key}:</strong> {String(value)}
                                    </span>
                                ))}
                            </p>
                        );
                    })}
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    );
};

export default QAAccordion;