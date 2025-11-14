import React from "react";

import { CONFIG } from "src/global-config";
import { FAQListView } from "src/sections/faq/view/faq-list-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - FAQ` };

export default async function Page() {
  return <FAQListView />;
}
