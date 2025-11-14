import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { fDateTime } from "src/utils/format-time";
import { Iconify } from "src/components/iconify";
import { Markdown } from "src/components/markdown";

export function DialogView({
  viewDialog,
  dataId,
  fetchDataById,
  typeMap = {},
  titleKey = "title",
  contentKey = "content",
  createdAtKey = "created_at",
  updatedAtKey = "updated_at",
  viewCountKey = "view_count",
  typeKey = "type",
  attachmentsKey = "attachments",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!viewDialog.value || !dataId) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await fetchDataById(dataId);
        setData(res);
      } catch (e) {
        console.error("데이터 불러오기 실패", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [viewDialog.value, dataId]);

  if (!data) return null;

  return (
    <Dialog
      open={viewDialog.value}
      onClose={viewDialog.onFalse}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: 22,
          borderBottom: "1px solid #eee",
        }}
      >
        {data?.[titleKey] || "상세 정보"}
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 4 }}>
        <Stack
          direction="row"
          spacing={3}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ my: 3, color: "text.secondary", fontSize: 14 }}
        >
          <div>작성일: {fDateTime(data?.[createdAtKey])}</div>
          <div>수정일: {fDateTime(data?.[updatedAtKey])}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Iconify icon="solar:eye-bold" fontSize="small" sx={{ mr: 0.5 }} />
            {data?.[viewCountKey] ?? 0}회 조회
          </div>
          <Chip
            size="small"
            label={typeMap[data?.[typeKey]] || "기타"}
            variant="outlined"
            color="primary"
          />
        </Stack>

        <Box
          sx={{
            bgcolor: "#f9f9fa",
            borderRadius: 2,
            p: 3,
            minHeight: 200,
            lineHeight: 1.9,
            whiteSpace: "pre-line",
            fontSize: 16,
            color: "text.primary",
          }}
        >
          <Markdown>{data?.[contentKey]}</Markdown>
        </Box>

        {/* 첨부파일 */}
        {data?.[attachmentsKey]?.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ fontWeight: "bold", mb: 1 }}>📎 첨부파일</Box>
            <Stack spacing={1}>
              {data[attachmentsKey].map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#f0f0f0",
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "70%",
                    }}
                  >
                    {file.name}
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    href={file.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    다운로드
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button
          onClick={viewDialog.onFalse}
          variant="contained"
          color="primary"
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
