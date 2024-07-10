import * as React from 'react';
// import { loadModules } from 'esri-loader';

import IMapView from '@arcgis/core/views/MapView';
import IPoint from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { UIConfig } from '../../AppConfig';

interface Props {
    geometry:IPoint;
    mapView?: IMapView;
}

const QueryLocationGraphic:React.FC<Props> = ({
    geometry,
    mapView
})=>{

    const draw = async()=>{
        // type Modules = [
        //     typeof IGraphic, 
        //     typeof ISimpleMarkerSymbol
        // ]; 

        try {
            // const [ 
            //     Graphic, 
            //     SimpleMarkerSymbol
            // ] = await (loadModules([
            //     'esri/Graphic',
            //     'esri/symbols/SimpleMarkerSymbol',
            // ]) as Promise<Modules>);

            const queryLocationGraphic = new Graphic({
                geometry,
                symbol: new SimpleMarkerSymbol({
                    style: 'circle',
                    color: UIConfig["query-location-fill-color"],
                    size: '12px',
                    outline: {
                        color: UIConfig["query-location-outline-color"],
                        width: 2
                    }
                })
            });

            mapView.graphics.removeAll();
            mapView.graphics.add(queryLocationGraphic);

        } catch(err){
            console.error(err);
        }
    };

    React.useEffect(()=>{

        if(mapView && geometry){
            draw();
        }

    }, [ geometry ])

    return null;
};

export default QueryLocationGraphic;
