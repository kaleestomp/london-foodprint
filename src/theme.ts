import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    cssVariables: true,
    palette: {
        primary: {
            main: 'rgb(31, 130, 192)',
            light: 'rgb(188, 213, 236)',
            dark: 'rgb(30, 118, 174)',
            contrastText: '#ffffff',
        },
        text: {
            primary: 'rgb(45, 45, 45)',
            secondary: 'rgb(120, 120, 120)',
        },
        primaryBlack: {
            main: 'rgb(45, 45, 45)',
            light: 'rgb(160, 160, 160)',
            dark: 'rgb(110, 110, 110)',
            contrastText: '#ffffff',
        },
        primaryRed: {
            main: 'rgb(190, 10, 38)',
            light: 'rgb(255, 100, 100)',
            dark: '#BA160C',
            contrastText: '#ffffff',
        },
        primaryBlackInverted: {
            main: 'rgba(255, 255, 255, 0)',
            light: 'rgba(255, 255, 255, 0)',
            dark: 'rgba(120, 120, 120, 0.05)',
            contrastText: 'rgb(45, 45, 45)',
        },
        primaryGrey: {
            main: 'rgb(120, 120, 120)',
            light: 'rgb(160, 160, 160)',
            dark: 'rgb(110, 110, 110)',
            contrastText: '#ffffff',
        },
        primaryGreyInverted: {
            main: 'rgba(255, 255, 255, 0)',
            light: 'rgba(255, 255, 255, 0)',
            dark: 'rgba(120, 120, 120, 0.05)',
            contrastText: 'rgb(120, 120, 120)',
        },
        secondaryGrey: {
            main: 'rgb(180, 180, 180)',
            light: 'rgb(240, 240, 240)',
            dark: 'rgb(160, 160, 160)',
            contrastText: '#ffffff',
        },
        inactive: {
            main: 'rgb(220, 220, 220)',
            light: 'rgb(240, 240, 240)',
            dark: 'rgb(200, 200, 200)',
            contrastText: '#ffffff',
        },
        inactiveInverted: {
            main: 'rgba(255, 255, 255, 0)',
            light: 'rgba(255, 255, 255, 0)',
            dark: 'rgba(120, 120, 120, 0.05)',
            contrastText: 'rgb(220, 220, 220)',
        },
    },
});

export default theme;
