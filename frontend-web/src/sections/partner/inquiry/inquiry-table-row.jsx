import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { useBoolean } from "minimal-shared/hooks";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  ListItemText,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";
import { InquiryNewEditForm } from "./inquiry-new-edit-form";
import { fDate, fTime } from "src/utils/format-time";
import { InquiryDetailView } from "./inquiry-detail-view";
import { RenderCellProduct } from "../product/product-table-row";

export function InquiryTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
  showProduct = true, // product 컬럼 표시 여부
}) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const detailDialog = useBoolean();

  const handleAnswerSubmitted = () => {
    detailDialog.onFalse();
    // 리스트 업데이트
    onSubmitted?.();
  };

  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>문의 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <InquiryNewEditForm
            initialData={row}
            onClose={quickEditForm.onFalse}
            onSubmitted={onSubmitted}
            isEdit
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderDetailView = () => (
    <Dialog
      open={detailDialog.value}
      onClose={detailDialog.onFalse}
      maxWidth="md"
    >
      <DialogTitle>문의 답변</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <InquiryDetailView
            currentInquiry={row}
            onClose={detailDialog.onFalse}
            onSubmitted={onSubmitted}
            onAnswerSubmitted={handleAnswerSubmitted}
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
      content="이 문의를 삭제 시키겠습니까?"
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

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip
            label={row.senderType === "seller" ? "판매자" : "유저"}
            color={row.senderType === "seller" ? "success" : "primary"}
            variant="outlined"
            size="small"
          />
        </TableCell>

        {showProduct && (
          <TableCell sx={{ whiteSpace: "nowrap" }}>
            {row.product ? (
              <RenderCellProduct
                params={{ row: row.product }}
                // href={paths.dashboard.partner.product.details(params.row.id)}
              />
            ) : (
              <span style={{ color: "#999" }}>-</span>
            )}
          </TableCell>
        )}

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <ListItemText
            primary={row.senderName}
            secondary={row.senderEmail}
            slotProps={{
              secondary: {
                sx: { typography: "caption", color: "text.disabled" },
              },
            }}
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.title}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip
            label={row.status}
            color={
              row.status === "완료" || row.status === "답변완료"
                ? "success"
                : row.status === "처리중"
                  ? "warning"
                  : "default"
            }
            variant="outlined"
            size="small"
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <ListItemText
            primary={fDate(row.createdAt)}
            secondary={fTime(row.createdAt)}
            slotProps={{
              secondary: {
                sx: { typography: "caption", color: "text.disabled" },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="답변" placement="top" arrow>
              <IconButton
                color={detailDialog.value ? "inherit" : "default"}
                onClick={detailDialog.onTrue}
              >
                <Iconify icon="solar:chat-line-bold" />
              </IconButton>
            </Tooltip>

            {/* 수정 버튼 */}
            {/* <Tooltip title="수정" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? "inherit" : "default"}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip> */}

            {/* 탈퇴 버튼 */}
            <Tooltip title="삭제" placement="top" arrow>
              <IconButton color="error" onClick={confirmDialog.onTrue}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {renderQuickEditForm()}
      {renderConfirmDialog()}
      {renderDetailView()}
    </>
  );
}
