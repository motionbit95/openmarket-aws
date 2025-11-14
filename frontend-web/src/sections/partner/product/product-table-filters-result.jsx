import { useCallback } from "react";
import { upperFirst } from "es-toolkit";

import Chip from "@mui/material/Chip";

import {
  chipProps,
  FiltersBlock,
  FiltersResult,
} from "src/components/filters-result";

// ----------------------------------------------------------------------

export function ProductTableFiltersResult({ filters, totalResults, sx }) {
  const {
    state: currentFilters,
    setState: updateFilters,
    resetState: resetFilters,
  } = filters;

  const handleRemoveSaleStatus = useCallback(
    (inputValue) => {
      const newValue = currentFilters.saleStatus.filter(
        (item) => item !== inputValue
      );
      updateFilters({ saleStatus: newValue });
    },
    [updateFilters, currentFilters.saleStatus]
  );

  const handleRemoveDisplayStatus = useCallback(
    (inputValue) => {
      const newValue = currentFilters.displayStatus.filter(
        (item) => item !== inputValue
      );
      updateFilters({ displayStatus: newValue });
    },
    [updateFilters, currentFilters.displayStatus]
  );

  const handleRemoveSearch = useCallback(() => {
    updateFilters({ search: "" });
  }, [updateFilters]);

  return (
    <FiltersResult
      totalResults={totalResults}
      onReset={() => resetFilters()}
      sx={sx}
    >
      <FiltersBlock
        label="판매상태:"
        isShow={!!currentFilters.saleStatus.length}
      >
        {currentFilters.saleStatus.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={upperFirst(item)}
            onDelete={() => handleRemoveSaleStatus(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock
        label="전시상태:"
        isShow={!!currentFilters.displayStatus.length}
      >
        {currentFilters.displayStatus.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={upperFirst(item)}
            onDelete={() => handleRemoveDisplayStatus(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="검색어:" isShow={!!currentFilters.search?.trim()}>
        <Chip
          {...chipProps}
          label={currentFilters.search}
          onDelete={handleRemoveSearch}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
