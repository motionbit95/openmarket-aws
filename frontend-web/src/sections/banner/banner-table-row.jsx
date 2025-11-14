import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Portal,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useBoolean } from "minimal-shared/hooks";
import { Iconify } from "src/components/iconify";
import { BannerNewEditForm } from "./banner-new-edit-form";
import { ConfirmDialog } from "src/components/custom-dialog";
import { Image } from "src/components/image";

export function BannerTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
}) {
  // 수정/삭제 다이얼로그 상태 관리
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();

  // 이미지 확대 다이얼로그 상태 관리
  const [openImageDialog, setOpenImageDialog] = useState(false);

  // 이미지 클릭 이벤트 - 확대 다이얼로그 오픈
  const handleImageClick = () => {
    if (row.attachmentUrl) {
      setOpenImageDialog(true);
    }
  };

  // 수정 폼 다이얼로그 렌더링
  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>배너 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <BannerNewEditForm
            currentBanner={row}
            onClose={quickEditForm.onFalse}
            onSubmitted={onSubmitted}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  // 삭제 확인 다이얼로그 렌더링
  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="삭제 확인"
      content="이 배너를 삭제하시겠습니까?"
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            confirmDialog.onFalse();
            onDeleteRow();
          }}
        >
          예
        </Button>
      }
    />
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {/* 선택 체크박스 */}
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            inputProps={{
              id: `${row.id}-checkbox`,
              "aria-label": `선택 배너 ${row.id}`,
            }}
          />
        </TableCell>

        {/* 배너 ID */}
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.id}</TableCell>

        {/* 배너 이미지 썸네일 */}
        <TableCell
          sx={{
            whiteSpace: "nowrap",
            cursor: row.attachmentUrl ? "pointer" : "default",
          }}
          onClick={handleImageClick}
        >
          {row.attachmentUrl ? (
            <Image
              src={row.attachmentUrl}
              alt={`배너 이미지 ${row.id}`}
              style={{
                width: 80,
                height: "auto",
                objectFit: "cover",
                borderRadius: 4,
              }}
              loading="lazy"
              decoding="async"
              onClick={() => setOpenImageDialog(true)}
            />
          ) : (
            "-"
          )}
        </TableCell>

        {/* 배너 링크 */}
        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.url}</TableCell>

        {/* 작업 버튼: 수정, 삭제 */}
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="수정" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? "primary" : "default"}
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

      {/* 이미지 확대 다이얼로그 */}
      {openImageDialog && (
        <ImageViewer
          src={row.attachmentUrl}
          alt="배너 이미지 확대"
          onClose={() => setOpenImageDialog(false)}
        />
      )}

      {/* 수정 폼 다이얼로그 */}
      {renderQuickEditForm()}

      {/* 삭제 확인 다이얼로그 */}
      {renderConfirmDialog()}
    </>
  );
}

export function ImageViewer({ src, alt, onClose }) {
  return (
    <Portal>
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999, // 충분히 큰 값
          cursor: "zoom-out",
        }}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            maxWidth: "90%",
            maxHeight: "90%",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          }}
        />
      </Box>
    </Portal>
  );
}
