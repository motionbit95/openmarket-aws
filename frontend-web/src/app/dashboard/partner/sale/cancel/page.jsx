'use client';

import { CONFIG } from "src/global-config";
import { DashboardContent } from 'src/layouts/dashboard';
import { PartnerCancelView } from 'src/sections/partner/sale/cancel/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <DashboardContent>
      <PartnerCancelView />
    </DashboardContent>
  );
}
