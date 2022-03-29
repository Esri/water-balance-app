import axios from 'axios';

import { GldasLayersInfo, GldasLayersInfoDEV } from './config';
import { GldasLayerName } from '../../types';

import IPoint from 'esri/geometry/Point';

export interface GldasIdentifyTaskResultItem {
    date: Date;
    value: number;
};

export type GldasIdentifyTaskResults = {
    [key in GldasLayerName]?: GldasIdentifyTaskResultItem[]
};

export type GldasIdentifyTaskResultsByMonth = {
    [key in GldasLayerName]?: GldasIdentifyTaskResultItem[][]
};

const GldasLayerNames = Object.keys(GldasLayersInfo) as GldasLayerName[];

let timeExtentForGldasLayers:Date[] = [];

const LayersInfo = location.host === 'livingatlasdev.arcgis.com' 
    ? GldasLayersInfoDEV 
    : GldasLayersInfo;

export const getTimeExtent = async(): Promise<Date[]>=>{

    const url = LayersInfo['Snowpack'].url + '/multiDimensionalInfo?f=json';

    try {
        const response = await axios.get(url);

        const values: number[] = (
            response.data && 
            response.data.multidimensionalInfo && 
            response.data.multidimensionalInfo.variables && 
            response.data.multidimensionalInfo.variables[0] && 
            response.data.multidimensionalInfo.variables[0].dimensions && 
            response.data.multidimensionalInfo.variables[0].dimensions[0] && 
            response.data.multidimensionalInfo.variables[0].dimensions[0].values
        ) 
        ? response.data.multidimensionalInfo.variables[0].dimensions[0].values
        : [];

        timeExtentForGldasLayers = values.map((d:number)=>{
            return new Date(d);
        });

        return timeExtentForGldasLayers;

    } catch(err){
        console.error('failed to queryMultiDimensionalInfo', err);
    }

    return [];
};

export const getGLDASdata = async(queryLocation: IPoint):Promise<{
    identifyResults: GldasIdentifyTaskResults,
    identifyResultsByMonth: GldasIdentifyTaskResultsByMonth
}>=>{

    if(!timeExtentForGldasLayers || !timeExtentForGldasLayers.length){
        await getTimeExtent();
    }

    const params = {
        geometry: {
            x: queryLocation.longitude,
            y: queryLocation.latitude,
            spatialReference: {
                wkid: 4326
            }
        }, //{"x":-9755306.160227587,"y":4549146.018149606,"spatialReference":{"wkid":102100}},
        returnGeometry: 'false',
        returnCatalogItems: 'true',
        renderingRule: {"rasterFunction":"None"},
        geometryType: 'esriGeometryPoint',
        f: 'json'
    };

    const identifyTasks = GldasLayerNames.map(layerName=>{

        const layerInfo = LayersInfo[layerName];

        return axios.get(layerInfo.url + '/identify', { 
            params: {
                ...params,
                mosaicRule: layerInfo.mosaicRule
            }
        });
    });

    return new Promise((resolve, reject)=>{

        Promise.all(identifyTasks)
        .then((responses)=>{

            if(responses[0].data && responses[0].data.value === 'NoData'){
                reject({
                    error: 'failed to fetch GLDAS data'
                });
            }
            
            const identifyResults:GldasIdentifyTaskResults = {}

            for ( let i = 0, len = responses.length; i < len; i++){
                
                const layerName = GldasLayerNames[i];

                const response = responses[i];

                const originalValues:string[]= (
                    response.data &&
                    response.data.properties && 
                    response.data.properties.Values && 
                    response.data.properties.Values.length
                ) 
                ? response.data.properties.Values 
                : null;

                identifyResults[layerName] = processGldasResult(originalValues);
            }

            const identifyResultsByMonth = groupGldasDataByMonth(identifyResults);
            // console.log(identifyResultsByMonth)

            resolve({
                identifyResults,
                identifyResultsByMonth
            });

        })
        .catch(error => { 
            reject(error.message)
        });
    });
};

const processGldasResult = (values:string[]): GldasIdentifyTaskResultItem[]=>{
    
    let flattedValues:number[] = [];
    
    values.forEach(d=>{
        const listOfValues = d.split(' ').map(d=>+d);

        flattedValues = flattedValues.concat(listOfValues);
    });

    return flattedValues.map((value, index)=>{

        const date = timeExtentForGldasLayers[index];

        const dataItem:GldasIdentifyTaskResultItem = {
            date,
            value
        };

        return dataItem
    });
};

const groupGldasDataByMonth = (data:GldasIdentifyTaskResults)=>{

    const results:GldasIdentifyTaskResultsByMonth = {};

    for(let i = 0, len = timeExtentForGldasLayers.length; i < len ; i++){

        const monthIndex = timeExtentForGldasLayers[i].getMonth();

        GldasLayerNames.forEach(layerName=>{
            const value = data[layerName][i];

            if(!results[layerName]){
                results[layerName] = [];
            }

            if(!results[layerName][monthIndex]){
                results[layerName][monthIndex] = [];
            }

            results[layerName][monthIndex].push(value);
        })

    };

    return results;
}