"use client";

import { useBoolean } from "minimal-shared/hooks";
import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Rating from "@mui/material/Rating";

import { fDateTime } from "src/utils/format-time";
import { Markdown } from "src/components/markdown";
import { FileThumbnail } from "src/components/file-thumbnail";
import { Iconify } from "src/components/iconify";
import { getReviewAttachments } from "src/actions/review"; // ⭐️ API 함수 필요
import { Avatar } from "@mui/material";
import { getCategoryNameByCode } from "../product/component/category";

export function ReviewDetailView({ currentReview, loading, error }) {
  const showImages = useBoolean(true);
  const [images, setImages] = useState([]);

  useEffect(() => {
    async function fetchImages() {
      if (!currentReview?.id) return;
      try {
        const res = await getReviewAttachments(currentReview.id);
        setImages(res || []);
      } catch (err) {
        console.error("리뷰 이미지 조회 실패", err);
      }
    }

    fetchImages();
  }, [currentReview]);

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!currentReview) return <Typography>리뷰가 존재하지 않습니다.</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* 메타 정보 */}
      <Stack
        direction="row"
        spacing={3}
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ mb: 3, color: "text.secondary", fontSize: 14 }}
      >
        <div>작성일: {fDateTime(currentReview.createdAt)}</div>
        {currentReview.updated_at && (
          <div>수정일: {fDateTime(currentReview.updatedAt)}</div>
        )}
        <div>작성자: {currentReview.users?.user_name || "알 수 없음"}</div>
      </Stack>

      {/* 상품 정보 */}
      {currentReview.Product && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            상품 정보
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              alt={currentReview.Product.displayName}
              src={
                currentReview.Product.ProductImage?.[0]?.url ||
                "/placeholder.svg"
              }
              variant="rounded"
              sx={{ width: 48, height: 48 }}
            />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {currentReview.Product.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getCategoryNameByCode(currentReview.Product.categoryCode)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* 평점 + 제목 */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Rating value={currentReview.rating} readOnly precision={0.5} />
      </Stack>

      {/* 이미지 토글 */}
      {images?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ButtonBase
            onClick={showImages.onToggle}
            sx={{
              borderRadius: 1,
              typography: "caption",
              color: "text.secondary",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Iconify icon="eva:image-2-fill" sx={{ mr: 0.5 }} />
            리뷰 이미지 {images.length}장
            <Iconify
              icon={
                showImages.value
                  ? "eva:arrow-ios-upward-fill"
                  : "eva:arrow-ios-downward-fill"
              }
              width={16}
              sx={{ ml: 0.5 }}
            />
          </ButtonBase>

          <Collapse in={showImages.value} timeout="auto" unmountOnExit>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, flexWrap: "wrap", alignItems: "center" }}
            >
              {images.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <ButtonBase
                    onClick={() => window.open(file.url, "_blank")}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      overflow: "hidden",
                      p: 0,
                      display: "block",
                    }}
                  >
                    <img
                      src={file.url}
                      alt={file.filename || "리뷰 이미지"}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </ButtonBase>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* 리뷰 내용 */}
      <Box
        sx={{
          bgcolor: "#f9f9fa",
          borderRadius: 2,
          p: 3,
          minHeight: 160,
          lineHeight: 1.8,
          fontSize: 16,
          color: "text.primary",
          mb: 4,
        }}
      >
        <Markdown>{currentReview.content}</Markdown>
      </Box>
    </Box>
  );
}
