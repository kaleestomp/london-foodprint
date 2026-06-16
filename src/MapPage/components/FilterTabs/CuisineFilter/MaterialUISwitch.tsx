import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const THUMB_SIZE = 36;
const ICON_SIZE = 24;
const satisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-2.5c2.33 0 4.32-1.45 5.12-3.5h-1.67c-.69 1.19-1.97 2-3.45 2s-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5'/></svg>")`;
const dissatisfiedIconSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='${ICON_SIZE}' width='${ICON_SIZE}' viewBox='0 0 24 24'><circle cx='15.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><circle cx='8.5' cy='9.5' r='1.5' fill='${encodeURIComponent('#fff')}'/><path fill='${encodeURIComponent('#fff')}' d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-3.5c.73 0 1.39.19 1.97.53.12-.14.86-.98 1.01-1.14-.85-.56-1.87-.89-2.98-.89s-2.13.33-2.99.88c.97 1.09.01.02 1.01 1.14.59-.33 1.25-.52 1.98-.52'/></svg>")`;

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  // Exclude mode (checked): blue thumb + blue track.
  // Include mode (unchecked): orange thumb + orange track.
  '--switch-blue-thumb': '#1565c0',
  '--switch-blue-track': '#64b5f6',
  '--switch-orange-thumb': '#ef6c00',
  '--switch-orange-track': '#ffb74d',
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
        backgroundImage: dissatisfiedIconSvg,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: 'var(--switch-orange-track)',
        ...theme.applyStyles('dark', {
          backgroundColor: 'var(--switch-orange-track)',
        }),
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: 'var(--switch-blue-thumb)',
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
      backgroundImage: satisfiedIconSvg,
    },
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-blue-thumb)',
    }),
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    backgroundColor: 'var(--switch-orange-thumb)',
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-orange-thumb)',
    }),
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: 'var(--switch-blue-track)',
    borderRadius: ICON_SIZE / 2,
    ...theme.applyStyles('dark', {
      backgroundColor: 'var(--switch-blue-track)',
    }),
  },
}));

export default MaterialUISwitch;
