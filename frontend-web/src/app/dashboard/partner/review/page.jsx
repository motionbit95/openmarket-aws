import React from "react";

import { CONFIG } from "src/global-config";
import { ReviewListView } from "src/sections/partner/review/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 리뷰 관리` };

export default async function Page() {
  return <ReviewListView />;
}
