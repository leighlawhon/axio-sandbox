import React, { PureComponent } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CareerBarChartProps {
    data: {
        characteristic: string;
        my_score: number;
    }[];
}

interface CareerBarChartState {
    activeIndex: number;
}

export default class CareerBarChart extends PureComponent<CareerBarChartProps, CareerBarChartState> {
    constructor(props: CareerBarChartProps) {
        super(props);
        this.state = {
            activeIndex: 0,
        };
    }

    handleClick = (data: any, index: number) => {
        this.setState({
            activeIndex: index,
        });
    };

    render() {
        const { activeIndex } = this.state;
        const { data } = this.props;
        const activeItem = data[activeIndex];

        return (
            <div style={{ width: '100%' }}>
                <p>Click each score to see ways to improve </p>
                <ResponsiveContainer width="100%" height={100}>
                    <BarChart width={150} height={40} data={data}>
                        <XAxis dataKey="characteristic" />
                        <Bar dataKey="my_score" stackId="a" onClick={this.handleClick}>
                            {data.map((entry, index) => (
                                <Cell cursor="pointer" fill={index === activeIndex ? '#82ca9d' : '#8884d8'} key={`cell-${index}`} />
                            ))}
                        </Bar>
                        <Bar dataKey={"career_score"} stackId="a" onClick={this.handleClick}>
                            {data.map((entry, index) => (
                                <Cell cursor="pointer" fill={index === activeIndex ? '#cccccc' : '#666666'} key={`cell-${index}`} />
                            ))}
                        </Bar>

                    </BarChart>
                </ResponsiveContainer>
                {/* <p className="content">{`Uv of "${activeItem.name}": ${activeItem.uv}`}</p> */}
            </div>
        );
    }
}
