"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip
} from "@mui/material";
import { Iconify } from "src/components/iconify";

// 개별 탭 컴포넌트들
import PartnerOrderTab from "./components/order-tab";
import PartnerDeliveryTab from "./components/delivery-tab";
import PartnerCancelTab from "./components/cancel-tab";
import PartnerReturnTab from "./components/return-tab";

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sale-tabpanel-${index}`}
      aria-labelledby={`sale-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function PartnerSalePage() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const tabs = [
    {
      label: "주문 관리",
      icon: "material-symbols:shopping-cart",
      component: <PartnerOrderTab />
    },
    {
      label: "배송 관리",
      icon: "material-symbols:local-shipping",
      component: <PartnerDeliveryTab />
    },
    {
      label: "취소 관리",
      icon: "material-symbols:cancel",
      component: <PartnerCancelTab />
    },
    {
      label: "반품 관리",
      icon: "material-symbols:keyboard-return",
      component: <PartnerReturnTab />
    }
  ];

  return (
    <Box>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          판매 관리
        </Typography>
        <Typography variant="body2" color="text.secondary">
          주문, 배송, 취소, 반품을 통합 관리하세요
        </Typography>
      </Box>

      {/* 탭 및 콘텐츠 */}
      <Card sx={{ border: 'none', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          {/* 탭 헤더 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 3 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Iconify icon={tab.icon} width={20} />
                      {tab.label}
                    </Box>
                  }
                  id={`sale-tab-${index}`}
                  aria-controls={`sale-tabpanel-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {/* 탭 콘텐츠 */}
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={currentTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}