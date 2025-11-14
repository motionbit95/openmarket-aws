"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Box, Button, Grid, Typography, Rating } from "@mui/material";
import { Field } from "src/components/hook-form";
import { Editor } from "src/components/editor";
import { Upload } from "src/components/upload";
import { useBoolean } from "minimal-shared/hooks";
import { toast } from "sonner";
import {
  createReview,
  deleteFiles,
  getReviewAttachments,
  updateReview,
  uploadReviewImages,
} from "src/actions/review";

export function ReviewNewEditForm({
  productId,
  initialData = null,
  isEdit = false,
  loading = false,
  onSubmitted,
  onClose,
}) {
  const methods = useForm({
    mode: "all",
    defaultValues: {
      content: "",
      rating: 5,
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

  // 리뷰 이미지 조회 (수정 시)
  useEffect(() => {
    async function fetchImages() {
      if (!initialData?.id) return;
      try {
        const files = await getReviewAttachments(initialData.id);
        const existingFiles = files.map((file) => ({
          ...file,
          preview: file.url,
          existing: true,
          name: file.filename,
          size: file.filesize,
        }));
        setImages({ files: existingFiles });
      } catch (err) {
        console.error("리뷰 이미지 조회 실패", err);
      }
    }

    fetchImages();
  }, [initialData?.id]);

  // 초기값 세팅
  useEffect(() => {
    if (initialData) {
      reset({
        content: initialData.content ?? "",
        rating: initialData.rating ?? 5,
      });
    }
  }, [initialData, reset]);

  function extractTextFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  // 제출
  const onSubmit = handleSubmit(async (formData) => {
    const { content, rating } = formData;
    const newFiles = images.files.filter((file) => !file.existing);
    const existingFiles = images.files.filter((file) => file.existing);

    try {
      let review;

      // 기존 첨부파일 id 목록 조회
      let prevAttachments = [];
      if (isEdit && initialData?.id) {
        prevAttachments = await getReviewAttachments(initialData.id);
      }
      const prevFileIds = (prevAttachments || []).map((file) => file.id);

      // 현재 남아있는 기존 파일 id 목록
      const currentFileIds = existingFiles
        .filter((file) => file && typeof file === "object" && "id" in file)
        .map((file) => file.id);

      // 삭제된 파일 id만 추출
      const deletedFileIds = prevFileIds.filter(
        (id) => !currentFileIds.includes(id)
      );
      if (deletedFileIds.length > 0) {
        await deleteFiles({ ids: deletedFileIds });
      }

      if (isEdit) {
        // 편집인 경우 이미지 제외하고 업데이트
        review = await updateReview({
          id: initialData.id,
          content: extractTextFromHtml(content),
          rating,
          userId: 143, // 숫자 형태로
        });
      } else {
        // 새 리뷰 생성
        review = await createReview({
          productId,
          content: extractTextFromHtml(content),
          rating,
          userId: 143, // 숫자 형태로
        });
      }

      // 이미지 새로 업로드 및 등록
      if (newFiles.length > 0 && review?.id) {
        const uploadedImages = await uploadReviewImages({
          reviewId: review.id,
          files: newFiles,
        });

        await updateReview({
          id: review.id,
          images: uploadedImages.files.map(({ url }, index) => ({
            url,
            sortOrder: index,
          })),
        });
      }

      toast.success(`리뷰가 성공적으로 ${isEdit ? "수정" : "등록"}되었습니다.`);
      onSubmitted?.();
      onClose?.();
    } catch (error) {
      console.error("리뷰 제출 실패:", error);
      toast.error(isEdit ? "리뷰 수정 실패" : "리뷰 등록 실패");
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3} sx={{ width: "100%" }}>
          <Grid sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 별점 */}
            <Grid>
              <Typography variant="h6" gutterBottom>
                평점
              </Typography>
              <Controller
                name="rating"
                control={control}
                defaultValue={5}
                render={({ field }) => (
                  <Rating {...field} precision={0.5} size="large" />
                )}
              />
            </Grid>

            {/* 내용 */}
            <Grid>
              <Typography variant="h6">내용</Typography>
              <Editor
                title="리뷰 내용"
                value={watch("content")}
                onChange={(value) => setValue("content", value)}
              />
            </Grid>

            {/* 이미지 업로드 */}
            <Grid>
              <Typography variant="h6">리뷰 이미지</Typography>
              <Upload
                multiple
                thumbnail={showPreview.value}
                value={images.files}
                name="uploadFiles"
                onDrop={(newFiles) =>
                  setImages((prev) => ({
                    ...prev,
                    files: [...prev.files, ...Array.from(newFiles)].slice(0, 5),
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
                  title: "이미지 업로드",
                  description:
                    "리뷰에 첨부할 이미지를 업로드해주세요. (최대 5장)",
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
