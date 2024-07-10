import * as React from 'react';
// import { loadModules } from 'esri-loader';

import IMapView from '@arcgis/core/views/MapView';
import Legend from '@arcgis/core/widgets/Legend';

interface Props {
    mapView?: IMapView;
}

const LegendWidget:React.FC<Props> = ({
    mapView
})=>{

    const init = async()=>{
        // type Modules = [typeof ILegend];

        try {
            // const [ 
            //     Legend, 
            // ] = await (loadModules([
            //     'esri/widgets/Legend',
            // ]) as Promise<Modules>);

            const legend = new Legend({
                view: mapView
            });

            mapView.ui.add(legend, "bottom-left");

        } catch(err){   
            console.error(err);
        }
    };

    React.useEffect(()=>{
        if(mapView){
            init();
        }
    }, [mapView]);

    return null;
};

export default LegendWidget;