"use client";

import { Box, Card, Container, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DashboardContent } from "src/layouts/dashboard";
import { getAllTerms } from "src/actions/terms";
import { Markdown } from "src/components/markdown";

export function PartnerPolicyView({ type }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    async function fetchTerms() {
      try {
        const data = await getAllTerms();
        console.log(data);
        const matched = data.find(
          (term) => term.type.toLowerCase() === type.toLowerCase()
        );
        setContent(matched?.content || "약관 내용이 없습니다.");
      } catch (err) {
        console.error("약관 불러오기 실패", err);
        setContent("약관을 불러오는 중 오류가 발생했습니다.");
      }
    }

    fetchTerms();
  }, [type]);

  return (
    <DashboardContent>
      <Container maxWidth="md">
        <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom>
            {type === "privacy"
              ? "개인정보 처리방침"
              : type === "terms"
                ? "이용약관"
                : type === "fee"
                  ? "카테고리 수수료 약정서"
                  : ""}
          </Typography>

          <Markdown>{content}</Markdown>
        </Card>
      </Container>
    </DashboardContent>
  );
}
