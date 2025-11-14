import React from "react";

import { CONFIG } from "src/global-config";
import { CouponListView } from "src/sections/partner/coupon/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 판매자쿠폰관리` };

export default async function Page() {
  return <CouponListView type="partner" />;
}
