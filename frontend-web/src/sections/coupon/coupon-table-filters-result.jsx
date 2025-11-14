import { useCallback } from "react";

import Chip from "@mui/material/Chip";

import {
  chipProps,
  FiltersBlock,
  FiltersResult,
} from "src/components/filters-result";

// ----------------------------------------------------------------------

export function CouponTableFiltersResult({
  filters,
  onResetPage,
  totalResults,
  sx,
}) {
  const {
    state: currentFilters,
    setState: updateFilters,
    resetState: resetFilters,
  } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: "" });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: "all" });
  }, [onResetPage, updateFilters]);

  const handleRemoveCouponType = useCallback(() => {
    onResetPage();
    updateFilters({ couponType: "all" });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  // 쿠폰 타입 라벨 매핑
  const couponTypeLabels = {
    all: "전체",
    ALL: "전체",
    USER: "마켓 찜 유도",
    SELLER_FIRST: "첫구매",
    SELLER_REPEAT: "재구매",
    SELLER_MESSAGE: "메시지 전용",
  };

  // 발급 상태 라벨 매핑
  const statusLabels = {
    all: "전체",
    upcoming: "발급 예정",
    active: "발급 중",
    expired: "발급 종료",
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label="쿠폰 타입:"
        isShow={
          currentFilters.couponType && currentFilters.couponType !== "all"
        }
      >
        <Chip
          {...chipProps}
          label={
            couponTypeLabels[currentFilters.couponType] ||
            currentFilters.couponType
          }
          onDelete={handleRemoveCouponType}
        />
      </FiltersBlock>

      <FiltersBlock label="발급 상태:" isShow={currentFilters.status !== "all"}>
        <Chip
          {...chipProps}
          label={statusLabels[currentFilters.status] || currentFilters.status}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock label="검색어:" isShow={!!currentFilters.name}>
        <Chip
          {...chipProps}
          label={currentFilters.name}
          onDelete={handleRemoveKeyword}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
