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
  Chip,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { CouponNewEditForm } from "./coupon-new-edit-form";
import { ConfirmDialog } from "src/components/custom-dialog";
import { fDate } from "src/utils/format-time";

const COUPON_TYPE_LABELS = {
  // 소문자 (폼용)
  all: "전체",
  user: "마켓 찜 유도",
  seller_first: "첫구매",
  seller_repeat: "재구매",
  seller_message: "메시지 전용",
  // 대문자 (API용)
  ALL: "전체",
  USER: "마켓 찜 유도",
  SELLER_FIRST: "첫구매",
  SELLER_REPEAT: "재구매",
  SELLER_MESSAGE: "메시지 전용",
};

const DISCOUNT_MODE_LABELS = {
  // 소문자
  amount: "원",
  percent: "%",
  // 대문자
  AMOUNT: "원",
  PERCENT: "%",
};

// 발급 상태 계산 함수
function getIssueStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > now) {
    return {
      label: "발급 예정",
      color: "default",
    };
  } else if (start <= now && end >= now) {
    return {
      label: "발급 중",
      color: "success",
    };
  } else if (end < now) {
    return {
      label: "발급 종료",
      color: "error",
    };
  }
  return {
    label: "알 수 없음",
    color: "default",
  };
}

export function CouponTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
  showSeller, // 판매자 정보 표시 여부
}) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();

  // 발급 상태 계산
  const issueStatus = getIssueStatus(row.start_date, row.end_date);

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

        {/* 판매자 정보 (판매자발급쿠폰 페이지에만 표시) */}
        {showSeller && (
          <TableCell sx={{ whiteSpace: "nowrap" }}>
            <Box>
              <Box sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {row.seller_name ||
                  row.seller?.name ||
                  row.seller?.shop_name ||
                  row.partner?.name ||
                  row.partner?.shop_name ||
                  row.issued_partner_name ||
                  (row.issued_partner_id
                    ? `판매자 ID: ${row.issued_partner_id}`
                    : "-")}
              </Box>
              <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {row.seller_email ||
                  row.seller?.email ||
                  row.partner?.email ||
                  ""}
              </Box>
            </Box>
          </TableCell>
        )}

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {COUPON_TYPE_LABELS[row.coupon_type] || row.coupon_type || "-"}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.total_count}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {row.discount_amount || 0}
          {DISCOUNT_MODE_LABELS[row.discount_mode] || row.discount_mode || ""}
        </TableCell>

        <TableCell>
          <Chip
            label={issueStatus.label}
            color={issueStatus.color}
            size="small"
            variant="soft"
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {fDate(row.start_date)} ~ {fDate(row.end_date)}
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {row.validity_type === "FIXED_DATE" ||
          row.validity_type === "fixed" ? (
            <>
              {row.valid_from && row.valid_to
                ? `${fDate(row.valid_from)} ~ ${fDate(row.valid_to)}`
                : "미설정"}
            </>
          ) : row.validity_type === "FROM_ISSUE" ||
            row.validity_type === "from_issue" ? (
            `발급일로부터 ${row.validity_days}일`
          ) : (
            "미설정"
          )}
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
