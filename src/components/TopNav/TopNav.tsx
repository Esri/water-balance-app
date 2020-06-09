import * as React from 'react';
import styled from 'styled-components';

import {
    CalciteH4
} from 'calcite-react/Elements'

import {
    UIConfig
} from '../../AppConfig';

const TopNavContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    height: ${UIConfig["top-nav-height"] + 'px'};
    width: 100%;
    box-sizing: border-box;
    padding: .25rem 1rem;
    z-index: 5;
    background: ${UIConfig["theme-color-dark-blue"]};
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const TitleText = styled(CalciteH4)`
    margin: 0;
    padding-right: .75rem;
    margin-right: .75rem;
    border-right: 1px solid rgba(255,255,255,.75);
`;

interface Props {
    infoIconOnClick: ()=>void;
}

const TopNav:React.FC<Props> = ({
    infoIconOnClick
})=>{
    return (
        <TopNavContainer>
            <TitleText>Water Balance App</TitleText>
            <div>
                <span className='font-size--2 tablet-hide margin-right-half'>
                    Click anywhere on earth to see how the water balance is changing over time
                </span>

                <span className='font-size--1 icon-ui-question cursor-pointer' onClick={infoIconOnClick}></span>
            </div>
        </TopNavContainer>
    );
};

export default TopNav;