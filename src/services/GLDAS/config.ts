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

export const GldasLayersInfoDEV: typeof GldasLayersInfo = {
    "Change in Storage": {
        ...GldasLayersInfo['Change in Storage'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/1b033b8cad2848ceb1d55f6ebd98ca9a/rest/services/GLDAS_StorageChange/ImageServer'
    },
    "Runoff": {
        ...GldasLayersInfo['Runoff'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/aa8506f99f7a4c218c2cdd75cabe9f95/rest/services/GLDAS_Runoff/ImageServer'
    },
    "Soil Moisture": {
        ...GldasLayersInfo['Soil Moisture'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/c46c287b048349d8af87974e1d0fcb28/rest/services/GLDAS_SoilMoisture/ImageServer'
    },
    "Precipitation": {
        ...GldasLayersInfo['Precipitation'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/807e4f60395c415ea1830a45f0419378/rest/services/GLDAS_Precipitation/ImageServer'
    },
    "Evapotranspiration": {
        ...GldasLayersInfo['Evapotranspiration'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/faef9e6212634f098c789d41db9dc5c1/rest/services/GLDAS_Evapotranspiration/ImageServer'
    },
    "Snowpack": {
        ...GldasLayersInfo['Snowpack'],
        url: 'https://utilitydevext.arcgis.com/sharing/servers/e6a8c2b8b054467891ba3addd4dfe87f/rest/services/GLDAS_Snowpack/ImageServer'
    }
};