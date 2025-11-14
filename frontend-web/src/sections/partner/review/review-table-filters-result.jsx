import { useCallback } from "react";
import Chip from "@mui/material/Chip";
import {
  chipProps,
  FiltersBlock,
  FiltersResult,
} from "src/components/filters-result";

// ----------------------------------------------------------------------

export function ReviewTableFiltersResult({
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
    updateFilters({ keyword: "" });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: "all" });
  }, [onResetPage, updateFilters]);

  const handleRemoveRating = useCallback(
    (valueToRemove) => {
      const newValue = currentFilters.rating.filter(
        (item) => item !== valueToRemove
      );
      onResetPage();
      updateFilters({ rating: newValue });
    },
    [onResetPage, updateFilters, currentFilters.rating]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="상태:" isShow={currentFilters.status !== "all"}>
        <Chip
          {...chipProps}
          label={currentFilters.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: "capitalize" }}
        />
      </FiltersBlock>

      <FiltersBlock label="평점:" isShow={!!currentFilters.rating.length}>
        {currentFilters.rating.map((value) => (
          <Chip
            {...chipProps}
            key={value}
            label={`${value}점`}
            onDelete={() => handleRemoveRating(value)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="검색어:" isShow={!!currentFilters.keyword}>
        <Chip
          {...chipProps}
          label={currentFilters.keyword}
          onDelete={handleRemoveKeyword}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
