import React from "react";
import { CONFIG } from "src/global-config";
import { CouponListView } from "src/sections/coupon/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 관리자발급쿠폰` };

export default async function Page() {
  return <CouponListView type="admin" />;
}
