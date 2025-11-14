import { Field, Form } from "src/components/hook-form";
import { useForm } from "react-hook-form";
import { Box, Button, Card, Grid, Typography, MenuItem } from "@mui/material";
import { Editor } from "src/components/editor";
import { Upload } from "src/components/upload";
import { useEffect, useState } from "react";
import { useBoolean } from "minimal-shared/hooks";
import { DashboardContent } from "src/layouts/dashboard";

const CATEGORY_OPTIONS = [
  "회원가입/로그인",
  "정산/지급",
  "구매/결제",
  "환불/취소",
  "오류",
  "기능제안",
  "UI/UX 개선",
  "기타",
];

export function EtcForm({
  initialData = null,
  onSubmit,
  isEdit = false,
  loading = false,
}) {
  const methods = useForm({ mode: "all" });
  const {
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = methods;

  const [images, setImages] = useState({ files: [] });
  const showPreview = useBoolean();

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        content: initialData.content || "",
        category: initialData.category || "",
      });

      const initialFiles =
        initialData.attachments?.map((file) => ({
          ...file,
          preview: file.url,
          existing: true,
        })) || [];

      setImages({ files: initialFiles });
    }
  }, [initialData, reset]);

  const internalSubmit = handleSubmit(async (formData) => {
    const newFiles = images.files.filter((file) => !file.existing);
    console.log(formData);
    await onSubmit({ ...formData, files: images.files, newFiles });
  });

  return (
    <DashboardContent>
      <Form methods={methods} onSubmit={internalSubmit}>
        <Card sx={{ p: 3, width: "100%" }}>
          <Grid container spacing={3} sx={{ width: "100%" }}>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 3,
              }}
            >
              <Grid item xs={12}>
                <Typography variant="h6">카테고리</Typography>
                <Field.Select name="category" fullWidth>
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">제목</Typography>
                <Field.Text name="title" />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">내용</Typography>
                <Editor
                  title="내용"
                  value={watch("content")}
                  onChange={(value) => setValue("content", value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">첨부파일</Typography>
                <Upload
                  multiple
                  thumbnail={showPreview.value}
                  value={images.files}
                  name="uploadFiles"
                  onDrop={(newFiles) => {
                    setImages((prev) => ({
                      ...prev,
                      files: [...prev.files, ...Array.from(newFiles)].slice(
                        0,
                        10
                      ),
                    }));
                  }}
                  onDelete={(fileToDelete) => {
                    setImages((prev) => ({
                      ...prev,
                      files: prev.files.filter((file) => file !== fileToDelete),
                    }));
                  }}
                  onRemove={(fileToDelete) => {
                    setImages((prev) => ({
                      ...prev,
                      files: prev.files.filter((file) => file !== fileToDelete),
                    }));
                  }}
                  placeholder={{
                    title: "첨부파일 업로드",
                    description:
                      "여기에 첨부파일을 업로드해주세요. (최대 10개)",
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Card>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={isSubmitting || loading}
          >
            {isEdit ? "수정" : "등록"}
          </Button>
        </Box>
      </Form>
    </DashboardContent>
  );
}
