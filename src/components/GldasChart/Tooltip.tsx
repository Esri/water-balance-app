import * as React from 'react';
import { format } from 'date-fns';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import {
    GldasLayerName
} from '../../types'

import {
    TimeExtentItem
} from '../App/App';

import {
    GldasIdentifyTaskResults
} from '../../services/GLDAS/GLDAS';

import {
    UIConfig
} from '../../AppConfig';

import { HeaderHeight } from './Header';

interface TooltipDataItem {
    key: GldasLayerName;
    value: number;
};

interface TooltipData {
    date: Date;
    items: TooltipDataItem[]
};

interface TooltipPos {
    top: number;
    left: number;
}

interface Props {
    svgContainerData?: SvgContainerData;
    scales?: Scales;
    itemOnHover: TimeExtentItem;
    data: GldasIdentifyTaskResults;
    activeLayer: GldasLayerName
};

export const TextColors:Record<GldasLayerName, string>= {
    'Soil Moisture': '#7aa5c6',
    'Snowpack': '#f9f9f9',
    'Precipitation': '#6990cf',
    'Runoff': '#c07a70',
    'Evapotranspiration': '#c07a70',
    'Change in Storage': '#fff',
}

const Tooltip:React.FC<Props> = ({
    svgContainerData,
    scales,
    itemOnHover,
    data,
    activeLayer
})=>{

    const tooltipRef = React.useRef<HTMLDivElement>();

    const [ tooltipPos, setTooltipPos ] = React.useState<TooltipPos>({ top: 0, left: 0})

    const updateTooltipPosition = ()=>{

        const tooltipDiv = tooltipRef.current;

        if(!tooltipDiv){
            return;
        };

        const { dimension, margin } = svgContainerData;

        const { width } = dimension;

        const { x } = scales;

        const tooltipDivWidth = tooltipDiv.offsetWidth;
        const tooltipDivHeight = tooltipDiv.offsetHeight;

        const top = -(tooltipDivHeight - margin.top - HeaderHeight);
        const xPosForItemOnHover = x(itemOnHover.date) + margin.left;

        const left = ( xPosForItemOnHover + tooltipDivWidth ) >= (width + margin.left) 
            ? (xPosForItemOnHover - tooltipDivWidth) 
            : xPosForItemOnHover;

        setTooltipPos({
            top,
            left
        });
    };

    const getTooltipData = ():TooltipData =>{

        if(!itemOnHover || !data){
            return null;
        }

        const { index, date } = itemOnHover;

        const tooltipDataItems: TooltipDataItem[] = [
            {
                key: 'Soil Moisture',
                value: data["Soil Moisture"][index].value
            },
            {
                key: 'Snowpack',
                value: data.Snowpack[index].value
            },
            {
                key: 'Change in Storage',
                value: data["Change in Storage"][index].value
            },
            {
                key: 'Precipitation',
                value: data.Precipitation[index].value
            },
            {
                key: 'Runoff',
                value: data.Runoff[index].value
            },
            {
                key: 'Evapotranspiration',
                value: data.Evapotranspiration[index].value
            }
        ]
        
        if( activeLayer === 'Soil Moisture' || activeLayer === 'Snowpack'){

            const items = tooltipDataItems.filter(d=>{
                return d.key === 'Soil Moisture' || d.key === 'Snowpack'
            })

            return {
                date,
                items
            };
        }
        else if( activeLayer === 'Change in Storage'){

            const items = tooltipDataItems.filter(d=>{
                return d.key === 'Change in Storage'
            });

            return {
                date,
                items
            };
        }
        else {

            return ( activeLayer === 'Precipitation' || activeLayer === 'Runoff' )
            ? {
                date,
                items: tooltipDataItems.filter(d=>{
                    return d.key === 'Precipitation' || d.key === 'Runoff'
                })
            }
            : {
                date,
                items: tooltipDataItems.filter(d=>{
                    return d.key === 'Precipitation' || d.key === 'Evapotranspiration'
                })
            };
        }

    };

    const getTooltip = ():JSX.Element=>{

        const { top, left } = tooltipPos;

        const tooltipData = getTooltipData();

        if(!tooltipData){
            return null
        };

        const { date, items } = tooltipData;

        const contents = items.map((d, i)=>{
            const { key, value } = d;
            return (
                <div
                    key={`${key}-${i}`}
                    className='font-size--2'
                    style={{
                        color: TextColors[key]
                    }}
                >
                    <span>{key}: {value} mm</span>
                </div>
            )
        });

        return (
            <div
                ref={tooltipRef}
                // left={left}
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    padding: '7px 10px',
                    background: 'rgba(0,0,0,.85)',
                }}
            >
                <div
                    className='padding-trailer-quarter trailer-quarter font-size--2 text-white'
                    style={{
                        borderBottom: '1px solid rgba(255,255,255,.75)'
                    }}
                >
                    { format(date, UIConfig["active-date-format-pattern"]) }
                </div>
                { contents }
            </div>
        )
    }

    React.useEffect(()=>{
        updateTooltipPosition();
    }, [ itemOnHover ])

    return itemOnHover ? getTooltip() : null;
};

export default Tooltip;