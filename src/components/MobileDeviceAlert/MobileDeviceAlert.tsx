import * as React from 'react';
// import Alert, { AlertTitle, AlertMessage } from 'calcite-react/Alert'

interface Props {
    isVisible?: boolean;
}

const MobileDeviceAlert:React.FC<Props> = ({
    isVisible
})=>{

    return isVisible ? (
        <div
            style={{
                // 'position': 'absolute',
                'bottom': 0
            }}
        >
            {/* <Alert yellow showIcon>
                <AlertMessage>Run this app on your devices with wider screen to see the interactive components</AlertMessage>
            </Alert> */}

            <calcite-alert open label="A report alert" kind="info">
                <div slot="message">Run this app on your devices with wider screen to see the interactive components</div>
            </calcite-alert>
        </div>
    ) : null;
};

export default MobileDeviceAlert;