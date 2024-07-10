import './styles/index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

// import CalciteThemeProvider from 'calcite-react/CalciteThemeProvider';
import AppContextProvider from './contexts/AppContextProvider';
import { App } from './components';

const root = createRoot(document.getElementById('root'));

root.render(
    <AppContextProvider>
        <App />
    </AppContextProvider>
);