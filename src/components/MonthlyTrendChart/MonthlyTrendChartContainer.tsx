import * as React from 'react';
import styled from 'styled-components';
import { max, min } from 'd3';

import {
    GldasIdentifyTaskResultsByMonth
} from '../../services/GLDAS/gldas';

import {
    GldasLayerName
} from '../../types';

import {
    TimeExtentItem
} from '../App/App';

import Axis from './Axis';
import SvgContainer from './SvgContainer';
import Lines from './Lines';
import MouseEventsRect, { MouseEventItem } from './MouseEventsRect';
import Tooltip from './Tooltip';
import Header from './Header';

const ContainerDiv = styled.div`
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    width: 375px;
    height: 100%;
`;

interface Props {
    data: GldasIdentifyTaskResultsByMonth;
    activeLayer: GldasLayerName;
    timeExtentItem: TimeExtentItem;
}

const MonthlyTrendChart:React.FC<Props> = ({
    data,
    activeLayer,
    timeExtentItem
})=>{

    const [ itemOnHover, setItemOnHOver ] = React.useState<MouseEventItem>();

    const getXDomain = ()=>{
        if(!data){
            return [];
        }

        return data[activeLayer][0].map(d=>{
            return d.date.getFullYear();
        })
        
    };

    const getYDomain = ()=>{
        if(!data){
            return null;
        }

        let maxVal = Number.NEGATIVE_INFINITY;
        let minVal = Number.POSITIVE_INFINITY;

        data[activeLayer].forEach(d=>{
            const values = d.map(d=>d.value);
            const maxInGroup = max(values);
            const minInGroup = min(values);

            maxVal = maxInGroup > maxVal ? maxInGroup : maxVal;
            minVal = minInGroup < minVal ? minInGroup : minVal;
        });

        return [minVal, maxVal]
    };

    const getDataForLines = ()=>{
        if(!data){
            return null;
        }

        return data[activeLayer];
    };

    return (
        <ContainerDiv>
            <Header 
                activeLayer={activeLayer}
                timeExtentItem={timeExtentItem}
            />

            <SvgContainer
                xDomain={getXDomain()}
                yDomain={getYDomain()}
            >

                <Lines 
                    data={getDataForLines()}
                    activeLayer={activeLayer}
                    index4SelectedMonth={timeExtentItem ? timeExtentItem.date.getMonth() : -1}
                />

                <Axis />

                <Tooltip 
                    data={getDataForLines()}
                    itemOnHover={itemOnHover}
                    selectedDate={timeExtentItem?.date}
                />

                <MouseEventsRect 
                    onHover={setItemOnHOver}
                />

            </SvgContainer>
        </ContainerDiv>
    );
};

export default MonthlyTrendChart;