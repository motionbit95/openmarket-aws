import React from "react";

import { CONFIG } from "src/global-config";
import { PartnerPolicyView } from "src/sections/partner/policy/view/partner-policy-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 이용약관` };

export default async function Page() {
  return <PartnerPolicyView type="terms" />;
}
