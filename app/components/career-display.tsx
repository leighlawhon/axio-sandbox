import React, { useEffect, useState } from 'react';
import CareerDiscoverGetter from './career-discover-getter';
import { stripMarkdown, lowercaseKeys, transformResponse } from '../utils/career-utlities';
import CareerTabs from './careers-tabs';

interface CareerDisplayProps {
    careers: { roles: string, text: string }[],
}

const CareerDisplay: React.FC<CareerDisplayProps> = React.memo(({ careers }) => {
    const [parsedCareers, setParsedCareers] = useState<any[]>([]);
    const [careerNames, setCareerNames] = useState<any[]>([]);

    useEffect(() => {
        setParsedCareers(JSON.parse(stripMarkdown(careers[careers.length - 1].text)));
        // setCareerNames(transformResponse(careers[0].text).map((career: any) => career.career));
    }, []);

    return (
        <div>
            <h2 className={"text-center text-xl text-bold"}>Career List</h2>
            <CareerTabs careers={parsedCareers} />
        </div>
    );
});

export default CareerDisplay;
