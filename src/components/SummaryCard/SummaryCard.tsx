import * as React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';

import {
    GldasIdentifyTaskResults,
    GldasIdentifyTaskResultsByMonth
} from '../../services/GLDAS/GLDAS';

import {
    TimeExtentItem
} from '../App/App';
import { UIConfig } from '../../AppConfig';

import {
    average
} from '../../utils';

const SummaryCardContainer = styled.div`
    width: 230px;
    flex-grow: 0;
    flex-shrink: 0;
    margin-right: 10px;
`;

const SummaryTableRow = styled.div`
    border-bottom: 1px solid rgba(255,255,255,.5);
    padding: .05rem 0;
    display: flex;
    justify-content: space-between;
`;

const SummaryTableValueCellStyle:React.CSSProperties = {
    'fontWeight': 600
};

interface Props {
    data: GldasIdentifyTaskResults;
    gldasDataByMonth: GldasIdentifyTaskResultsByMonth;
    timeExtentItem: TimeExtentItem;
}

const SummaryCard:React.FC<Props> = ({
    data,
    gldasDataByMonth,
    timeExtentItem,
    // selectedTimeExtentItem,
    // previewTimeExtentItem
})=>{

    const saveDataAsCsv = ()=>{

        const keys = Object.keys(data);
        const headers = ['Time', ...keys.map(key=>key + ' (mm)')];
        const allDates = data.Precipitation.map(d=>d.date);

        let str = "data:text/csv;charset=utf-8,";

        // set csv headers
        str += headers.join(',');
        str += '\r\n';

        for(let i = 0, len = allDates.length; i < len; i++){

            const gldasValues = keys.map((key)=>{
                const d = data as any
                return d[key][i].value
            })

            const rowStr = [
                format(allDates[i], 'MM/dd/u'),
                ...gldasValues
            ].join(',');

            str += rowStr + '\r\n';
        }

        const link = document.createElement('a');
        link.download = 'water-balance-data.csv';
        link.href = encodeURI(str);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTitle = ()=>{

        const { date } = timeExtentItem;

        return (
            <div className='text-center'>
                <span className='avenir-demi font-size--1'>
                    { format(date, UIConfig["active-date-format-pattern"])}
                </span>
            </div>
        );
    };

    const getTable = ()=>{

        const { index } = timeExtentItem;

        return (
            <div className='font-size--3'>

                <SummaryTableRow>
                    <span>Precipitation</span>
                    <span
                        style={{
                            ...SummaryTableValueCellStyle,
                            'color': UIConfig["precipitation-color"]
                        }}
                    >{data.Precipitation[index].value} mm</span>
                </SummaryTableRow>

                <SummaryTableRow>
                    <span>Runoff</span>
                    <span
                        style={{
                            ...SummaryTableValueCellStyle,
                            'color': UIConfig["water-flux-line-color"]
                        }}
                    >{data.Runoff[index].value} mm</span>
                </SummaryTableRow>

                <SummaryTableRow>
                    <span>Evapotranspiration</span>
                    <span
                        style={{
                            ...SummaryTableValueCellStyle,
                            'color': UIConfig["water-flux-line-color"]
                        }}
                    >{data.Evapotranspiration[index].value} mm</span>
                </SummaryTableRow>

                <SummaryTableRow>
                    <span>Soil Moisture</span>
                    <span
                        style={{
                            ...SummaryTableValueCellStyle,
                            'color': UIConfig["soil-moisture-color"]
                        }}
                    >{data["Soil Moisture"][index].value} mm</span>
                </SummaryTableRow>

                <SummaryTableRow>
                    <span>Snowpack</span>
                    <span
                        style={{
                            ...SummaryTableValueCellStyle,
                            'color': '#fafafa'
                        }}
                    >{data.Snowpack[index].value} mm</span>
                </SummaryTableRow>
            </div>
        )

    };

    const getDescription = ()=>{

        const { index, date } = timeExtentItem;

        const monthIndex = date.getMonth();

        const changeInStorageVal = data["Change in Storage"][index].value;

        const changeInStorageText = (
            <span 
                className='avenir-demi'
                style={{
                    'color': changeInStorageVal >= 0 ? UIConfig["precipitation-color"] : UIConfig["water-flux-line-color"]
                }}
            >
                { changeInStorageVal } mm
            </span>
        );
        
        const soilMoistureValue = data["Soil Moisture"][index].value;

        const soilMoisture4SelectedMonth  = gldasDataByMonth["Soil Moisture"][monthIndex].map(d=>d.value);

        const avgSoilMoisture4SelectedMonth = average(soilMoisture4SelectedMonth);

        const pctDiffSoilMoistureFromAve = ((soilMoistureValue - avgSoilMoisture4SelectedMonth) / avgSoilMoisture4SelectedMonth * 100);

        const pctDiffRounded = +Math.abs(pctDiffSoilMoistureFromAve).toFixed(0);

        const compare2Avg = pctDiffRounded === 0 
            ? 'about the average'
            : `${pctDiffRounded}% ${pctDiffSoilMoistureFromAve >= 0 ? 'above' : 'below'} average`;

        const compare2AvgText = (
            <span
                className='avenir-demi'
                style={{
                    'color': pctDiffSoilMoistureFromAve >= 0 ? UIConfig["precipitation-color"] : UIConfig["water-flux-line-color"]
                }}
            >
                { compare2Avg }
            </span>
        )

        return (
            <p className='font-size--3 leader-half trailer-half'>
                { changeInStorageText } of water was { changeInStorageVal >= 0 ? 'recharged into' : 'depleted from'} storage this month. Total soil moisture is { compare2AvgText } for { format(date, 'MMMM') }.
            </p>
        )
    };

    const getDownloadLink = ()=>{

        return (
            <p className='font-size--3 trailer-0'>
                <span className='text-blue cursor-pointer' onClick={saveDataAsCsv}>Download</span> water balance data as CSV
            </p>
        );
    };

    return data && gldasDataByMonth && timeExtentItem ? (
        <SummaryCardContainer>
            { getTitle() }
            { getTable() }
            { getDescription() }
            { getDownloadLink() }
        </SummaryCardContainer>
    ) : null;
};

export default SummaryCard;