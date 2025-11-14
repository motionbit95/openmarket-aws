// components/table/GenericTableRow.jsx
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import { ListItemText } from "@mui/material";

import { Iconify } from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";
import { CustomPopover } from "src/components/custom-popover";

import { useBoolean, usePopover } from "minimal-shared/hooks";
import { fDate, fTime } from "src/utils/format-time";

export function TableRowView({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onViewOpen,
  viewDialogComponent: ViewDialogComponent,
  tableHead,
  editPath,
}) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const [selectedId, setSelectedId] = useState(null);

  const handleViewOpen = () => {
    setSelectedId(row.id);
    onViewOpen?.(row.id); // 부모에게도 전달 가능
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                "aria-label": `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        {/* 🔽 테이블 헤더 기반으로 자동 렌더링 */}
        {tableHead.map((column) => {
          const value = row[column.id];

          // 🔸 타이틀에만 뷰 클릭 동작 부여
          if (column.id === "title") {
            return (
              <TableCell
                key={column.id}
                sx={{
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                    color: "primary.dark",
                    backgroundColor: "action.hover",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
                onClick={handleViewOpen}
              >
                {value}
              </TableCell>
            );
          }

          // 🔸 날짜 포맷 처리 (created_at, updated_at 등)
          if (
            column.id?.includes("created_at") ||
            column.id?.includes("updated_at")
          ) {
            return (
              <TableCell key={column.id} sx={{ whiteSpace: "nowrap" }}>
                <ListItemText primary={fDate(value)} secondary={fTime(value)} />
              </TableCell>
            );
          }

          // 🔸 기본 셀 처리
          return (
            <TableCell key={column.id} sx={{ whiteSpace: "nowrap" }}>
              {value}
            </TableCell>
          );
        })}
      </TableRow>

      {/* 필요한 팝오버, 삭제 다이얼로그 */}
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: "right-top" } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: "error.main" }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            삭제
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="삭제"
        content="이 항목을 삭제하시겠습니까?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            예
          </Button>
        }
      />
    </>
  );
}
