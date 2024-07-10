import * as React from 'react';

// import { loadModules } from 'esri-loader';
import IPoint from '@arcgis/core/geometry/Point';
import IMapView from '@arcgis/core/views/MapView';
import Search from '@arcgis/core/widgets/Search';

interface Props {
    onSelect: (location:IPoint)=>void;
    mapView?: IMapView
}

const SearchWidget:React.FC<Props> = ({
    onSelect,
    mapView = null
}: Props)=>{

    const init = async()=>{

        // type Modules = [typeof ISearch ];

        try {
            // const [ 
            //     Search, 
            // ] = await (loadModules([
            //     'esri/widgets/Search'
            // ]) as Promise<Modules>);

            const searchWidget = new Search({
                view: mapView,
                popupEnabled: false,
                resultGraphicEnabled: false
            });

            searchWidget.on('search-complete', evt=>{
                const geometry = evt?.results[0]?.results[0]?.feature?.geometry as IPoint;
                onSelect(geometry);
            });

            mapView.ui.add(searchWidget, {
                position: "top-right",
                index: 2
            });

        } catch(err){   
            console.error(err);
        }
    };

    React.useEffect(()=>{
        if(mapView){
            init();
        }
    }, [ mapView ])

    return null;
};

export default SearchWidget;