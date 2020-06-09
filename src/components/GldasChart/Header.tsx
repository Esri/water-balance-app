import * as React from 'react';
import styled from 'styled-components';
import Tooltip from 'calcite-react/Tooltip'

import { GldasLayerName } from '../../types';

import { TextColors } from './Tooltip'

export const HeaderHeight = 25;
const InstructionTextContent = `* Use mousewheel to zoom; click to display map layer in the selected time.`;

const HeaderDiv = styled.div`
    height: ${HeaderHeight + 'px'};
    padding: 0 2rem;
    display: flex;
`;

const ToggleBtnWrap = styled.div`
    display: flex;
    padding: 0 1rem;
    flex-grow: 1;
`;

const ToggleBtn = styled.div`
    margin: 0 .75rem;
    display: flex;
    align-items: center;
`;

const ToggleBtnLegend = styled.div`
    height: 12px;
    width: 12px;
    margin-right: .5rem;
    background-color: ${props=>props.color};
`;

const ToggleBtnLabel = styled.span`
    font-size: .825rem;
`;

const IntructionText = styled.div`

    .narrow-show {
        display: none;
    }

    @media (max-width: 1585px) {
        .narrow-hide {
            display: none;
        }

        .narrow-show {
            display: inline-block;
        }
    }
`;

interface Props {
    activeLayer: GldasLayerName;
};

const ToggleBtnLookup:Record<GldasLayerName, JSX.Element> = {
    'Soil Moisture': (
        <ToggleBtn>
            <ToggleBtnLegend 
                color={TextColors["Soil Moisture"]}
            />
            <ToggleBtnLabel>Soil Moisture</ToggleBtnLabel>
        </ToggleBtn>
    ),
    'Snowpack': (
        <ToggleBtn>
            <ToggleBtnLegend 
                color={TextColors.Snowpack}
            />
            <ToggleBtnLabel>Snowpack</ToggleBtnLabel>
        </ToggleBtn>
    ),
    'Precipitation': (
        <ToggleBtn>
            <ToggleBtnLegend 
                color={TextColors.Precipitation}
            />
            <ToggleBtnLabel>Precipitation</ToggleBtnLabel>
        </ToggleBtn>
    ),
    'Runoff': (
        <ToggleBtn>
            <ToggleBtnLegend 
                color={TextColors.Runoff}
            />
            <ToggleBtnLabel>Runoff</ToggleBtnLabel>
        </ToggleBtn>
    ),
    'Evapotranspiration': (
        <ToggleBtn>
            <ToggleBtnLegend 
                color={TextColors.Evapotranspiration}
            />
            <ToggleBtnLabel>Evapotranspiration</ToggleBtnLabel>
        </ToggleBtn>
    ),
    'Change in Storage': null,
}

const Header:React.FC<Props> = ({
    activeLayer
})=>{

    const getTitle = ()=>{

        if(activeLayer === 'Soil Moisture' || activeLayer === 'Snowpack'){
            return 'Water Storage'
        }

        if( activeLayer === 'Change in Storage'){
            return 'Change in Storage'
        }

        return 'Water Flux';
    };

    const getToggleBtns = ()=>{

        if(activeLayer === 'Soil Moisture' || activeLayer === 'Snowpack'){
            return (
                <ToggleBtnWrap>
                    {ToggleBtnLookup["Soil Moisture"]}
                    {ToggleBtnLookup["Snowpack"]}
                </ToggleBtnWrap>
            );
        }

        // return empty ToggleBtnWrap as a placeholder
        if( activeLayer === 'Change in Storage'){
            return <ToggleBtnWrap />;
        }

        return activeLayer === 'Evapotranspiration' 
            ? (
                <ToggleBtnWrap>
                    { ToggleBtnLookup.Precipitation }
                    { ToggleBtnLookup.Evapotranspiration }
                </ToggleBtnWrap>
            )
            : (
                <ToggleBtnWrap>
                    { ToggleBtnLookup.Precipitation }
                    { ToggleBtnLookup.Runoff }
                </ToggleBtnWrap>
            );
    }

    return (
        <HeaderDiv>
            <div>
                <span className='avenir-demi font-size--2'>{getTitle()}</span>
            </div>

            { getToggleBtns() }

            <IntructionText>
                <span className='font-size--3 narrow-hide'>{ InstructionTextContent }</span>

                <Tooltip 
                    title={InstructionTextContent}
                    placement={'top'}
                >
                    <span className='icon-ui-question narrow-show'></span>
                </Tooltip>
                
            </IntructionText>
        </HeaderDiv>
    );
};

export default Header;