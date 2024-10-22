import * as React from 'react';
import { 
    select,
    line,
    curveMonotoneX
} from 'd3';

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

interface Props {
    data?: GldasIdentifyTaskResultItem[];
    svgContainerData?: SvgContainerData;
    scales?: Scales;
};

const LinePathClassName = 'water-flux-line';

const Line:React.FC<Props> = ({
    data,
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

        const { clipPathId } = svgContainerData;

        const containerGroup = select(containerG.current);

        const { x, y, xScaleBand } = scales;

        const xOffset = xScaleBand.bandwidth() / 2;

        const valueline = line<GldasIdentifyTaskResultItem>()
            .curve(curveMonotoneX)
            .x(d=>x(d.date) - xOffset)
            .y(d=>y(d.value));

        remove();

        containerGroup.append("path")
            .data([data])
            .attr("class", LinePathClassName)
            .attr("clip-path", `url(#${clipPathId})`)
            .attr("d", valueline)
            .style('fill', 'none')
            .style('stroke', '#fff')
            .style('stroke-width', 4)
            .style('opacity', .8)

        containerGroup.append("path")
            .data([data])
            .attr("class", LinePathClassName)
            .attr("clip-path", `url(#${clipPathId})`)
            .attr("d", valueline)
            .style('fill', 'none')
            .style('stroke', UIConfig["water-flux-line-color"])
            .style('stroke-width', 2);
    };

    const remove = ()=>{

        const lines = select(containerG.current).selectAll(`.${LinePathClassName}`);
        
        // check the number of existing lines, if greater than 0; remove all existing ones
        if(lines.size()){
            lines.remove().exit();
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

export default Line;