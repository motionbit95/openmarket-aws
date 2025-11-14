'use client';

import { Box, Card, Container, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';
import { SalesView } from 'src/sections/sales/view';

// ----------------------------------------------------------------------

export default function SalesPage() {
  const [currentTab, setCurrentTab] = useState('overview');

  const tabs = [
    { value: 'overview', label: '매출 개요' },
    { value: 'daily', label: '일별 매출' },
    { value: 'monthly', label: '월별 매출' },
    { value: 'products', label: '상품별 매출' },
    { value: 'partners', label: '판매자별 매출' },
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

        <SalesView currentTab={currentTab} />
      </Container>
    </DashboardContent>
  );
}