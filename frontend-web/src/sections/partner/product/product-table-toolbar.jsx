import { useState, useCallback } from "react";
import { varAlpha } from "minimal-shared/utils";
import { usePopover } from "minimal-shared/hooks";

import Select from "@mui/material/Select";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import { Iconify } from "src/components/iconify";
import { CustomPopover } from "src/components/custom-popover";

export function ProductTableToolbar({ filters, options }) {
  const menuActions = usePopover();

  const { state: currentFilters, setState: updateFilters } = filters;

  // saleStatus, displayStatus 각각의 필터 상태
  const [saleStatus, setSaleStatus] = useState(currentFilters.saleStatus || []);
  const [displayStatus, setDisplayStatus] = useState(
    currentFilters.displayStatus || []
  );

  const handleChangeSaleStatus = useCallback((event) => {
    const {
      target: { value },
    } = event;

    setSaleStatus(typeof value === "string" ? value.split(",") : value);
  }, []);

  const handleChangeDisplayStatus = useCallback((event) => {
    const {
      target: { value },
    } = event;

    setDisplayStatus(typeof value === "string" ? value.split(",") : value);
  }, []);

  const handleFilterSaleStatus = useCallback(() => {
    updateFilters({ saleStatus });
  }, [updateFilters, saleStatus]);

  const handleFilterDisplayStatus = useCallback(() => {
    updateFilters({ displayStatus });
  }, [updateFilters, displayStatus]);

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: "right-top" } }}
    >
      <MenuList>
        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem>

        <MenuItem onClick={() => menuActions.onClose()}>
          <Iconify icon="solar:export-bold" />
          Export
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 }, mr: 2 }}>
        <InputLabel htmlFor="filter-saleStatus-select">판매 상태</InputLabel>
        <Select
          multiple
          value={saleStatus}
          onChange={handleChangeSaleStatus}
          onClose={handleFilterSaleStatus}
          input={<OutlinedInput label="판매 상태" />}
          renderValue={(selected) =>
            selected
              .map((value) => {
                const opt = options.saleStatusOptions.find(
                  (o) => o.value === value
                );
                return opt ? opt.label : value;
              })
              .join(", ")
          }
          inputProps={{ id: "filter-saleStatus-select" }}
          sx={{ textTransform: "capitalize" }}
        >
          {options.saleStatusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox
                disableRipple
                size="small"
                checked={saleStatus.includes(option.value)}
                slotProps={{
                  input: {
                    id: `${option.value}-checkbox`,
                    "aria-label": `${option.label} checkbox`,
                  },
                }}
              />
              {option.label}
            </MenuItem>
          ))}
          <MenuItem
            onClick={handleFilterSaleStatus}
            sx={[
              (theme) => ({
                justifyContent: "center",
                fontWeight: theme.typography.button,
                bgcolor: varAlpha(theme.vars.palette.grey["500Channel"], 0.08),
                border: `solid 1px ${varAlpha(theme.vars.palette.grey["500Channel"], 0.16)}`,
              }),
            ]}
          >
            적용
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
        <InputLabel htmlFor="filter-displayStatus-select">전시 상태</InputLabel>
        <Select
          multiple
          value={displayStatus}
          onChange={handleChangeDisplayStatus}
          onClose={handleFilterDisplayStatus}
          input={<OutlinedInput label="전시 상태" />}
          renderValue={(selected) =>
            selected
              .map((value) => {
                const opt = options.displayStatusOptions.find(
                  (o) => o.value === value
                );
                return opt ? opt.label : value;
              })
              .join(", ")
          }
          inputProps={{ id: "filter-displayStatus-select" }}
          sx={{ textTransform: "capitalize" }}
        >
          {options.displayStatusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox
                disableRipple
                size="small"
                checked={displayStatus.includes(option.value)}
                slotProps={{
                  input: {
                    id: `${option.value}-checkbox`,
                    "aria-label": `${option.label} checkbox`,
                  },
                }}
              />
              {option.label}
            </MenuItem>
          ))}

          <MenuItem
            disableGutters
            disableTouchRipple
            onClick={handleFilterDisplayStatus}
            sx={[
              (theme) => ({
                justifyContent: "center",
                fontWeight: theme.typography.button,
                bgcolor: varAlpha(theme.vars.palette.grey["500Channel"], 0.08),
                border: `solid 1px ${varAlpha(theme.vars.palette.grey["500Channel"], 0.16)}`,
              }),
            ]}
          >
            적용
          </MenuItem>
        </Select>
      </FormControl>

      {renderMenuActions()}
    </>
  );
}
