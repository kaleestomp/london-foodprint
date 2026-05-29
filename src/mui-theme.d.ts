import type { PaletteColor, PaletteColorOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    primaryBlack: PaletteColor;
    primaryRed: PaletteColor;
    primaryBlackInverted: PaletteColor;
    primaryGrey: PaletteColor;
    primaryGreyInverted: PaletteColor;
    secondaryGrey: PaletteColor;
    inactive: PaletteColor;
    inactiveInverted: PaletteColor;
  }
  interface PaletteOptions {
    primaryBlack?: PaletteColorOptions;
    primaryRed?: PaletteColorOptions;
    primaryBlackInverted?: PaletteColorOptions;
    primaryGrey?: PaletteColorOptions;
    primaryGreyInverted?: PaletteColorOptions;
    secondaryGrey?: PaletteColorOptions;
    inactive?: PaletteColorOptions;
    inactiveInverted?: PaletteColorOptions;
  }
}

type CustomColorOverrides = {
  primaryBlack: true;
  primaryRed: true;
  primaryBlackInverted: true;
  primaryGrey: true;
  primaryGreyInverted: true;
  secondaryGrey: true;
  inactive: true;
  inactiveInverted: true;
};

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides extends CustomColorOverrides {}
}
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides extends CustomColorOverrides {}
}
declare module '@mui/material/Badge' {
  interface BadgePropsColorOverrides extends CustomColorOverrides {}
}
declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides extends CustomColorOverrides {}
}
declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides extends CustomColorOverrides {}
}
