import * as React from 'react';
import styled from 'styled-components';
// import Loader from 'calcite-react/Loader'

import {
    UIConfig
} from '../../AppConfig';

const BottomPanelDiv = styled.div`
    position: absolute;
    display: flex;
    bottom: 0;
    left: 0;
    box-sizing: border-box;
    width: 100%;
    height: ${UIConfig["bottom-panel-height"] + 'px'};
    padding: .75rem;
    box-shadow: 0 -5px 5px -5px rgba(0,0,0,.4);
    background-color: ${UIConfig["theme-color-light-blue"]};
`;

const LoaderDiv = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

interface Props {
    isLoading?: boolean;
    isMobile?: boolean;
    children: React.ReactNode;
}

const BottomPanel:React.FC<Props> = ({
    isLoading,
    isMobile,
    children
})=>{

    const getLoader = ()=>{
        return (
            <LoaderDiv>
                {/* <Loader 
                    text='Loading...'
                />  */}
                <calcite-loader label="loading" />
            </LoaderDiv>
        );
    }

    const getContent = ()=>{
        return isLoading 
            ? getLoader()
            : children;
    }

    return (
        <BottomPanelDiv>
            { getContent() }
        </BottomPanelDiv>
    );
};

export default BottomPanel;