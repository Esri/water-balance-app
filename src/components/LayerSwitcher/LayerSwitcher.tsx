import * as React from 'react';
import styled from 'styled-components';
// import shortid from 'shortid';

// import Select from 'calcite-react/Select';
// import { MenuItem } from 'calcite-react/Menu';

import { GldasLayerName } from '../../types';
import {
    UIConfig
} from '../../AppConfig';

interface MenuItemData {
    // key: string;
    value: GldasLayerName;
};

const Data: MenuItemData[] = [
    {
        // key: shortid.generate(),
        value: 'Soil Moisture'
    },
    {
        // key: shortid.generate(),
        value: 'Snowpack'
    },
    {
        // key: shortid.generate(),
        value: 'Precipitation'
    },
    {
        // key: shortid.generate(),
        value: 'Evapotranspiration'
    },
    {
        // key: shortid.generate(),
        value: 'Runoff'
    },
    {
        // key: shortid.generate(),
        value: 'Change in Storage'
    }
];

const StyledSelect = styled.div`
    position: absolute;
    top: 65px;
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

    const calciteSelectRef = React.useRef<any>()


    React.useEffect(()=>{
        calciteSelectRef.current.addEventListener('calciteSelectChange', (evt:any)=>{
            onChange(evt.target.value)
        })
    }, [])

    return (
        <StyledSelect
            style={{
                '--calcite-color-foreground-1': UIConfig['theme-color-dark-blue'],
                '--calcite-color-text-2': '#fff'
            } as any}
        >
            <calcite-select
                ref={calciteSelectRef}
            >
                {
                    Data.map(d=>{
                        return (
                            <calcite-option key={d.value} value={d.value}>{d.value}</calcite-option>
                        )
                    })
                }
            </calcite-select>
        </StyledSelect>

    );
};

export default LayerSwitcher;