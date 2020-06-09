import './Axis.scss';
import * as React from 'react';
import * as d3 from 'd3';

import {
    Scales,
    SvgContainerData
} from './SvgContainer'
import { UIConfig } from '../../AppConfig';

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

        const mainGroup = d3.select(g);

        const { x } = scales;

        const xAxis = d3
            .axisBottom(x)
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

        const mainGroup = d3.select(g);

        const yAxis = d3
            .axisLeft(y)
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