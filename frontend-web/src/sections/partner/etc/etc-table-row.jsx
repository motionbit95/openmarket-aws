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
import { EtcNewEditForm } from "./etc-new-edit-form";
import { fDate, fTime } from "src/utils/format-time";
import { EtcDetailView } from "./etc-detail-view";

export function EtcTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
  type,
}) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const detailDialog = useBoolean();

  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>제보 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <EtcNewEditForm
            initialData={row}
            onClose={quickEditForm.onFalse}
            onSubmitted={onSubmitted}
            isEdit
            type={type}
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
      <DialogTitle>제보 답변</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <EtcDetailView
            currentEtc={row}
            onClose={detailDialog.onFalse}
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
      content="이 제보를 삭제 시키겠습니까?"
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
            label={row.reporter_type}
            color={row.reporter_type === "seller" ? "success" : "error"}
            variant="outlined"
            size="small"
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <ListItemText
            primary={row.reporterName}
            secondary={row.reporterEmail}
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
            color={row.status === "완료" ? "success" : "default"}
            variant="outlined"
            size="small"
          />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <ListItemText
            primary={fDate(row.created_at)}
            secondary={fTime(row.created_at)}
            slotProps={{
              secondary: {
                sx: { typography: "caption", color: "text.disabled" },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {process.env.NEXT_PUBLIC_BUILD_MODE === "admin" && (
              <Tooltip title="답변" placement="top" arrow>
                <IconButton
                  color={detailDialog.value ? "inherit" : "default"}
                  onClick={detailDialog.onTrue}
                >
                  <Iconify icon="solar:chat-round-dots-bold" />
                </IconButton>
              </Tooltip>
            )}

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
