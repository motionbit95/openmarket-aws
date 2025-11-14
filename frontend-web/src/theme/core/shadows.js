import { varAlpha } from 'minimal-shared/utils';

import { grey, common } from './palette';

// ----------------------------------------------------------------------

// 미니멀하고 깔끔한 상용 서비스 스타일 그림자 - 대폭 축소
function createShadows(colorChannel) {
  const lightShadow = varAlpha(colorChannel, 0.04);
  const mediumShadow = varAlpha(colorChannel, 0.06);
  const heavyShadow = varAlpha(colorChannel, 0.08);

  return [
    'none',
    `0px 1px 2px 0px ${lightShadow}`,
    `0px 1px 3px 0px ${lightShadow}`,
    `0px 1px 4px 0px ${mediumShadow}`,
    `0px 2px 4px 0px ${mediumShadow}`,
    `0px 2px 8px 0px ${mediumShadow}`,
    `0px 4px 8px 0px ${mediumShadow}`,
    `0px 4px 12px 0px ${heavyShadow}`,
    `0px 6px 12px 0px ${heavyShadow}`,
    `0px 6px 16px 0px ${heavyShadow}`,
    `0px 8px 16px 0px ${heavyShadow}`,
    `0px 8px 20px 0px ${heavyShadow}`,
    `0px 12px 20px 0px ${varAlpha(colorChannel, 0.1)}`,
    `0px 12px 24px 0px ${varAlpha(colorChannel, 0.1)}`,
    `0px 16px 24px 0px ${varAlpha(colorChannel, 0.1)}`,
    `0px 16px 32px 0px ${varAlpha(colorChannel, 0.1)}`,
    `0px 20px 32px 0px ${varAlpha(colorChannel, 0.12)}`,
    `0px 20px 40px 0px ${varAlpha(colorChannel, 0.12)}`,
    `0px 24px 40px 0px ${varAlpha(colorChannel, 0.12)}`,
    `0px 24px 48px 0px ${varAlpha(colorChannel, 0.12)}`,
    `0px 32px 48px 0px ${varAlpha(colorChannel, 0.14)}`,
    `0px 32px 56px 0px ${varAlpha(colorChannel, 0.14)}`,
    `0px 40px 56px 0px ${varAlpha(colorChannel, 0.14)}`,
    `0px 40px 64px 0px ${varAlpha(colorChannel, 0.16)}`,
    `0px 48px 64px 0px ${varAlpha(colorChannel, 0.16)}`,
  ];
}

// ----------------------------------------------------------------------

export const shadows = {
  light: createShadows(grey['500Channel']),
  dark: createShadows(common.blackChannel),
};
