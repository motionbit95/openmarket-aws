'use client';

import { Container } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { SettlementView } from 'src/sections/settlement/view';

// ----------------------------------------------------------------------

export default function SettlementCompletePage() {
  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <SettlementView currentTab="completed" />
      </Container>
    </DashboardContent>
  );
}
