import * as React from 'react';
import IPoint from '@arcgis/core/geometry/Point';

import {
    AppContext
} from '../../contexts/AppContextProvider';

import {
    MapView,
    SearchWidget,
    TopNav,
    GldasLayer,
    LayerSwitcher,
    BottomPanel,
    GldasChart,
    SummaryCard,
    ChangeInStorageIndicator,
    MonthlyTrendChart,
    QueryLocationGraphic,
    InfoModal,
    Legend,
    MobileDeviceAlert,
    ErrorAlert
} from '../../components';

import useGldasData from '../../hooks/useGldasData';

import {
    GldasLayerName
} from '../../types';

import { UIConfig } from '../../AppConfig';

export interface TimeExtentItem {
    date: Date;
    index: number;
};

interface Props {};

const App:React.FC<Props> = ({

}: Props)=>{

    const { timeExtentForGldasLayers, isMobile } = React.useContext(AppContext);

    const [ activeLayer, setActiveLayer ] = React.useState<GldasLayerName>('Soil Moisture');

    const [ selectedTimeExtentItem, setSelectedTimeExtentItem ] = React.useState<TimeExtentItem>();

    const [ previewTimeExtentItem, setPreviewTimeExtentItem ] = React.useState<TimeExtentItem>();

    const [ queryLocation, setQueryLocation ] = React.useState<IPoint>();

    const { 
        gldasDataResponse, 
        isLoading,
        isFailed,
        resetIsFailed
    } = useGldasData(queryLocation);

    const [ isInfoModalOpen, setIsInfoModalOpen ] = React.useState<boolean>(false);

    const shouldShowBottomPanel = ()=>{
        return (gldasDataResponse && !isFailed && !isMobile );
    }

    const getBottomPanel = ()=>{

        if(!shouldShowBottomPanel()){
            return null
        }

        const { gldasData, gldasDataByMonth } = gldasDataResponse;
     
        return ( 
            <BottomPanel
                isLoading={isLoading}
                isMobile={isMobile}
            >
                <ChangeInStorageIndicator 
                    data={gldasData}
                    gldasDataByMonth={gldasDataByMonth}
                    timeExtentItem={previewTimeExtentItem || selectedTimeExtentItem}
                />

                <SummaryCard 
                    data={gldasData}
                    gldasDataByMonth={gldasDataByMonth}
                    timeExtentItem={previewTimeExtentItem || selectedTimeExtentItem}
                />

                <GldasChart 
                    data={gldasData}
                    timeExtent={timeExtentForGldasLayers}
                    activeLayer={activeLayer}
                    // activeTime={activeTime}

                    selectedTimeExtentItem={selectedTimeExtentItem}
                    previewTimeExtentItem={previewTimeExtentItem}

                    selectedItemOnChange={setSelectedTimeExtentItem}
                    previewItemOnChange={setPreviewTimeExtentItem}
                />

                <MonthlyTrendChart 
                    data={gldasDataByMonth}
                    timeExtentItem={previewTimeExtentItem || selectedTimeExtentItem}
                    activeLayer={activeLayer}
                />
            </BottomPanel>
        );
    }

    React.useEffect(()=>{
        if(timeExtentForGldasLayers.length){

            const index = timeExtentForGldasLayers.length - 1;
            const date = timeExtentForGldasLayers[index];

            setSelectedTimeExtentItem({
                index,
                date
            });
        }
    }, [ timeExtentForGldasLayers ]);

    React.useEffect(()=>{
        console.log(activeLayer)
    }, [activeLayer])

    return selectedTimeExtentItem ? (
        <>
            <TopNav 
                infoIconOnClick={setIsInfoModalOpen.bind(this, true)}
            />

            <MapView
                paddingBottom={ shouldShowBottomPanel() ? UIConfig["bottom-panel-height"] : 0 }
                onClickHandler={setQueryLocation}
            >
                <GldasLayer 
                    layerName={activeLayer}
                    selectedTimeExtentItem={selectedTimeExtentItem}
                />

                <QueryLocationGraphic 
                    geometry={queryLocation}
                />

                <SearchWidget
                    onSelect={setQueryLocation}
                />

                <LayerSwitcher 
                    activeLayer={activeLayer}
                    onChange={setActiveLayer}
                />

                {/* <Legend /> */}

            </MapView>
            
            { getBottomPanel() }

            <InfoModal 
                isOpen={isInfoModalOpen}
                onClose={setIsInfoModalOpen.bind(this, false)}
            />

            <MobileDeviceAlert 
                isVisible={ isMobile }
            />

            <ErrorAlert
                isVisible={isFailed}
                onClose={resetIsFailed}
            />
        </>
    ) : null;
};

export default App;