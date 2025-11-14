"use client";

import { useEffect, useState } from "react";
import { DashboardContent } from "src/layouts/dashboard";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";
import { ProductNewEditForm } from "../product-new-edit-form";
import { getProductById } from "src/actions/product";
import { Box, CircularProgress } from "@mui/material";

export function ProductCreateView({ productId }) {
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    if (productId) {
      (async () => {
        try {
          const product = await getProductById(productId);

          // 백엔드 데이터 구조를 프론트엔드 폼 구조로 변환
          const transformedProduct = {
            ...product,
            // 이미지 데이터 변환
            images:
              product.ProductImage?.map((img, index) => ({
                url: img.url,
                isMain: img.isMain,
                sortOrder: img.sortOrder || index,
              })) || [],

            // 가격 데이터 변환
            prices: product.ProductPrice
              ? {
                  originalPrice: product.ProductPrice.originalPrice,
                  salePrice: product.ProductPrice.salePrice,
                  discountRate: product.ProductPrice.discountRate,
                }
              : {
                  originalPrice: null,
                  salePrice: null,
                  discountRate: null,
                },

            // 상품고시 데이터 변환
            infoNotices:
              product.ProductInfoNotice?.map((notice) => ({
                name: notice.name,
                value: notice.value,
              })) || [],

            // 키워드 데이터 변환 (문자열인 경우 파싱)
            keywords: Array.isArray(product.keywords)
              ? product.keywords
              : typeof product.keywords === "string"
                ? JSON.parse(product.keywords)
                : [],

            // 옵션 데이터 변환
            options:
              product.ProductOptionGroup?.map((group) => ({
                name: group.name,
                displayName: group.displayName,
                required: group.required,
                sortOrder: group.sortOrder,
                values:
                  group.ProductOptionValue?.map((value) => ({
                    value: value.value,
                    displayName: value.displayName,
                    colorCode: value.colorCode,
                    extraPrice: value.extraPrice,
                    sortOrder: value.sortOrder,
                    isAvailable: value.isAvailable,
                  })) || [],
              })) || [],
          };

          console.log("변환된 상품 데이터:", transformedProduct);
          setCurrentProduct(transformedProduct);
        } catch (err) {
          console.error("상품 불러오기 실패", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [productId]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={productId ? "상품 수정" : "상품 등록"}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 320,
            py: 8,
          }}
        >
          <CircularProgress color="primary" size={48} sx={{ mb: 4 }} />
          <Box sx={{ mt: 2, color: "text.secondary", fontSize: 18 }}>
            로딩 중...
          </Box>
        </Box>
      ) : (
        <ProductNewEditForm currentProduct={currentProduct} />
      )}
    </DashboardContent>
  );
}
