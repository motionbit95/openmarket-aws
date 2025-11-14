"use client";

import { Box, Button, Card, Snackbar, Tab, Tabs } from "@mui/material";
import { DashboardContent } from "src/layouts/dashboard";

import { Editor } from "src/components/editor";
import { useEffect, useState } from "react";
import { Form } from "src/components/hook-form";
import { createTerms, updateTerms, getAllTerms } from "src/actions/terms";
import { toast } from "sonner";

const policyTitles = [
  "이용약관",
  "개인정보 처리방침",
  "위치기반 서비스 이용방침",
  "마케팅 목적의 개인정보 수집 및 이용 동의 약관",
  "카테고리 수수료 약정서",
];

const policyTypes = ["terms", "privacy", "location", "marketing", "fee"];

export function PolicyView() {
  const [tabIndex, setTabIndex] = useState(0);
  const [contents, setContents] = useState(Array(policyTitles.length).fill(""));
  const [existingTerms, setExistingTerms] = useState([]);

  useEffect(() => {
    async function fetchTerms() {
      try {
        const data = await getAllTerms();
        setExistingTerms(data);

        const initContents = policyTypes.map((type) => {
          const found = data.find((term) => type.toUpperCase() === term.type);
          return found?.content || "";
        });

        setContents(initContents);
      } catch (err) {
        console.error("약관 불러오기 실패", err);
      }
    }

    fetchTerms();
  }, []);

  const handleEditorChange = (index, value) => {
    const newContents = [...contents];
    newContents[index] = value;
    setContents(newContents);
  };

  const handleSave = async (event) => {
    event.preventDefault(); // 새로고침 방지

    try {
      const content = contents[tabIndex];
      const title = policyTitles[tabIndex];
      const type = policyTypes[tabIndex];
      const effective_date = new Date().toISOString().split("T")[0];

      const existing = existingTerms.find((term) => term.type === type);

      if (existing) {
        await updateTerms({
          id: existing.id,
          title,
          content,
          effective_date,
        });
      } else {
        await createTerms({
          type,
          title,
          content,
          effective_date,
        });
      }

      const updatedTerms = await getAllTerms();
      setExistingTerms(updatedTerms);

      toast.success("저장되었습니다.");
    } catch (error) {
      console.error("저장 실패", error);
      // 필요하면 에러 메시지 상태 관리해서 UI에 보여주기
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <DashboardContent>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {policyTitles.map((title, index) => (
          <Tab key={index} label={title} />
        ))}
      </Tabs>

      <Form onSubmit={handleSave}>
        <Card sx={{ p: 3 }}>
          <Editor
            key={tabIndex} // ⭐️ 이 줄만 추가하면 문제 해결
            title={policyTitles[tabIndex]}
            value={contents[tabIndex]}
            onChange={(value) => handleEditorChange(tabIndex, value)}
          />
        </Card>

        <Box textAlign="right" mt={2} mr={2}>
          <Button type="submit" variant="contained">
            저장
          </Button>
        </Box>
      </Form>
    </DashboardContent>
  );
}
