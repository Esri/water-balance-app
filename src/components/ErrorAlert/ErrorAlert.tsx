import * as React from 'react';
// import Alert, { AlertTitle, AlertMessage } from 'calcite-react/Alert'
import { UIConfig } from '../../AppConfig';

interface Props {
    isVisible?: boolean;
    onClose: ()=>void;
}

const ErrorAlert:React.FC<Props> = ({
    isVisible,
    onClose
})=>{

    if(!isVisible){
        return null
    }

    return isVisible ? (
        <div
            style={{
                'position': 'absolute',
                'bottom': '1.5rem',
                'right': '1rem'
            }}
        >
            {/* <Alert red showIcon showCloseLabel onClose={onClose}>
                <AlertTitle>No Data Found!</AlertTitle>
                <AlertMessage>Cannot find any GLDAS data for the selected location. Use a different location and try again.</AlertMessage>
            </Alert> */}

            <calcite-alert open label="A report alert" kind="danger">
                <div slot="message">Failed to fetch GLDAS data for the selected location. Use a different location and try again.</div>
            </calcite-alert>
        </div>
    ) : null;
};

export default ErrorAlert;