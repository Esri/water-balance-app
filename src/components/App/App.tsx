import * as React from 'react';
import IPoint from 'esri/geometry/Point';

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
    MobileDeviceAlert
} from '../../components';

import {
    getGLDASdata,
    GldasIdentifyTaskResults,
    GldasIdentifyTaskResultsByMonth
} from '../../services/GLDAS/gldas';

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

    const [ gldasData, setGldasData ] = React.useState<GldasIdentifyTaskResults>();

    const [ gldasDataByMonth, setGldasDataByMonth ] = React.useState<GldasIdentifyTaskResultsByMonth>()

    const [ queryLocation, setQueryLocation ] = React.useState<IPoint>();

    const [ isInfoModalOpen, setIsInfoModalOpen ] = React.useState<boolean>(false);

    const [ isLoading, setIsLoading ] = React.useState<boolean>(false);
    
    const fetchGldasData = async(point:IPoint)=>{

        setIsLoading(true);

        const {
            identifyResults,
            identifyResultsByMonth
        } = await getGLDASdata(point);

        console.log(identifyResults, identifyResultsByMonth)

        setGldasData(identifyResults);
        setGldasDataByMonth(identifyResultsByMonth);
        setIsLoading(false);
        
    };

    const getBottomPanel = ()=>{

        if (!gldasData || !gldasDataByMonth || isMobile) {
            return null;
        }
     
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
        if(queryLocation){
            fetchGldasData(queryLocation);
        }
    }, [ queryLocation ]);

    return selectedTimeExtentItem ? (
        <>
            <TopNav 
                infoIconOnClick={setIsInfoModalOpen.bind(this, true)}
            />

            <MapView
                paddingBottom={ gldasData && !isMobile ? UIConfig["bottom-panel-height"] : 0 }
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

                <Legend />

            </MapView>
            
            { getBottomPanel() }

            <InfoModal 
                isOpen={isInfoModalOpen}
                onClose={setIsInfoModalOpen.bind(this, false)}
            />

            <MobileDeviceAlert 
                isVisible={ isMobile }
            />
        </>
    ) : null;
};

export default App;