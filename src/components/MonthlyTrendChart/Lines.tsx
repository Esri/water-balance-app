import * as React from 'react';
import { select, curveCardinal, line  } from 'd3';

import {
    GldasLayerName
} from '../../types';

import {
    GldasIdentifyTaskResultItem,
} from '../../services/GLDAS/GLDAS';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import {
    UIConfig
} from '../../AppConfig';

interface Props {
    data?: GldasIdentifyTaskResultItem[][];
    activeLayer: GldasLayerName;
    index4SelectedMonth: number;
    svgContainerData?: SvgContainerData;
    scales?: Scales;
};

const LineGroupClassName = 'monthly-trend-line-group';
const LinePathClassName = 'monthly-trend-line';

const ColorLookup: Record<GldasLayerName, string> = {
    'Precipitation': UIConfig["precipitation-color"],
    'Runoff': UIConfig["water-flux-line-color"],
    'Evapotranspiration': UIConfig["water-flux-line-color"],
    'Soil Moisture': UIConfig["soil-moisture-color"],
    'Snowpack': UIConfig["snowpack-color"],
    'Change in Storage': '#333333',
};

const Line:React.FC<Props> = ({
    data,
    activeLayer,
    index4SelectedMonth,
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

        const containerGroup = select(containerG.current);

        const { x, y } = scales;

        const valueline = line<GldasIdentifyTaskResultItem>()
            .curve(curveCardinal)
            .x(d=>x(d.date.getFullYear()) + x.bandwidth() / 2)
            .y(d=>y(d.value));

        remove();

        containerGroup.append('g')
            .attr('class', LineGroupClassName)
            .selectAll("path")
            .data(data)
            .join("path")
            .attr('class', LinePathClassName)
            .attr("d", d => {
                return valueline(d)
            })
            .style('fill', 'none')
            .style('stroke', (d)=>{
                return ColorLookup[activeLayer];
            })
            .style('stroke-width', (d, index:number)=>{
                return index === index4SelectedMonth ? 2 : .5;
            })
            .style('opacity', (d, index:number)=>{
                return index === index4SelectedMonth ? 1 : .3;
            });
    };

    const remove = ()=>{

        const lineGroup = select(containerG.current).selectAll(`.${LineGroupClassName}`);
        
        if(lineGroup.size()){
            lineGroup.remove().exit();
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