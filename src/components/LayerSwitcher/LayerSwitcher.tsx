import * as React from 'react';
import styled from 'styled-components';
import shortid from 'shortid';

import Select from 'calcite-react/Select';
import { MenuItem } from 'calcite-react/Menu';

import { GldasLayerName } from '../../types';
import {
    UIConfig
} from '../../AppConfig';

interface MenuItemData {
    key: string;
    value: GldasLayerName;
};

const Data: MenuItemData[] = [
    {
        key: shortid.generate(),
        value: 'Soil Moisture'
    },
    {
        key: shortid.generate(),
        value: 'Snowpack'
    },
    {
        key: shortid.generate(),
        value: 'Precipitation'
    },
    {
        key: shortid.generate(),
        value: 'Evapotranspiration'
    },
    {
        key: shortid.generate(),
        value: 'Runoff'
    },
    {
        key: shortid.generate(),
        value: 'Change in Storage'
    }
];

const StyledSelect = styled(Select)`
    position: absolute;
    top: 10px;
    left: 60px;
    width: 198px;
    background-color: ${UIConfig["theme-color-dark-blue"]};
    color: #fff;
    z-index: 5;
`;

interface Props {
    activeLayer: GldasLayerName;
    onChange?: (val:GldasLayerName)=>void;
};

const LayerSwitcher:React.FC<Props> = ({
    activeLayer,
    onChange
})=>{

    const getMenuItems = ()=>{
        return Data.map(d=>{

            const { key, value } = d;

            return (
                <MenuItem 
                    key={key}
                    value={value}
                >
                    {value}
                </MenuItem>
            )
        });
    }

    return (
        <StyledSelect
            onChange={onChange}
            selectedValue={activeLayer}
        >
            { getMenuItems() }
        </StyledSelect>
    );
};

export default LayerSwitcher;