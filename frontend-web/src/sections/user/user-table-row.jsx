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
import { UserNewEditForm } from "./user-new-edit-form";
import { ConfirmDialog } from "src/components/custom-dialog";

export function UserTableRow({
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
      <DialogTitle>회원 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <UserNewEditForm
            currentUser={row}
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
      content="이 회원을 탈퇴 시키겠습니까?"
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

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.user_name}</TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.email}</TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.phone}</TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {row.review_cnt || 0}
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.mileage || 0}</TableCell>

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
