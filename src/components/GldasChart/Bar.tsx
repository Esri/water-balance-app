import * as React from 'react';
import { select } from 'd3';

import {
    GldasIdentifyTaskResultItem
} from '../../services/GLDAS/GLDAS';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import {
    UIConfig
} from '../../AppConfig';

const BarRectGroupClassName = 'precip-rect-group';
const BarRectClassName = 'precip-rect';

interface Props {
    data?: GldasIdentifyTaskResultItem[];
    isDiverging?: boolean;
    svgContainerData?: SvgContainerData;
    scales?: Scales;
};

const Bar:React.FC<Props> = ({
    data,
    isDiverging,
    svgContainerData,
    scales
})=>{

    const containerG = React.useRef<SVGGElement>();

    const initContainer = ()=>{
        const { g } = svgContainerData;

        containerG.current = select(g)
            .append('g')
            .node();
    };


    const draw = ()=>{

        const { dimension, clipPathId } = svgContainerData;

        const { height } = dimension;

        const { xScaleBand, y } = scales;

        remove();

        select(containerG.current)
            .append('g')
            .attr('class', BarRectGroupClassName)
            .attr("clip-path", `url(#${clipPathId})`)
            .selectAll(`.${BarRectClassName}`)
                .data(data)
            .enter().append("rect")
                .attr("class", BarRectClassName)
                .style('fill', d=>{
                    return isDiverging 
                        ? d.value >= 0 ? UIConfig["change-in-storage-positive"] : UIConfig["change-in-storage-negative"]
                        : UIConfig["precipitation-color"] 
                })
                .attr("x", d=>xScaleBand(d.date.getTime()))
                .attr("width", xScaleBand.bandwidth() )
                .attr("y", d=>{
                    return isDiverging
                        ? y(Math.max(0, d.value))
                        : y(d.value)
                })
                .attr("height", (d)=>{
                    return isDiverging 
                        ? Math.abs(y(d.value) - y(0))
                        : height - y(d.value)
                })
                
    };

    const remove = ()=>{

        const existingBars = select(containerG.current)
            .selectAll(`.${BarRectGroupClassName}`);

        if (existingBars.size()) {
            existingBars.remove()
        }
    };

    React.useEffect(()=>{
        if( svgContainerData){
            initContainer();
        }
    }, [ svgContainerData ]);

    React.useEffect(()=>{
        if( svgContainerData && scales && data ){
            draw();
        }
    }, [ scales ]);

    React.useEffect(()=>{
        if( svgContainerData && scales ){
            data ? draw() : remove();
        }
    }, [ data ]);

    return null;
};

export default Bar;