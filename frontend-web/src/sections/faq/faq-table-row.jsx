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
import { FAQNewEditForm } from "./faq-new-edit-form";
import { fDate, fTime } from "src/utils/format-time";
import { FAQDetailView } from "./faq-detail-view";

export function FAQTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
}) {
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const detailDialog = useBoolean();

  // 대상(type) 라벨 및 색상 매핑
  const getTargetInfo = (type) => {
    const typeLower = String(type || "")
      .toLowerCase()
      .trim();

    if (typeLower === "seller" || typeLower === "판매자") {
      return { label: "판매자", color: "success" };
    } else if (
      typeLower === "user" ||
      typeLower === "사용자" ||
      typeLower === "buyer"
    ) {
      return { label: "사용자", color: "info" };
    } else if (
      typeLower === "all" ||
      typeLower === "전체" ||
      typeLower === "both"
    ) {
      return { label: "전체", color: "default" };
    }

    return { label: type || "-", color: "default" };
  };

  const targetInfo = getTargetInfo(row.type);

  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>FAQ 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <FAQNewEditForm
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
      <DialogTitle>FAQ 상세</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <FAQDetailView currentFAQ={row} onClose={detailDialog.onFalse} />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="삭제"
      content="이 FAQ를 삭제 시키겠습니까?"
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
            label={targetInfo.label}
            color={targetInfo.color}
            variant="soft"
            size="small"
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.title}</TableCell>

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
