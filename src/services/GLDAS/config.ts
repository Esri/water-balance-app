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
        url: "https://utility.arcgis.com/usrsvcs/servers/a26157d5bcc144678aeac6a73549eb85/rest/services/GLDAS_StorageChange/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    },
    "Runoff": {
        url: "https://utility.arcgis.com/usrsvcs/servers/ad5f6cdf01e3448588a293d94ef3bd50/rest/services/GLDAS_Runoff/ImageServer",
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
        url: "https://utility.arcgis.com/usrsvcs/servers/f520544817274518afa7ce71e7bfa715/rest/services/GLDAS_SoilMoisture/ImageServer",
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
        url: "https://utility.arcgis.com/usrsvcs/servers/0b0823aec0e44abc9df288e2e97bd6fa/rest/services/GLDAS_Precipitation/ImageServer",
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
        url: "https://utility.arcgis.com/usrsvcs/servers/8152741eb29d4cdb8f4661f21b6c2fcd/rest/services/GLDAS_Evapotranspiration/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    },
    "Snowpack": {
        url: "https://utility.arcgis.com/usrsvcs/servers/0d6a500cd4cc41bfa5f4eb2d1a7899a1/rest/services/GLDAS_Snowpack/ImageServer",
        mosaicRule: {
            where: "tag = 'Composite'",
            ascending: false
        }
    }
};