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
  Typography,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";
import { NoticeNewEditForm } from "./notice-new-edit-form";
import { fDate, fTime } from "src/utils/format-time";
import { NoticeDetailView } from "./notice-detail-view";

export function NoticeTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
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
      <DialogTitle>공지사항 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <NoticeNewEditForm
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
      <DialogTitle>공지사항 상세</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <NoticeDetailView
            currentNotice={row}
            onClose={detailDialog.onFalse}
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
      content="이 공지사항을 삭제 시키겠습니까?"
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
            label={row.type}
            color={row.type === "seller" ? "success" : "error"}
            variant="outlined"
            size="small"
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Typography
            variant="body2"
            sx={{
              cursor: "pointer",
              "&:hover": {
                color: "primary.main",
                textDecoration: "underline",
              },
            }}
            onClick={detailDialog.onTrue}
          >
            {row.title}
          </Typography>
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
            <Tooltip title="자세히보기" placement="top" arrow>
              <IconButton
                color={detailDialog.value ? "inherit" : "default"}
                onClick={detailDialog.onTrue}
              >
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>

            {/* 수정 버튼 */}

            {process.env.NEXT_PUBLIC_BUILD_MODE === "admin" && (
              <Tooltip title="수정" placement="top" arrow>
                <IconButton
                  color={quickEditForm.value ? "inherit" : "default"}
                  onClick={quickEditForm.onTrue}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
            )}

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
