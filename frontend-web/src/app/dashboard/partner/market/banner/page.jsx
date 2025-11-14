import React from "react";

import { CONFIG } from "src/global-config";
import { BannerListView } from "src/sections/partner/banner/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 판매자배너등록` };

export default async function Page() {
  return <BannerListView type="SELLER" />;
}
