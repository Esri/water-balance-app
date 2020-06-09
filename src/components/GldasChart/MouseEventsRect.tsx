import * as React from 'react';
import * as d3 from 'd3';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import {
    TimeExtentItem
} from '../App/App';

interface Props {
    timeExtent: Date[];
    svgContainerData?: SvgContainerData;
    scales?: Scales;

    onClick?: (d?:TimeExtentItem)=>void;
    onHover?: (d?:TimeExtentItem)=>void;
};

const VerticalRefLineClassName = 'vertical-ref-line'

const MouseEventsRect:React.FC<Props> = ({
    timeExtent,
    svgContainerData,
    scales,

    onClick,
    onHover
})=>{

    const containerG = React.useRef<SVGGElement>();

    const itemOnHover = React.useRef<TimeExtentItem>();

    const init = ()=>{

        const { g, dimension } = svgContainerData;

        const { height, width } = dimension;

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
            .attr("stroke", "#fff")
            .style("fill", "none");

        container.append("rect")
            // .attr("class", ClassNames.BackgroundRect)
            .attr("width", width)
            .attr("height", height)
            .attr('fill', 'rgba(0,0,0,0)')
            .on("click", ()=>{
                setItemOnClick(itemOnHover.current)
            })
            .on("mouseleave", ()=>{
                setItemOnHover(null);
            })
            .on("mousemove", function(){
                const mousePosX = d3.mouse(this)[0];
                setItemOnHover(getItemByMousePos(mousePosX));
            });
    };

    const setItemOnHover = (item?:TimeExtentItem)=>{
        itemOnHover.current = item;
        updateVerticalRefLinePos();
        onHover(item);
    };

    const setItemOnClick = (item?:TimeExtentItem)=>{
        onClick(item);
    }

    const updateVerticalRefLinePos = ():void=>{

        const { xScaleBand } = scales;

        const item = itemOnHover.current;

        const vRefLine = d3.select(containerG.current)
            .select(`.${VerticalRefLineClassName}`);

        const xPos = item ? 
            xScaleBand(item.date.getTime()) +  xScaleBand.bandwidth() / 2
            : 0;

        const opacity = item ? 1 : 0;

        vRefLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .style('opacity', opacity);
    };

    const getItemByMousePos = (mousePosX:number):TimeExtentItem=>{

        let itemIndex = -1;
        const { x } = scales;

        for(let i = 0, len = timeExtent.length; i < len; i++){

            const currItem = timeExtent[i];
            const currItemPos = x(currItem);

            const nextItemIndex = timeExtent[i + 1] ? i + 1 : i;
            const nextItem = timeExtent[nextItemIndex];
            const nextItemPos = x(nextItem);

            if(mousePosX >= currItemPos && mousePosX <= nextItemPos){

                const distToCurrItem = Math.abs(mousePosX - currItemPos);
                const distToNextItem = Math.abs(mousePosX - nextItemPos);

                itemIndex = distToCurrItem < distToNextItem ? i : nextItemIndex;

                break;
            }
        }

        return {
            date: timeExtent[itemIndex],
            index: itemIndex
        };
    };

    React.useEffect(()=>{

        if( svgContainerData && timeExtent.length ){
            init();
        }

    }, [ svgContainerData, timeExtent ]);

    React.useEffect(()=>{

        if( svgContainerData && scales ){

            const { dimension } = svgContainerData;
            const { width } = dimension;

            d3.select(containerG.current)
                .select('rect')
                .attr('width', width);
        }

    }, [ scales ]);

    return null;
};

export default MouseEventsRect;