import * as React from 'react';
import { select } from 'd3';
import { format } from 'date-fns';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';
import { UIConfig } from '../../AppConfig';

export interface CandidateItem {
    date: Date;
    index: number;
}

interface Props {
    activeTime: Date;
    svgContainerData?: SvgContainerData;
    scales?: Scales;

    onClick?: (d?:CandidateItem)=>void;
    onHover?: (d?:CandidateItem)=>void;
};

const IndicatorLineClassName = 'active-time-indicator-line';
const IndicatorRectClassName = 'active-time-indicator-rect';
const IndicatorTextClassName = 'active-time-indicator-text';
const IndicatorColor = 'rgb(160, 0, 0)';

const ActiveTimeIndicator:React.FC<Props> = ({
    activeTime,
    svgContainerData,
    scales,
})=>{

    const containerG = React.useRef<SVGGElement>();

    const init = ()=>{

        const { g, dimension, clipPathId } = svgContainerData;

        const { height } = dimension;

        containerG.current = select(g)
            .append('g')
            .node();
        
        const container = select(containerG.current);

        container.append('line')
            .attr('class', IndicatorLineClassName)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height)
            .style("opacity", 1)
            .attr('stroke-width', 0.5)
            .attr("stroke", IndicatorColor)
            .style("fill", "none");

        container.append('rect')
            .attr('width', 60)
            .attr('height', 20)
            .attr("transform", "translate(-30, -20)")
            .attr('class', IndicatorRectClassName)
            .style('fill', IndicatorColor);

        container.append("text")
            .attr('class', IndicatorTextClassName)
            .attr("dy", "-5")
            .attr("text-anchor", "middle")
            .style('font-size', '.75rem')
            .style('fill', '#fff');
    };

    const updateVerticalRefLinePos = ():void=>{

        if(!activeTime){
            return;
        }

        const { dimension } = svgContainerData;

        const { xScaleBand } = scales;

        const container = select(containerG.current);

        const xPos = xScaleBand(activeTime.getTime()) + xScaleBand.bandwidth() / 2;

        container.select(`.${IndicatorTextClassName}`)
            .text(format(activeTime, UIConfig["active-date-format-pattern"]))

        container.attr(
            'transform', 
            `translate(${xPos}, 0)`
        )
        .style('opacity', xPos < dimension.width ? 1: 0);
    };

    React.useEffect(()=>{

        if( svgContainerData ){
            init();
        }

    }, [ svgContainerData ]);

    React.useEffect(()=>{

        if( activeTime && scales ){
            updateVerticalRefLinePos();
        }

    }, [ activeTime, scales ]);

    return null;
};

export default ActiveTimeIndicator;