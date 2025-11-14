"use client";
import { useBoolean } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";

import { fDateTime } from "src/utils/format-time";
import { Markdown } from "src/components/markdown";
import { FileThumbnail } from "src/components/file-thumbnail";
import { Iconify } from "src/components/iconify";
import React, { useEffect, useState } from "react";
import { getNoticeAttachments } from "src/actions/notices";

export function NoticeDetailView({ currentNotice, loading, error }) {
  const showAttachments = useBoolean(true);
  const [answerContent, setAnswerContent] = useState(
    currentNotice?.answer || ""
  );
  const [answerSubmitting, setAnswerSubmitting] = React.useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    async function fetchAttachments() {
      if (!currentNotice?.id) return;
      try {
        const files = await getNoticeAttachments(currentNotice.id);
        setAttachments(files);

        console.log(files);
      } catch (err) {
        console.error("첨부파일 조회 실패", err);
      }
    }

    fetchAttachments();
  }, [currentNotice]);

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!currentNotice) return <Typography>문의가 존재하지 않습니다.</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* 메타 정보 */}
      <Stack
        direction="row"
        spacing={3}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ mb: 3, color: "text.secondary", fontSize: 14 }}
      >
        <div>작성일: {fDateTime(currentNotice.created_at)}</div>
        {currentNotice.updated_at && (
          <div>수정일: {fDateTime(currentNotice.updated_at)}</div>
        )}
      </Stack>

      <Stack direction={"row"} gap={1}>
        <Chip
          label={currentNotice.type}
          color="primary"
          size="small"
          variant="outlined"
        />
        {/* 제목 */}
        <Typography variant="h5" gutterBottom>
          {currentNotice.title}
        </Typography>
      </Stack>

      {/* 첨부파일 토글 */}
      {attachments?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ButtonBase
            onClick={showAttachments.onToggle}
            sx={{
              borderRadius: 1,
              typography: "caption",
              color: "text.secondary",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Iconify icon="eva:attach-2-fill" sx={{ mr: 0.5 }} />
            첨부파일 {attachments.length}개
            <Iconify
              icon={
                showAttachments.value
                  ? "eva:arrow-ios-upward-fill"
                  : "eva:arrow-ios-downward-fill"
              }
              width={16}
              sx={{ ml: 0.5 }}
            />
          </ButtonBase>

          <Collapse in={showAttachments.value} timeout="auto" unmountOnExit>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, flexWrap: "wrap", alignItems: "center" }}
            >
              {attachments.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <FileThumbnail
                    file={{ preview: file.url }} // preview에 url을 넣어줌
                    tooltip={file.filename}
                    sx={{ width: 48, height: 48 }}
                  />
                  {/* 다운로드 버튼 겹치도록 우측 하단에 작게 */}
                  <IconButton
                    size="small"
                    aria-label="Download"
                    onClick={() => window.open(file.url, "_blank")}
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      bgcolor: "rgba(255,255,255,0.7)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                      width: 20,
                      height: 20,
                      padding: 0,
                    }}
                  >
                    <Iconify
                      icon="eva:cloud-download-fill"
                      width={16}
                      height={16}
                    />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* 문의 내용 */}
      <Box
        sx={{
          bgcolor: "#f9f9fa",
          borderRadius: 2,
          p: 3,
          minHeight: 200,
          lineHeight: 1.8,
          whiteSpace: "pre-line",
          fontSize: 16,
          color: "text.primary",
          mb: 4,
        }}
      >
        <Markdown children={currentNotice.content} />
      </Box>
    </Box>
  );
}
