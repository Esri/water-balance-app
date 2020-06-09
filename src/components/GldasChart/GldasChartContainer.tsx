import * as React from 'react';
import styled from 'styled-components';
import { max, min } from 'd3';

import {
    GldasIdentifyTaskResults
} from '../../services/GLDAS/gldas';

import {
    GldasLayerName
} from '../../types'

import SvgContainer from './SvgContainer';
import Axis from './Axis';
import StackedArea from './StackedArea';
import Bar from './Bar';
import Line from './Line';
import MouseEventsRect from './MouseEventsRect';
import Tooltip from './Tooltip';
import ActiveTimeIndicator from './ActiveTimeIndicator';
import Header from './Header';

import {
    TimeExtentItem
} from '../App/App';

// 'Water Storage': Stacked Area showing Soil Moisture and Snowpack Data
// 'Water Flux': Bar and Lines shoing precip, evapo and runoff data 
type ChartType = 'Water Storage' | 'Water Flux' | 'Change in Storage';

const ChartTypeLookup: {
    [key in GldasLayerName ] : ChartType
} = {
    'Soil Moisture': 'Water Storage',
    'Snowpack': 'Water Storage',
    'Precipitation': 'Water Flux',
    'Evapotranspiration': 'Water Flux',
    'Runoff': 'Water Flux',
    'Change in Storage': 'Change in Storage'
};

const GldasChartContainerDiv = styled.div`
    position: relative;
    /* max-width: 1000px; */
    flex-grow: 1;
    flex-shrink: 1;
    /* flex-basis: 600px; */
    flex: auto;
    height: 100%;
`;

interface Props {
    data: GldasIdentifyTaskResults;
    timeExtent: Date[];
    activeLayer: GldasLayerName;

    selectedTimeExtentItem: TimeExtentItem;
    previewTimeExtentItem: TimeExtentItem;

    selectedItemOnChange: (d:TimeExtentItem)=>void;
    previewItemOnChange: (d:TimeExtentItem)=>void;
}

const GldasChartContainer:React.FC<Props> = ({
    data,
    timeExtent,
    activeLayer,

    selectedTimeExtentItem,
    previewTimeExtentItem,

    selectedItemOnChange,
    previewItemOnChange
})=>{

    const getYDomain = ()=>{

        if(!data){
            return [0, 0];
        }

        const chartType = ChartTypeLookup[activeLayer];

        if( chartType === 'Water Storage' ){

            const maxSoilMoisture = max(data["Soil Moisture"].map(d=>d.value));
            const maxSnowpack = max(data.Snowpack.map(d=>d.value));

            return [ 0, maxSoilMoisture + maxSnowpack ];
        }

        if( chartType === 'Change in Storage' ){

            const allValues = data["Change in Storage"].map(d=>d.value);
            const minVal = min(allValues);
            const maxVal = max(allValues);

            return [ minVal, maxVal ];
        }

        const maxPrecip = max(data.Precipitation.map(d=>d.value));
        const maxEvapo = max(data.Evapotranspiration.map(d=>d.value));
        const maxRunoff  = max(data.Runoff.map(d=>d.value));

        return [0, max([maxPrecip, maxEvapo, maxRunoff])];
    };

    const getDataForStackedArea = ()=>{

        return data && ChartTypeLookup[activeLayer] === 'Water Storage' 
            ? {
                'Soil Moisture': data["Soil Moisture"],
                'Snowpack': data['Snowpack']
            }
            : null;
    };

    const getDataForBar= ()=>{

        if(!data || (ChartTypeLookup[activeLayer] !== 'Water Flux' && ChartTypeLookup[activeLayer] !== 'Change in Storage') ){
            return null;
        }

        return ChartTypeLookup[activeLayer] === 'Change in Storage' 
            ? data["Change in Storage"] 
            : data.Precipitation;
    };

    const getDataForLines= ()=>{

        if(!data || ChartTypeLookup[activeLayer] !== 'Water Flux' ){
            return null;
        }

        return ( activeLayer === 'Precipitation' || activeLayer === 'Runoff')
            ? data.Runoff 
            : data.Evapotranspiration;
    };

    return (
        <GldasChartContainerDiv>

            <Header 
                activeLayer={activeLayer}
            />

            <SvgContainer
                timeExtent={timeExtent}
                yDomain={getYDomain()}
            >
                
                <StackedArea 
                    data={getDataForStackedArea()}
                />

                <Bar 
                    data={getDataForBar()}
                    isDiverging={activeLayer === 'Change in Storage'}
                />

                <Line 
                    data={getDataForLines()}
                />

                <Axis />

                <ActiveTimeIndicator 
                    activeTime={selectedTimeExtentItem.date}
                />

                <MouseEventsRect 
                    timeExtent={timeExtent}
                    onHover={(d)=>{
                        previewItemOnChange(d);
                    }}
                    onClick={(d)=>{
                        selectedItemOnChange(d);
                    }}
                />

                <Tooltip 
                    data={data}
                    activeLayer={activeLayer}
                    itemOnHover={previewTimeExtentItem}
                />

            </SvgContainer>

        </GldasChartContainerDiv>
    );
};

export default GldasChartContainer;