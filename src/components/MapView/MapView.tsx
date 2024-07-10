import * as React from 'react';

// import { loadModules, loadCss } from 'esri-loader';
import ArcGISMapView from '@arcgis/core/views/MapView';
import WebMap from "@arcgis/core/WebMap";
import IPoint from '@arcgis/core/geometry/Point';

import {
    MapConfig,
    UIConfig
} from '../../AppConfig';

interface Props {
    paddingBottom: number;
    onClickHandler?: (mapPoint:IPoint)=>void;
    children?: React.ReactNode;
};

const MapView:React.FC<Props> = ({
    paddingBottom,
    onClickHandler,
    children
}: Props)=>{

    const mapDivRef = React.useRef<HTMLDivElement>();

    const [ mapView, setMapView] = React.useState<ArcGISMapView>(null);

    const initMapView = async()=>{
        
        // type Modules = [typeof IMapView, typeof IWebMap];

        try {
            // const [ 
            //     MapView, 
            //     WebMap 
            // ] = await (loadModules([
            //     'esri/views/MapView',
            //     'esri/WebMap',
            // ]) as Promise<Modules>);

            const view = new ArcGISMapView({
                container: mapDivRef.current,
                map: new WebMap({
                    portalItem: {
                        id: MapConfig["web-map-id"]
                    }  
                }),
                padding: {
                    top: UIConfig["top-nav-height"]
                }
            });

            view.when(()=>{
                setMapView(view);
            });

        } catch(err){   
            console.error(err);
        }
    };

    const initEventHandlers = ()=>{
        mapView.on('click', (event)=>{
            if(onClickHandler){
                onClickHandler(event.mapPoint);
            }
        })
    };

    React.useEffect(()=>{
        // loadCss();
        initMapView();
    }, []);

    React.useEffect(()=>{
        if(mapView){
            initEventHandlers();
        }
    }, [ mapView ]);

    return (
        <>
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: paddingBottom || 0,
                    width: '100%',
                    // height: '100%',
                }}
                ref={mapDivRef}
            ></div>
            { 
                React.Children.map(children, (child)=>{
                    return React.cloneElement(child as React.ReactElement<any>, {
                        mapView,
                    });
                }) 
            }
        </>
    );
};

export default MapView;