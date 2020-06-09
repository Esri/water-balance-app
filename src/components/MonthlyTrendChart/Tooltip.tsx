import * as React from 'react';
import { format } from 'date-fns';

import {
    Scales,
    SvgContainerData
} from './SvgContainer';

import { HeaderHeight } from './Header';

import {
    GldasIdentifyTaskResultItem
} from '../../services/GLDAS/gldas';

import {
    UIConfig
} from '../../AppConfig';

import { MouseEventItem } from './MouseEventsRect';

interface TooltipPos {
    top: number;
    left: number;
}

interface Props {
    svgContainerData?: SvgContainerData;
    scales?: Scales;
    itemOnHover: MouseEventItem;
    data: GldasIdentifyTaskResultItem[][];
    selectedDate: Date;
};

const Tooltip:React.FC<Props> = ({
    svgContainerData,
    scales,
    itemOnHover,
    data,
    selectedDate
})=>{

    const tooltipRef = React.useRef<HTMLDivElement>();

    const [ tooltipPos, setTooltipPos ] = React.useState<TooltipPos>({ top: 0, left: 0})

    const updateTooltipPosition = ()=>{

        const tooltipDiv = tooltipRef.current;

        if(!tooltipDiv){
            return;
        };

        const { width, margin } = svgContainerData;
        const { x } = scales;
        
        const tooltipDivWidth = tooltipDiv.offsetWidth;
        const tooltipDivHeight = tooltipDiv.offsetHeight;

        const top = -(tooltipDivHeight - margin.top - HeaderHeight);
        const xPosForItemOnHover = x(itemOnHover.value) + x.bandwidth() / 2 + margin.left;

        const left = ( xPosForItemOnHover + tooltipDivWidth ) >= (width + margin.left) 
            ? (xPosForItemOnHover - tooltipDivWidth) 
            : xPosForItemOnHover;

        setTooltipPos({
            top,
            left
        });
    };


    const getTooltip = ():JSX.Element=>{

        if(!itemOnHover){
            return null;
        }

        const { top, left } = tooltipPos;
        const { itemIndex, value } = itemOnHover;
        const monthIndex = selectedDate.getMonth();
        const dateLabel = `${format(selectedDate, 'MMM')} ${value}`;

        return data[monthIndex][itemIndex] ? (
            <div
                ref={tooltipRef}
                className='font-size--3'
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    padding: '.15rem .35rem',
                    background: 'rgba(0,0,0,.7)',
                    color: '#fff'
                }}
            >
                <span>{ dateLabel }: </span>
                <span>{ data[monthIndex][itemIndex].value } mm </span>
            </div>
        ) : null
    }

    React.useEffect(()=>{
        updateTooltipPosition();
    }, [ itemOnHover ])

    return itemOnHover ? getTooltip() : null;
};

export default Tooltip;