import * as React from 'react';

import IPoint from 'esri/geometry/Point';

import {
    getGLDASdata,
    GldasIdentifyTaskResults,
    GldasIdentifyTaskResultsByMonth
} from '../services/GLDAS/gldas';

interface FetchResponse {
    gldasData: GldasIdentifyTaskResults;
    gldasDataByMonth: GldasIdentifyTaskResultsByMonth,
}

interface useGldasDataResponse {
    gldasDataResponse: FetchResponse;
    isLoading: boolean;
    isFailed: boolean;
    resetIsFailed: ()=>void;
}

const useGldasData = (queryLocation:IPoint): useGldasDataResponse=>{

    const [ gldasDataResponse, setResponse ] = React.useState<FetchResponse>();

    const [ isLoading, setIsLoading ] = React.useState<boolean>(false);

    const [ isFailed, setIsFaied ] = React.useState<boolean>(false);

    const fetch = async()=>{

        setIsLoading(true);
        setIsFaied(false);

        try {
            const {
                identifyResults,
                identifyResultsByMonth
            } = await getGLDASdata(queryLocation);
    
            setResponse({
                gldasData: identifyResults,
                gldasDataByMonth: identifyResultsByMonth
            });

        } catch(err){
            // console.log(err);
            setIsFaied(true);
            setResponse(null);
        }

        setIsLoading(false);
    };

    const resetIsFailed = ()=>{
        setIsFaied(false);
    };

    React.useEffect(()=>{
        if(queryLocation){
            fetch();
        }
    }, [queryLocation])

    return {
        gldasDataResponse,
        isLoading,
        isFailed,
        resetIsFailed
    }
};

export default useGldasData;