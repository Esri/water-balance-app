import './styles/index.scss';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import CalciteThemeProvider from 'calcite-react/CalciteThemeProvider';
import AppContextProvider from './contexts/AppContextProvider';
import { App } from './components';

ReactDOM.render(
    <CalciteThemeProvider>
        <AppContextProvider>
            <App />
        </AppContextProvider>
    </CalciteThemeProvider>, 
    document.getElementById('root')
);