import React from "react";

import { CONFIG } from "src/global-config";

import { PartnerPolicyView } from "src/sections/partner/policy/view/partner-policy-view";
// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 카테고리 수수료 약정서` };

export default async function Page() {
  return <PartnerPolicyView type="fee" />;
}
