import { readCssCustomProperties } from '../../../../../utils/styling/cssCustomProperties';

const DEFAULT_HOME_SIZE = 80;
const DEFAULT_PIN_SCALE = 0.625;
const DEFAULT_PIN_SIZE = DEFAULT_HOME_SIZE * DEFAULT_PIN_SCALE;

const getMarkerSizeFromCSS = () => {
  const vars = readCssCustomProperties(
    ['--bubble-avatar-home-size', '--bubble-avatar-pin-scale'],
    {
      scopeClassName: 'bubble-avatar-root',
      fallbackValues: {
        '--bubble-avatar-home-size': String(DEFAULT_HOME_SIZE),
        '--bubble-avatar-pin-scale': String(DEFAULT_PIN_SCALE),
      },
    },
  );

  const homeSize = parseFloat(vars['--bubble-avatar-home-size']);
  const pinScale = parseFloat(vars['--bubble-avatar-pin-scale']);

  if (Number.isFinite(homeSize) && homeSize > 0 && Number.isFinite(pinScale) && pinScale > 0) {
    return homeSize * pinScale;
  }

  return DEFAULT_PIN_SIZE;
};

export default getMarkerSizeFromCSS;