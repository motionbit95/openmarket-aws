import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { useBoolean } from "minimal-shared/hooks";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  IconButton,
  Link,
  ListItemText,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Iconify } from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";
import { ReviewNewEditForm } from "./review-new-edit-form";
import { ReviewDetailView } from "./review-detail-view";
import { fDate, fTime } from "src/utils/format-time";
import { RenderCellProduct } from "../product/product-table-row";
import { paths } from "src/routes/paths";
import { getCategoryNameByCode } from "../product/component/category";
import { RouterLink } from "src/routes/components";

export function ReviewTableRow({
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
      <DialogTitle>리뷰 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <ReviewNewEditForm
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
      fullWidth
      PaperProps={{
        sx: {
          width: 600,
          minWidth: 600,
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>리뷰 상세</DialogTitle>
      <DialogContent
        dividers
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <Box sx={{ width: "100%", p: 1, flex: 1 }}>
          <ReviewDetailView
            currentReview={row}
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
      title="리뷰 삭제"
      content="이 리뷰를 삭제하시겠습니까?"
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

        <TableCell>
          {/* <Typography variant="body2" noWrap>
            {row.authorName || "-"}
          </Typography> */}
          <Box
            sx={{
              py: 2,
              gap: 2,
              width: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Avatar
              alt={row.Product?.displayName || "상품 이미지"}
              src={row.Product?.ProductImage?.[0]?.url || "/placeholder.svg"}
              variant="rounded"
              sx={{ width: 64, height: 64 }}
            />

            <ListItemText
              primary={
                <Box
                  component="span"
                  sx={{
                    cursor: "pointer",
                    maxWidth: 250,
                    display: "inline-block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    verticalAlign: "bottom",
                    color: "inherit",
                  }}
                  title={row.Product?.displayName || ""}
                  onClick={detailDialog.onTrue}
                >
                  {row.Product?.displayName || "상품명 없음"}
                </Box>
              }
              secondary={getCategoryNameByCode(row.Product?.categoryCode || "")}
              slotProps={{
                primary: { noWrap: true },
                secondary: { sx: { color: "text.disabled" } },
              }}
            />
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {row.users?.user_name || "-"}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {Number(row.rating).toFixed(1)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography
            variant="body2"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "normal",
            }}
          >
            {row.content}
          </Typography>
        </TableCell>

        <TableCell>
          {row.ReviewImage && row.ReviewImage.length > 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Iconify icon="eva:image-2-fill" color="primary" />
              <Typography variant="caption" color="primary">
                {row.ReviewImage.length}장
              </Typography>
            </Box>
          ) : (
            <Box />
          )}
        </TableCell>

        <TableCell>
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
            <Tooltip title="자세히보기" placement="top" arrow>
              <IconButton
                color={detailDialog.value ? "inherit" : "default"}
                onClick={detailDialog.onTrue}
              >
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title="수정" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? "inherit" : "default"}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

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
