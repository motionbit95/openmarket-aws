import React from "react";

import { CONFIG } from "src/global-config";
import { InquiryListView } from "src/sections/partner/inquiry/view/inquiry-list-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 센터 문의` };

export default async function Page() {
  return <InquiryListView type="center" />;
}
