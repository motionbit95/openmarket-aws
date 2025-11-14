"use client";
import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Field } from "src/components/hook-form"; // Field.Select, Field.Text 내부에 Controller 연결 필수
import { Box, Button, Grid, MenuItem, Typography } from "@mui/material";
import { Editor } from "src/components/editor";
import { useBoolean } from "minimal-shared/hooks";
import { createFAQ, updateFAQ } from "src/actions/faq";
import { toast } from "sonner";

export function FAQNewEditForm({
  initialData = null,
  isEdit = false,
  loading = false,
  onSubmitted,
  onClose,
}) {
  const methods = useForm({
    mode: "all",
    defaultValues: {
      title: "", // ✅ 빈 문자열로 초기화
    },
  });
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
    if (initialData) {
      reset({
        title: initialData.title ?? "",
        content: initialData.content ?? "",
        type: initialData.type ?? "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    const newFiles = images.files.filter((file) => !file.existing);
    const { title, content, type } = formData;

    console.log(formData);

    try {
      let guide;
      if (isEdit) {
        guide = await updateFAQ({
          id: initialData.id,
          title,
          content,
          type,
        });
      } else {
        guide = await createFAQ({
          title,
          content,
          type,
        });
      }

      if (newFiles.length > 0 && guide?.id) {
        await uploadFiles({ guideId: guide.id, files: newFiles });
      }

      toast.success(`FAQ가 성공적으로 ${isEdit ? "수정" : "등록"}되었습니다.`);
      onSubmitted?.();
      onClose?.();
    } catch (error) {
      console.error("FAQ 제출 중 오류:", error);
      toast.error(
        isEdit ? "FAQ 수정에 실패했습니다." : "FAQ 등록에 실패했습니다."
      );
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3} sx={{ width: "100%" }}>
          <Grid sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid>
                <Typography variant="h6">대상</Typography>
                <Controller
                  name="type"
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

              <Grid sx={{ flex: 1 }}>
                <Typography variant="h6">질문</Typography>
                <Field.Text name="title" fullWidth />
              </Grid>
            </Grid>

            <Grid>
              <Typography variant="h6">답변</Typography>
              <Editor
                title="내용"
                value={watch("content")}
                onChange={(value) => setValue("content", value)}
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
