import * as React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { GldasLayerName } from '../../types';
import { TimeExtentItem } from '../App/App';

export const HeaderHeight = 25;

const HeaderDiv = styled.div`
    height: ${HeaderHeight + 'px'};
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
`;

interface Props {
    activeLayer: GldasLayerName;
    timeExtentItem: TimeExtentItem;
};


const Header:React.FC<Props> = ({
    activeLayer,
    timeExtentItem
})=>{

    const getMonthName = ()=>{
        if(!timeExtentItem){
            return null;
        }

        return (
            <div>{format(timeExtentItem.date, 'MMMM')}</div>
        );
    }

    return (
        <HeaderDiv>
            <div className='font-size--2'>
                <span className='margin-right-half'>Trend Analyzer for <span className='avenir-demi'>{activeLayer}</span></span>
            </div>

            { getMonthName() }
        </HeaderDiv>
    )
};

export default Header;