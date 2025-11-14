import React from "react";

import { CONFIG } from "src/global-config";
import { PartnerPolicyView } from "src/sections/partner/policy/view/partner-policy-view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 개인정보 처리방침` };

export default async function Page() {
  return <PartnerPolicyView type="privacy" />;
}
