import * as React from 'react';

interface Props {
    isOpen: boolean;
    onClose:()=>void;
}

const container = document.createElement('div')

const InfoModal:React.FC<Props> = ({
    isOpen,
    onClose
})=>{

    if(!isOpen){
        return null
    }

    return (
        <calcite-modal aria-labelledby="modal-title" id="info-modal" open close-button-disabled>
            <div slot="header" id="modal-title">
                About this app
            </div>
            <div slot="content">
                <div
                    className='font-size--1'
                >
                    <p>This app is based on data from NASA’s <a href='https://ldas.gsfc.nasa.gov/' target="_blank">Global Land Data Assimilation System</a> (GLDAS-2.1), which uses weather observations like temperature, humidity, and rainfall to run the <a href='https://www.jsg.utexas.edu/noah-mp' target="_blank">Noah</a> land surface model. This model estimates how much of the rain becomes runoff, how much evaporates, and how much infiltrates into the soil. These output variables, calculated every three hours, are aggregated into monthly averages, giving us a record of the hydrologic cycle going all the way back to January 2000. </p>
                    <br />
                    
                    <p>Soil moisture plus snowpack is the water storage at any given place. Every month that storage volume changes according to the water flux - recharge occurs when precipitation is high, depletion occurs when evapotranspiration and runoff are higher. </p>
                    <br />

                    <p>Click anywhere on the map to see how a chosen variable has changed over time, and click anywhere on the graph to switch the map to that month of interest. The water balance panel (on the left) shows how much recharge or depletion occurred during your chosen month, and how this compares to what’s normal. The trend analyzer panel (on the right) shows how your chosen variable was different in the same month during other years. </p>
                    <br />
                    <p>Because the model is run with 0.25 degree spatial resolution (~30 km), these data should only be used for regional analysis. A specific farm or other small area might experience very different conditions than the region around it, especially because human influences like irrigation are not included.</p>
                </div>
            </div>

            <calcite-button slot="secondary" width="full" appearance="outline" onClick={onClose}>
                Close
            </calcite-button>

        </calcite-modal>
    )
};

export default InfoModal;
