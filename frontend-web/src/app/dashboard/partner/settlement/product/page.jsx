"use client";

import { CONFIG } from "src/global-config";
import { DashboardContent } from "src/layouts/dashboard";
import { PartnerSettlementProductView } from "src/sections/partner/settlement/product/view";

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <DashboardContent>
      <PartnerSettlementProductView />
    </DashboardContent>
  );
}
