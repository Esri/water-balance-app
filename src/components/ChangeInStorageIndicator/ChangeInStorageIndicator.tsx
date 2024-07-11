import * as React from 'react';
import styled from 'styled-components';
import { max, min } from 'd3';

import {
    GldasIdentifyTaskResults,
    GldasIdentifyTaskResultsByMonth
} from '../../services/GLDAS/GLDAS';

import {
    TimeExtentItem
} from '../App/App';

import {
    average
} from '../../utils';

const ContainerDiv = styled.div`
    height: 100%;
    width: 70px;
    flex-grow: 0;
    flex-shrink: 0;
    margin-right: 10px;
`;

const GradientBarWrap = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const GradientBar = styled.div`
    position: relative;
    background: linear-gradient(to top, #67001f 0%, #b2182b 10%, #d6604d 20%, #f4a582 30%, #d1e5f0 50%, #92c5de 70%, #4393c3 80%, #2166ac 90%, #053061 100%);
    flex-grow: 1;
    width: 25px;
`;

const IndicatorLabelText = styled.span`
    font-size: 11px;
`;

const ChangeInStorageValueIndicator = styled.div`
    width: 100%;
    height: 3px;
    background-color: #303030;
`;

const Arrow4NormalValueIndicator = styled.div`
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 5px solid #129876;
    margin-right: .15rem;
`;

interface Props {
    data: GldasIdentifyTaskResults;
    gldasDataByMonth: GldasIdentifyTaskResultsByMonth;
    timeExtentItem: TimeExtentItem;
};

const ChangeInStorageIndicator:React.FC<Props> = ({
    data,
    gldasDataByMonth,
    timeExtentItem
})=>{

    const getChangeInStorageExtent = ()=>{
        const allVals = data["Change in Storage"].map(d=>d.value);

        const maxVal = max(allVals);

        const minVal = min(allVals);

        return {
            min: minVal,
            max: maxVal
        };
    }

    const getChangeInStorageValueIndicator = ()=>{

        const { index } = timeExtentItem;

        const changeInStorageVal = data["Change in Storage"][index].value;

        const { min, max } = getChangeInStorageExtent();

        const ratio = changeInStorageVal >= 0 
            ? ( 100 - (changeInStorageVal / max ) * 100 ) / 2
            : 100 - ( 100 - (Math.abs(changeInStorageVal / min)) * 100 ) / 2;

        return (
            <div
                style={{
                    'position': 'absolute',
                    'top': ratio + '%',
                    'width': '100%'
                }}
            >
                <ChangeInStorageValueIndicator />
            </div>
        );
    };

    const getNormalValueIndicator = ()=>{

        const { date } = timeExtentItem;

        const monthIndex = date.getMonth();

        const avgChangeInStorageForSelectedMonth = average(gldasDataByMonth["Change in Storage"][monthIndex].map(d=>d.value));

        const { min, max } = getChangeInStorageExtent();

        const ratio = (avgChangeInStorageForSelectedMonth / (max - min)) * 100;

        const topPosInPct = (50 + ratio) - 6;

        return (
            <div
                style={{
                    'position': 'absolute',
                    'top': topPosInPct + '%',
                    'left': '35px',
                    'width': '50px',
                    'color': '#129876',

                    'display': 'flex',
                    'alignItems': 'center'
                }}
            >
                <Arrow4NormalValueIndicator />
                <IndicatorLabelText>Normal</IndicatorLabelText>
            </div>
        )
    };

    return data && gldasDataByMonth ? (
        <ContainerDiv>

            <GradientBarWrap>
                <IndicatorLabelText>Recharge</IndicatorLabelText>
                <GradientBar>
                    { getChangeInStorageValueIndicator() }
                </GradientBar>
                <IndicatorLabelText>Depletion</IndicatorLabelText>
            </GradientBarWrap>

            { getNormalValueIndicator() }
            
        </ContainerDiv>
    ) : null;
};

export default ChangeInStorageIndicator;