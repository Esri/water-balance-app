import { GldasLayerName } from '../../types';

interface GldasLayerInfo {
    url: string;
    mosaicRule: {
        where: string;
        ascending: boolean;
        multidimensionalDefinition?: {
            variableName: string
        }[]
    }
}

export const GldasLayersInfo: Record<GldasLayerName, GldasLayerInfo> = {
    "Change in Storage": {
        url: "https://utility.arcgis.com/usrsvcs/servers/82421e27d01441429d11bc1b44c43dcf/rest/services/GLDAS_StorageChange/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    },
    "Runoff": {
        url: "https://utility.arcgis.com/usrsvcs/servers/c15db4227bf64151967fd234358fe16e/rest/services/GLDAS_Runoff/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false,
            multidimensionalDefinition: [
                {
                    variableName: "Total Runoff (mm)"
                }
            ]
        }
    },
    "Soil Moisture": {
        url: "https://utility.arcgis.com/usrsvcs/servers/f9a297086a3d4ccf81fb626466bc095c/rest/services/GLDAS_SoilMoisture/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false,
            multidimensionalDefinition: [
                {
                    variableName: "Total Soil Moisture 0 to 200cm (mm)"
                }
            ]
        }
    },
    "Precipitation": {
        url: "https://utility.arcgis.com/usrsvcs/servers/0fb9ab33fa9146f9baa2e3e86374ad2e/rest/services/GLDAS_Precipitation/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false,
            multidimensionalDefinition: [
                {
                    variableName: "Total Precipitation (mm)"
                }
            ]
        }
    }, 
    "Evapotranspiration": {
        url: "https://utility.arcgis.com/usrsvcs/servers/addbed14d95f43bc9d31a5173607febd/rest/services/GLDAS_Evapotranspiration/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    },
    "Snowpack": {
        url: "https://utility.arcgis.com/usrsvcs/servers/f45ab06d75f64c719237225944a55e9f/rest/services/GLDAS_Snowpack/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    }
};