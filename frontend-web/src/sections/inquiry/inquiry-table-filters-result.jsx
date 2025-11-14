import { useCallback } from "react";

import Chip from "@mui/material/Chip";

import {
  chipProps,
  FiltersBlock,
  FiltersResult,
} from "src/components/filters-result";
import { fDate } from "src/utils/format-time";

// ----------------------------------------------------------------------

export function InquiryTableFiltersResult({
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

  const handleRemoveStartDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveEndDate = useCallback(() => {
    onResetPage();
    updateFilters({ endDate: null });
  }, [onResetPage, updateFilters]);

  const handleRemoveSenderType = useCallback(() => {
    onResetPage();
    updateFilters({ senderType: "all" });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  const senderTypeLabels = {
    all: "전체",
    seller: "판매자",
    user: "사용자",
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="구분:" isShow={currentFilters.senderType !== "all"}>
        <Chip
          {...chipProps}
          label={
            senderTypeLabels[currentFilters.senderType] ||
            currentFilters.senderType
          }
          onDelete={handleRemoveSenderType}
        />
      </FiltersBlock>

      <FiltersBlock label="검색어:" isShow={!!currentFilters.name}>
        <Chip
          {...chipProps}
          label={currentFilters.name}
          onDelete={handleRemoveKeyword}
        />
      </FiltersBlock>

      <FiltersBlock label="시작일:" isShow={!!currentFilters.startDate}>
        <Chip
          {...chipProps}
          label={fDate(currentFilters.startDate)}
          onDelete={handleRemoveStartDate}
        />
      </FiltersBlock>

      <FiltersBlock label="종료일:" isShow={!!currentFilters.endDate}>
        <Chip
          {...chipProps}
          label={fDate(currentFilters.endDate)}
          onDelete={handleRemoveEndDate}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
