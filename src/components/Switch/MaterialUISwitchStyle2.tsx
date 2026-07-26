import type { CSSProperties } from 'react';
import Switch from '@mui/material/Switch';
import type { SwitchProps } from '@mui/material/Switch';
import { lighten, styled } from '@mui/material/styles';

const THUMB_SIZE = 45;
const ICON_SIZE = 35; //28
const TRACK_HEIGHT = 24; //24
const TRACK_PADDING = 0;
const TRACK_MARGIN = 5;
const SHOW_TEXT = false; //false
const MARGIN = 4;
const LENGTH_FACTOR = 0.7; //1.25
const satisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-2.5c2.33 0 4.32-1.45 5.12-3.5h-1.67c-.69 1.19-1.97 2-3.45 2s-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5'/></svg>")`;
const dissatisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-3.5c.73 0 1.39.19 1.97.53.12-.14.86-.98 1.01-1.14-.85-.56-1.87-.89-2.98-.89s-2.13.33-2.99.88c.97 1.09.01.02 1.01 1.14.59-.33 1.25-.52 1.98-.52'/></svg>")`;
// const satisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M7 14c.9 2 2.8 3.3 5 3.3s4.1-1.3 5-3.3h-1.8c-.7 1.1-1.9 1.8-3.2 1.8s-2.5-.7-3.2-1.8z'/></svg>")`;
// const dissatisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M7 16.2c1.2-1 2.9-1.6 5-1.6s3.8.6 5 1.6l-1.1 1.3c-.9-.7-2.2-1.2-3.9-1.2s-3 .5-3.9 1.2z'/></svg>")`;

type MaterialUISwitchProps = SwitchProps & {
  uncheckedThumbColor?: string;
  uncheckedTrackColor?: string;
  checkedThumbColor?: string;
  checkedTrackColor?: string;
  uncheckedThumbIcon?: string;
  checkedThumbIcon?: string;
};

const StyledMaterialUISwitch = styled(Switch)(() => ({
  '--switch-unchecked-thumb': 'rgb(45, 45, 45)', //30333a 1565c0
  '--switch-unchecked-track': 'rgba(45, 45, 45, 0.5)', //64b5f6
  '--switch-checked-thumb': '#ef6c00', //ef6c00
  '--switch-checked-track': '#ffb74d', //ffb74d
  '--switch-unchecked-icon': satisfiedIconSvg,
  '--switch-checked-icon': dissatisfiedIconSvg,
  width: THUMB_SIZE * 2 * LENGTH_FACTOR + MARGIN * 2,
  height: THUMB_SIZE + MARGIN * 2,
  padding: TRACK_PADDING,
  '& .MuiSwitch-switchBase': {
    margin: MARGIN,
    padding: 0,
    transform: `translateX(${0}px)`,
    '&.Mui-checked': {
      color: '#fff',
      transform: `translateX(${THUMB_SIZE * LENGTH_FACTOR * 2 - THUMB_SIZE}px)`,
      '& .MuiSwitch-thumb:before': {
        backgroundImage: 'var(--switch-checked-icon)',
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: 'var(--switch-checked-track)',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: 'rgb(45, 45, 45)',
    boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.36)', //inset 1px 1px 1px rgba(255, 255, 255, 0.5)
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: 'var(--switch-unchecked-icon)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    backgroundColor: 'var(--switch-checked-thumb)',
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    height: TRACK_HEIGHT,
    marginTop: (THUMB_SIZE + MARGIN * 2 - TRACK_HEIGHT) / 2,
    marginLeft: TRACK_MARGIN,
    marginRight: TRACK_MARGIN,
    // marginLeft: MARGIN,
    // marginRight: MARGIN,
    backgroundColor: 'var(--switch-unchecked-track)',
    borderRadius: TRACK_HEIGHT,
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.24), inset 0 -1px 2px rgba(255, 255, 255, 0.18)',
    position: 'relative',
    '&::after': {
      opacity: SHOW_TEXT ? 1 : 0,
      content: '"INCL."',
      position: 'absolute',
      top: '50%',
      right: 8,
      transform: 'translateY(-50%)',
      fontSize: 12,
      // fontWeight: 700,
      letterSpacing: '0.04em',
      lineHeight: 1,
      textTransform: 'none',
      color: 'rgba(255, 255, 255, 0.88)',
      pointerEvents: 'none',
    },

  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track::after': {
    content: '"EXCL."',
    left: 8,
    right: 'auto',
  },
}));

const MaterialUISwitch: React.FC<MaterialUISwitchProps> = ({
  uncheckedThumbColor = '#1565c0',
  uncheckedTrackColor,
  checkedThumbColor = '#ef6c00',
  checkedTrackColor,
  uncheckedThumbIcon = satisfiedIconSvg,
  checkedThumbIcon = dissatisfiedIconSvg,
  style,
  ...props
}) => {
  const resolvedUncheckedTrackColor = uncheckedTrackColor ?? lighten(uncheckedThumbColor, 0.45);
  const resolvedCheckedTrackColor = checkedTrackColor ?? lighten(checkedThumbColor, 0.45);

  const switchVars = {
    '--switch-unchecked-thumb': uncheckedThumbColor,
    '--switch-unchecked-track': resolvedUncheckedTrackColor,
    '--switch-checked-thumb': checkedThumbColor,
    '--switch-checked-track': resolvedCheckedTrackColor,
    '--switch-unchecked-icon': uncheckedThumbIcon,
    '--switch-checked-icon': checkedThumbIcon,
  } as CSSProperties;

  return <StyledMaterialUISwitch {...props} style={{ ...switchVars, ...style }} />;
};

export default MaterialUISwitch;
