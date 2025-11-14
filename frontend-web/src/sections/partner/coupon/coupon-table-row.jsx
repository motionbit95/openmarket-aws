import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { useBoolean } from "minimal-shared/hooks";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { CouponNewEditForm } from "./coupon-new-edit-form";
import { ConfirmDialog } from "src/components/custom-dialog";
import { fDate } from "src/utils/format-time";

const COUPON_TYPE_LABELS = {
  all: "전체",
  user: "마켓 찜 유도",
  seller_first: "첫구매",
  seller_repeat: "재구매",
  seller_message: "메시지 전용",
};

const DISCOUNT_MODE_LABELS = {
  amount: "원",
  percent: "%",
};

export function CouponTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
}) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();

  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>쿠폰 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <CouponNewEditForm
            currentCoupon={row}
            onClose={quickEditForm.onFalse}
            onSubmitted={onSubmitted}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="삭제"
      content="이 쿠폰을 삭제 시키겠습니까?"
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          예
        </Button>
      }
    />
  );

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

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.title}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {COUPON_TYPE_LABELS[row.coupon_type]}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.total_count}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {row.discount_amount || 0}
          {DISCOUNT_MODE_LABELS[row.discount_mode]}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {fDate(row.start_date)}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {fDate(row.end_date)}
        </TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* 수정 버튼 */}
            <Tooltip title="수정" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? "inherit" : "default"}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            {/* 탈퇴 버튼 */}
            <Tooltip title="탈퇴" placement="top" arrow>
              <IconButton color="error" onClick={confirmDialog.onTrue}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {renderQuickEditForm()}
      {renderConfirmDialog()}
    </>
  );
}
