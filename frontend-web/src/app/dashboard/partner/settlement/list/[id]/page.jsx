'use client';

import { PartnerSettlementDetailView } from 'src/sections/partner/settlement/detail/view';

export default function PartnerSettlementDetailPage({ params }) {
  return <PartnerSettlementDetailView settlementId={params.id} />;
}