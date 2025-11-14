"use client";

import { useState } from "react";
import { orderBy } from "es-toolkit";
import { useBoolean, useSetState } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { Iconify } from "src/components/iconify";

import { paths } from "src/routes/paths";

import {
  PRODUCT_SORT_OPTIONS,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_RATING_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
} from "src/actions/product";

import { EmptyContent } from "src/components/empty-content";
import { exportToExcel, formatProductsForExcel } from "src/utils/excel-export";
import { toast } from "src/components/snackbar";

import { CartIcon } from "../cart-icon";
import { ProductList } from "../product-list";
import { ProductSort } from "../product-sort";
import { ProductSearch } from "../product-search";
import { ProductFiltersDrawer } from "../product-filters-drawer";
import { ProductFiltersResult } from "../product-filters-result";

// ----------------------------------------------------------------------

export function ProductShopView({ products }) {
  const openFilters = useBoolean();

  const [sortBy, setSortBy] = useState("featured");

  const filters = useSetState({
    gender: [],
    colors: [],
    rating: "",
    category: "all",
    priceRange: [0, 200],
  });
  const { state: currentFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: products,
    filters: currentFilters,
    sortBy,
  });

  const canReset =
    currentFilters.gender.length > 0 ||
    currentFilters.colors.length > 0 ||
    currentFilters.rating !== "" ||
    currentFilters.category !== "all" ||
    currentFilters.priceRange[0] !== 0 ||
    currentFilters.priceRange[1] !== 200;

  const notFound = !dataFiltered.length && canReset;
  const isEmpty = !products.length;

  const handleExcelDownload = () => {
    try {
      const formattedData = formatProductsForExcel(products);
      exportToExcel(formattedData, "상품관리");
      toast.success("엑셀 다운로드가 완료되었습니다.");
    } catch (error) {
      console.error("Excel download failed:", error);
      toast.error("엑셀 다운로드에 실패했습니다.");
    }
  };

  const renderFilters = () => (
    <Box
      sx={{
        gap: 3,
        display: "flex",
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-end", sm: "center" },
      }}
    >
      <ProductSearch redirectPath={(id) => paths.product.details(id)} />

      <Box sx={{ gap: 1, flexShrink: 0, display: "flex" }}>
        <ProductFiltersDrawer
          filters={filters}
          canReset={canReset}
          open={openFilters.value}
          onOpen={openFilters.onTrue}
          onClose={openFilters.onFalse}
          options={{
            colors: PRODUCT_COLOR_OPTIONS,
            ratings: PRODUCT_RATING_OPTIONS,
            genders: PRODUCT_GENDER_OPTIONS,
            categories: ["all", ...PRODUCT_CATEGORY_OPTIONS],
          }}
        />

        <ProductSort
          sort={sortBy}
          onSort={(newValue) => setSortBy(newValue)}
          sortOptions={PRODUCT_SORT_OPTIONS}
        />
      </Box>
    </Box>
  );

  const renderResults = () => (
    <ProductFiltersResult
      filters={filters}
      totalResults={dataFiltered.length}
    />
  );

  const renderNotFound = () => <EmptyContent filled sx={{ py: 10 }} />;

  return (
    <Container sx={{ mb: 10 }}>
      <CartIcon totalItems={checkoutState.totalItems} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: { xs: 3, md: 5 } }}>
        <Typography variant="h4">
          Shop
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:download-fill" />}
          onClick={handleExcelDownload}
          disabled={products.length === 0}
        >
          엑셀 다운로드
        </Button>
      </Stack>

      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters()}
        {canReset && renderResults()}
      </Stack>

      {notFound || isEmpty ? (
        renderNotFound()
      ) : (
        <ProductList products={dataFiltered} />
      )}
    </Container>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters, sortBy }) {
  const { gender, category, colors, priceRange, rating } = filters;

  const min = priceRange[0];
  const max = priceRange[1];

  // Sort by
  if (sortBy === "featured") {
    inputData = orderBy(inputData, ["totalSold"], ["desc"]);
  }

  if (sortBy === "newest") {
    inputData = orderBy(inputData, ["createdAt"], ["desc"]);
  }

  if (sortBy === "priceDesc") {
    inputData = orderBy(inputData, ["price"], ["desc"]);
  }

  if (sortBy === "priceAsc") {
    inputData = orderBy(inputData, ["price"], ["asc"]);
  }

  // filters
  if (gender.length) {
    inputData = inputData.filter((product) =>
      product.gender.some((i) => gender.includes(i))
    );
  }

  if (category !== "all") {
    inputData = inputData.filter((product) => product.category === category);
  }

  if (colors.length) {
    inputData = inputData.filter((product) =>
      product.colors.some((color) => colors.includes(color))
    );
  }

  if (min !== 0 || max !== 200) {
    inputData = inputData.filter(
      (product) => product.price >= min && product.price <= max
    );
  }

  if (rating) {
    inputData = inputData.filter((product) => {
      const convertRating = (value) => {
        if (value === "up4Star") return 4;
        if (value === "up3Star") return 3;
        if (value === "up2Star") return 2;
        return 1;
      };
      return product.totalRatings > convertRating(rating);
    });
  }

  return inputData;
}
