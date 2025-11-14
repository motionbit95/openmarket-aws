import React from "react";

import { CONFIG } from "src/global-config";
import { SellerListView } from "src/sections/seller/view/seller-list-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 유저관리` };

export default async function Page() {
  return <SellerListView />;
}
