// src/components/notice/NoticeForm.js
"use client";

import { Field, Form } from "src/components/hook-form";
import { useForm } from "react-hook-form";
import { Box, Button, Card, Grid, Typography } from "@mui/material";
import { Editor } from "src/components/editor";
import { Upload } from "src/components/upload";
import { useEffect, useState } from "react";
import { useBoolean } from "minimal-shared/hooks";

export function FormView({
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
    formState: { isSubmitting, isValid },
  } = methods;

  const [images, setImages] = useState({ files: [] });
  const showPreview = useBoolean();

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        content: initialData.content || "",
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
    await onSubmit({ ...formData, files: images.files, newFiles });
  });

  return (
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
            <Grid item xs={12} md={6}>
              <Typography variant="h6">제목</Typography>
              <Field.Text name="title" />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">내용</Typography>
              <Editor
                title="내용"
                value={watch("content")}
                onChange={(value) => setValue("content", value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
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
                  description: "여기에 첨부파일을 업로드해주세요. (최대 10개)",
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
  );
}
