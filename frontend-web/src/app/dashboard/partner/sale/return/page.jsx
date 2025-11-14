'use client';

import { CONFIG } from "src/global-config";
import { DashboardContent } from 'src/layouts/dashboard';
import { PartnerReturnView } from 'src/sections/partner/sale/return/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <DashboardContent>
      <PartnerReturnView />
    </DashboardContent>
  );
}
