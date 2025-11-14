import { varAlpha } from 'minimal-shared/utils';

import { grey, info, error, common, primary, success, warning, secondary } from './palette';

// ----------------------------------------------------------------------

export function createShadowColor(colorChannel) {
  return `0 4px 8px 0 ${varAlpha(colorChannel, 0.15)}`;
}

// 미니멀한 커스텀 그림자 - 상용 서비스 스타일
function createCustomShadows(colorChannel) {
  return {
    z1: `0 1px 2px 0 ${varAlpha(colorChannel, 0.04)}`,
    z4: `0 2px 4px 0 ${varAlpha(colorChannel, 0.06)}`,
    z8: `0 4px 8px 0 ${varAlpha(colorChannel, 0.06)}`,
    z12: `0 6px 12px 0 ${varAlpha(colorChannel, 0.08)}`,
    z16: `0 8px 16px 0 ${varAlpha(colorChannel, 0.08)}`,
    z20: `0 12px 20px 0 ${varAlpha(colorChannel, 0.1)}`,
    z24: `0 16px 24px 0 ${varAlpha(colorChannel, 0.1)}`,
    /********/
    dialog: `0 20px 40px 0 ${varAlpha(common.blackChannel, 0.15)}`,
    card: `0 1px 3px 0 ${varAlpha(colorChannel, 0.06)}`,
    dropdown: `0 4px 12px 0 ${varAlpha(colorChannel, 0.08)}`,
    /********/
    primary: `0 4px 8px 0 ${varAlpha(primary.mainChannel, 0.15)}`,
    secondary: `0 4px 8px 0 ${varAlpha(secondary.mainChannel, 0.15)}`,
    info: `0 4px 8px 0 ${varAlpha(info.mainChannel, 0.15)}`,
    success: `0 4px 8px 0 ${varAlpha(success.mainChannel, 0.15)}`,
    warning: `0 4px 8px 0 ${varAlpha(warning.mainChannel, 0.15)}`,
    error: `0 4px 8px 0 ${varAlpha(error.mainChannel, 0.15)}`,
  };
}

// ----------------------------------------------------------------------

export const customShadows = {
  light: createCustomShadows(grey['500Channel']),
  dark: createCustomShadows(common.blackChannel),
};
