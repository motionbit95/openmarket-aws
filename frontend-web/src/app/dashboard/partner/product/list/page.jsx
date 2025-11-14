import React from "react";

import { CONFIG } from "src/global-config";
import { BlankView } from "src/sections/blank/view";
import { ProductListView } from "src/sections/partner/product/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 상품목록` };

export default async function Page() {
  return <ProductListView title="상품목록" />;
}
