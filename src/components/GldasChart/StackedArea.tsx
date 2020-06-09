import * as React from 'react';
import * as d3 from 'd3';

import {
    GldasIdentifyTaskResultItem
} from '../../services/GLDAS/gldas';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import { UIConfig } from '../../AppConfig';

const AreaPathClassName = 'water-storage-path-group';

interface Props {
    data?: {
        'Soil Moisture': GldasIdentifyTaskResultItem[];
        'Snowpack': GldasIdentifyTaskResultItem[];
    };
    svgContainerData?: SvgContainerData;
    scales?: Scales;
};

interface CombinedData {
    date: Date;
    'Soil Moisture': number;
    'Snowpack': number;
}

const StackedArea:React.FC<Props> = ({
    data,
    svgContainerData,
    scales
})=>{

    const containerG = React.useRef<SVGGElement>();

    const initContainer = ()=>{
        const { g } = svgContainerData;

        containerG.current = d3.select(g)
            .append('g')
            .node();
    };

    const draw = ()=>{

        const { clipPathId } = svgContainerData;

        const { x, y } = scales;

        const combinedData:CombinedData[] = data["Soil Moisture"].map((d, i)=>{

            const soilMoisture = d.value;
            const date = d.date;
            const snowpack = data.Snowpack[i].value;

            return {
                date,
                'Soil Moisture': soilMoisture,
                'Snowpack': snowpack
            }
        });

        const series = d3.stack<CombinedData>()
            .keys([ 'Soil Moisture', 'Snowpack' ])(combinedData);
        // console.log(series)

        const area = d3.area<{
            0: number;
            1: number;
            data: CombinedData
        }>()
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))

        remove();

        d3.select(containerG.current)
            .append('g')
            .attr('class', AreaPathClassName)
            .attr("clip-path", `url(#${clipPathId})`)
            .selectAll(`path`)
                .data(series)
            .join("path")
                .attr("fill", ({key}) => {
                    return key === 'Soil Moisture' 
                        ? UIConfig["soil-moisture-color"] 
                        : UIConfig["snowpack-color"]
                })
                .attr("d", area)

    };

    const remove = ()=>{

        const areas = d3.select(containerG.current)
            .select(`.${AreaPathClassName}`);
        
        if(areas.size()){
            areas.remove();
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

export default StackedArea;