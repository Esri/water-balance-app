import * as React from 'react';
import * as d3 from 'd3';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

export interface MouseEventItem {
    itemIndex: number;
    value: number;
}

interface Props {
    svgContainerData?: SvgContainerData;
    scales?: Scales;
    onHover?: (d?:MouseEventItem)=>void;
};

const VerticalRefLineClassName = 'monthly-trend-vertical-ref-line'

const MouseEventsRect:React.FC<Props> = ({
    svgContainerData,
    scales,
    onHover
})=>{

    const containerG = React.useRef<SVGGElement>();

    const itemOnHover = React.useRef<MouseEventItem>();

    const init = ()=>{

        const { g, height, width } = svgContainerData;

        containerG.current = d3.select(g)
            .append('g')
            .node();
        
        const container = d3.select(containerG.current);

        container.append('line')
            .attr('class', VerticalRefLineClassName)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height)
            .style("opacity", 0)
            .attr('stroke-width', 0.5)
            .attr("stroke", "rgba(0,0,0,.7)")
            .style("fill", "none");

        container.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr('fill', 'rgba(0,0,0,0)')
            .on("mouseleave", ()=>{
                setItemOnHover(undefined);
            })
            .on("mousemove", function(){
                const mousePosX = d3.mouse(this)[0];
                getItemByMousePos(mousePosX);
                setItemOnHover(getItemByMousePos(mousePosX));
            });
    };

    const setItemOnHover = (item:MouseEventItem)=>{
        itemOnHover.current = item;
        updateVerticalRefLinePos();
        onHover(item);
    };

    const updateVerticalRefLinePos = ()=>{

        const { x } = scales;

        const item = itemOnHover.current;

        const vRefLine = d3.select(containerG.current)
            .select(`.${VerticalRefLineClassName}`);

        const xPos = item ? 
            x(item.value) + x.bandwidth() / 2
            : 0;

        const opacity = item ? 1 : 0;

        vRefLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .style('opacity', opacity);
    };

    const getItemByMousePos = (mousePosX:number):MouseEventItem=>{

        let itemIndex = -1;
        const { x } = scales;
        const domain = x.domain();

        for(let i = 0, len = domain.length; i < len; i++){

            const currItem = domain[i];
            const currItemPos = x(currItem);

            const nextItemIndex = domain[i + 1] ? i + 1 : i;
            const nextItem = domain[nextItemIndex];
            const nextItemPos = x(nextItem);

            if(mousePosX >= currItemPos && mousePosX <= nextItemPos){

                const distToCurrItem = Math.abs(mousePosX - currItemPos);
                const distToNextItem = Math.abs(mousePosX - nextItemPos);

                itemIndex = distToCurrItem < distToNextItem ? i : nextItemIndex;

                break;
            }
        }

        // console.log(itemIndex)
        return itemIndex > -1 
            ? {
                itemIndex,
                value: domain[itemIndex]
            }
            : undefined
    };

    React.useEffect(()=>{

        if( svgContainerData && scales && !containerG.current){
            init();
        }

    }, [ svgContainerData, scales ]);

    return null;
};

export default MouseEventsRect;