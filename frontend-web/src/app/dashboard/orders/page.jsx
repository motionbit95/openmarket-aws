'use client';

import { Box, Card, Container, Tab, Tabs } from '@mui/material';
import { useState } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';
import { OrdersView } from 'src/sections/orders/view';

// ----------------------------------------------------------------------

export default function OrdersPage() {
  const [currentTab, setCurrentTab] = useState('all');

  const tabs = [
    { value: 'all', label: '전체 주문' },
    { value: 'PENDING', label: '주문 접수' },
    { value: 'CONFIRMED', label: '주문확인' },
    { value: 'PREPARING', label: '준비중' },
    { value: 'SHIPPED', label: '배송중' },
    { value: 'DELIVERED', label: '배송완료' },
    { value: 'CANCELLED', label: '취소' },
    { value: 'REFUNDED', label: '환불' },
  ];

  // 유효한 탭 값인지 확인
  const validTabValues = tabs.map(tab => tab.value);
  const safeCurrentTab = validTabValues.includes(currentTab) ? currentTab : 'all';

  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Card>
            <Tabs
              value={safeCurrentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
              sx={{ px: 2, bgcolor: 'background.neutral' }}
            >
              {tabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Card>
        </Box>

        <OrdersView currentTab={safeCurrentTab} />
      </Container>
    </DashboardContent>
  );
}