"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Field, Form } from "src/components/hook-form"; // Field.Select, Field.Text 내부에 Controller 연결 필수
import { Box, Button, Grid, MenuItem, Typography } from "@mui/material";
import { Editor } from "src/components/editor";
import { Upload } from "src/components/upload";
import { useBoolean } from "minimal-shared/hooks";
import {
  createErrorReport,
  getErrorReportAttachments,
  updateErrorReport,
  uploadFiles,
} from "src/actions/etc";
import { toast } from "sonner";

export function EtcNewEditForm({
  initialData = null,
  isEdit = false,
  loading = false,
  onSubmitted,
  onClose,
  type,
}) {
  const methods = useForm({ mode: "all" });
  const {
    watch,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isSubmitting },
  } = methods;

  const [images, setImages] = useState({ files: [] });
  const showPreview = useBoolean();

  useEffect(() => {
    async function fetchAttachments() {
      if (!initialData?.id) return;
      try {
        const files = await getErrorReportAttachments(initialData.id);

        const existingFiles = files.map((file) => ({
          ...file,
          preview: file.url,
          existing: true,
          name: file.filename,
          size: file.filesize,
        }));

        setImages({ files: existingFiles });
      } catch (err) {
        console.error("첨부파일 조회 실패", err);
      }
    }

    fetchAttachments();
  }, [initialData?.id]);

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title ?? "",
        content: initialData.content ?? "",
        reporter_id: initialData.reporter_id ?? "",
        reporter_type: initialData.reporter_type ?? "user",
        category: initialData.category ?? "error",
      });
    }
  }, [initialData, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    const newFiles = images.files.filter((file) => !file.existing);
    const { title, content, reporter_id, reporter_type, category } = formData;

    try {
      let report;
      if (isEdit) {
        report = await updateErrorReport({
          id: initialData.id,
          title,
          content,
          reporter_id: Number(reporter_id),
          reporter_type,
          category: type,
        });
      } else {
        report = await createErrorReport({
          reporter_id: Number(reporter_id),
          reporter_type,
          title,
          content,
          category: type,
        });
      }

      if (newFiles.length > 0 && report?.id) {
        await uploadFiles({ reportId: report.id, files: newFiles });
      }

      toast.success(
        `문의사항이 성공적으로 ${isEdit ? "수정" : "등록"}되었습니다.`
      );
      onSubmitted?.();
      onClose?.();
    } catch (error) {
      console.error("문의 제출 중 오류:", error);
      toast.error(
        isEdit
          ? "제보/제안 수정에 실패했습니다."
          : "제보/제안 등록에 실패했습니다."
      );
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3} sx={{ width: "100%" }}>
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item>
                <Typography variant="h6">제보자 유형</Typography>
                <Controller
                  name="reporter_type"
                  control={control}
                  defaultValue="user"
                  render={({ field }) => (
                    <Field.Select {...field} sx={{ width: 200 }}>
                      <MenuItem value="user">유저</MenuItem>
                      <MenuItem value="seller">판매자</MenuItem>
                    </Field.Select>
                  )}
                />
              </Grid>

              <Grid item>
                <Typography variant="h6">제보 유형</Typography>
                <Controller
                  name="category"
                  control={control}
                  defaultValue="error"
                  render={({ field }) => (
                    <Field.Select {...field} sx={{ width: 200 }}>
                      <MenuItem value="error">오류제보</MenuItem>
                      <MenuItem value="dev">기능제안</MenuItem>
                    </Field.Select>
                  )}
                />
              </Grid>

              <Grid item sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="h6">제보자 ID</Typography>
                <Field.Text name="reporter_id" type="number" fullWidth />
              </Grid>
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
                onDrop={(newFiles) =>
                  setImages((prev) => ({
                    ...prev,
                    files: [...prev.files, ...Array.from(newFiles)].slice(
                      0,
                      10
                    ),
                  }))
                }
                onDelete={(fileToDelete) =>
                  setImages((prev) => ({
                    ...prev,
                    files: prev.files.filter((file) => file !== fileToDelete),
                  }))
                }
                onRemove={(fileToDelete) =>
                  setImages((prev) => ({
                    ...prev,
                    files: prev.files.filter((file) => file !== fileToDelete),
                  }))
                }
                placeholder={{
                  title: "첨부파일 업로드",
                  description: "여기에 첨부파일을 업로드해주세요. (최대 10개)",
                }}
              />
            </Grid>
          </Grid>
        </Grid>

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
      </form>
    </FormProvider>
  );
}
