import './Axis.css';
import * as React from 'react';
import { 
    select,
    axisBottom,
    axisLeft
} from 'd3';

import {
    Scales,
    SvgContainerData
} from './SvgContainer'

interface Props {
    svgContainerData?: SvgContainerData;
    scales?: Scales;
};

const Axis:React.FC<Props> = ({
    svgContainerData,
    scales
})=>{

    const drawXAxis = ()=>{

        const { dimension, g, clipPathId } = svgContainerData;

        const { height } = dimension;

        const mainGroup = select(g);

        const { x } = scales;

        const xAxis = axisBottom(x)
            .tickSizeInner(-(height))
            .tickPadding(7)

        const xAxisLabel = mainGroup.selectAll('.x.axis');

        if (!xAxisLabel.size()) {
            mainGroup
                .append('g')
                .attr('class', 'x axis')
                // .attr("clip-path", `url(#${clipPathId})`)
                .attr('transform', 'translate(0,' + height  + ')')
                .call(xAxis);
        } else {
            xAxisLabel
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis);
        }

    };

    const drawYAxis = ()=>{

        const { g, dimension } = svgContainerData;

        const { width } = dimension;

        const { y } = scales;

        const mainGroup = select(g);

        const yAxis = axisLeft(y)
            .ticks(9)
            .tickSizeInner(-(width))
            .tickPadding(5)

        const yAxisLabel = mainGroup.selectAll('.y.axis');

        if (!yAxisLabel.size()) {
            mainGroup
                .append('g')
                .attr('class', 'y axis')
                .call(yAxis);
        } else {
            yAxisLabel.call(yAxis);
        }
    };

    React.useEffect(()=>{

        if( svgContainerData && scales ){
            drawXAxis();
            drawYAxis();
        }

    }, [ svgContainerData, scales ]);

    return null;
};

export default Axis;