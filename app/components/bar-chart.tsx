import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface CareerBarChartProps {
    data: {
        characteristic: string;
        my_score: number;
        same_education_score: string;
        population_score: string;
    }[];
}

const CareerBarChart: React.FC<CareerBarChartProps> = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeItem = data[activeIndex];
    const handleClick = (index: number) => {
        setActiveIndex(index);
    };

    return (
        <div style={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart width={150} height={40} data={data}>
                    <XAxis className="text-xs" dataKey="characteristic" />
                    <Bar dataKey="my_score" stackId="a" onClick={(data, index) => handleClick(index)}>
                        {data.map((entry, index) => (
                            <Cell cursor="pointer" fill={index === activeIndex ? '#82ca9d' : '#8884d8'} key={`cell-${index}`} />
                        ))}
                        <LabelList valueAccessor={(data) => `Same: ${data.same_education_score}`} className="text-xs" position="top" offset={25} ></LabelList>
                        <LabelList valueAccessor={(data) => `Pop: ${data.population_score}`} className="text-xs" position="top" offset={5} ></LabelList>
                        <LabelList className="text-white text-xs" valueAccessor={(data) => `${data.my_score}`} position="inside" offset={-15} ></LabelList>
                    </Bar>

                </BarChart>
            </ResponsiveContainer>


        </div>
    );
};

export default CareerBarChart;
