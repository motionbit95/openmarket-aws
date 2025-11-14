import React from "react";

import { CONFIG } from "src/global-config";
import { PolicyView } from "src/sections/policy/view/policy-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 이용약관` };

export default async function Page() {
  return <PolicyView />;
}
