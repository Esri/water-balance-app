import * as React from 'react';
import { add } from 'date-fns';

import { loadModules } from 'esri-loader';
import IMapView from 'esri/views/MapView';
import ITimeExtent from "esri/TimeExtent";

import {
    GldasLayerName
} from '../../types'

import {
    TimeExtentItem
} from '../App/App';

interface Props {
    layerName: GldasLayerName;
    selectedTimeExtentItem: TimeExtentItem;
    mapView?: IMapView
}

const GldasLayer:React.FC<Props> = ({
    layerName,
    selectedTimeExtentItem,
    mapView = null
}: Props)=>{

    const init = ()=>{
        if(mapView && selectedTimeExtentItem ){
            updateMapViewTime();
        }
    };

    const updateMapViewTime = async()=>{

        if(!mapView){
            return;
        }

        type Modules = [typeof ITimeExtent];

        const [ 
            TimeExtent
        ] = await (loadModules([
            'esri/TimeExtent',
        ]) as Promise<Modules>);

        const start = new Date(selectedTimeExtentItem.date);
        const end = add(start, { days: 1});

        mapView.timeExtent = new TimeExtent({
            start,
            end
        });

        showActiveGldasLayer();
    };

    const showActiveGldasLayer = ()=>{

        if(!layerName || !selectedTimeExtentItem || !mapView){
            return;
        }

        mapView.map.layers.forEach(d=>{
            d.visible = d.title === layerName; 
        });
    };

    React.useEffect(()=>{
        init();
    }, [ mapView ]);

    React.useEffect(()=>{
        updateMapViewTime();
    }, [ selectedTimeExtentItem ]);

    React.useEffect(()=>{
        showActiveGldasLayer();
    }, [ layerName ]);

    return null;
};

export default GldasLayer;