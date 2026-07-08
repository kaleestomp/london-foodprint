import type { CSSProperties } from 'react';
import Switch from '@mui/material/Switch';
import type { SwitchProps } from '@mui/material/Switch';
import { lighten, styled } from '@mui/material/styles';

const THUMB_SIZE = 36;
const ICON_SIZE = 24;
const satisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-2.5c2.33 0 4.32-1.45 5.12-3.5h-1.67c-.69 1.19-1.97 2-3.45 2s-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5'/></svg>")`;
const dissatisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-3.5c.73 0 1.39.19 1.97.53.12-.14.86-.98 1.01-1.14-.85-.56-1.87-.89-2.98-.89s-2.13.33-2.99.88c.97 1.09.01.02 1.01 1.14.59-.33 1.25-.52 1.98-.52'/></svg>")`;

type MaterialUISwitchProps = SwitchProps & {
  uncheckedThumbColor?: string;
  uncheckedTrackColor?: string;
  checkedThumbColor?: string;
  checkedTrackColor?: string;
  uncheckedThumbIcon?: string;
  checkedThumbIcon?: string;
};

const StyledMaterialUISwitch = styled(Switch)(({ theme }) => ({
  '--switch-unchecked-thumb': '#1565c0',
  '--switch-unchecked-track': '#64b5f6',
  '--switch-checked-thumb': '#ef6c00',
  '--switch-checked-track': '#ffb74d',
  '--switch-unchecked-icon': satisfiedIconSvg,
  '--switch-checked-icon': dissatisfiedIconSvg,
  width: THUMB_SIZE * 2 - 2,
  height: THUMB_SIZE + 2,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: `translateX(${THUMB_SIZE / 6}px)`,
    '&.Mui-checked': {
      color: '#fff',
      transform: `translateX(${THUMB_SIZE - 10}px)`,
      '& .MuiSwitch-thumb:before': {
        backgroundImage: 'var(--switch-checked-icon)',
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: 'var(--switch-checked-track)',
        ...theme.applyStyles('dark', {
          backgroundColor: 'var(--switch-checked-track)',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: 'var(--switch-unchecked-thumb)',
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
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-unchecked-thumb)',
    }),
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    backgroundColor: 'var(--switch-checked-thumb)',
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-checked-thumb)',
    }),
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: 'var(--switch-unchecked-track)',
    borderRadius: ICON_SIZE / 2,
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.24), inset 0 -1px 2px rgba(255, 255, 255, 0.18)',
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-unchecked-track)',
    }),
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
