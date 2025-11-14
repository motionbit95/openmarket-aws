'use client';

import { Box, Card, Container, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';
import { SettlementView } from 'src/sections/settlement/view';

// ----------------------------------------------------------------------

export default function SettlementListPage() {
  const [currentTab, setCurrentTab] = useState('pending');

  const tabs = [
    { value: 'pending', label: '정산 대기' },
    { value: 'processing', label: '정산 처리중' },
    { value: 'completed', label: '정산 완료' },
  ];

  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Card>
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
              sx={{ px: 2, bgcolor: 'background.neutral' }}
            >
              {tabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Card>
        </Box>

        <SettlementView currentTab={currentTab} />
      </Container>
    </DashboardContent>
  );
}
