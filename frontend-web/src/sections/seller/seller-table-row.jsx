import { useBoolean, usePopover } from "minimal-shared/hooks";
import { useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";

import { Iconify } from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";
import { CustomPopover } from "src/components/custom-popover";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { SellerNewEditForm } from "./seller-new-edit-form";
import { Upload } from "src/components/upload";
import { toast } from "sonner";

// ----------------------------------------------------------------------

// 사업자등록번호 포맷팅 함수 (000-00-00000)
function formatBusinessNumber(number) {
  if (!number) return "";
  const cleaned = number.replace(/\D/g, ""); // 숫자만 추출
  if (cleaned.length !== 10) return number; // 10자리가 아니면 그대로 반환
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

export function SellerTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onSubmitted,
}) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();
  const certificateDialog = useBoolean();
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const renderQuickEditForm = () => (
    <Dialog
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
      maxWidth="md"
    >
      <DialogTitle>판매자 수정</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <SellerNewEditForm
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

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingFile(file);
    setUploading(true);

    try {
      // TODO: 실제 파일 업로드 API 호출
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "business_registration");
      formData.append("sellerId", row.id);

      // 임시: 파일 URL 미리보기
      const previewUrl = URL.createObjectURL(file);

      // 실제 API 호출 시:
      // const response = await uploadBusinessCertificate(row.id, formData);
      // await onSubmitted(); // 목록 새로고침

      toast.success("사업자 등록증이 업로드되었습니다.");

      // 임시로 UI 업데이트
      row.business_registration_document = previewUrl;
      setUploadingFile(null);
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      toast.error("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const renderCertificateDialog = () => (
    <Dialog
      open={certificateDialog.value}
      onClose={certificateDialog.onFalse}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>사업자 등록증</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: "center", py: 2 }}>
          {row.business_registration_document ? (
            <Box>
              <img
                src={row.business_registration_document}
                alt="사업자 등록증"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="solar:upload-bold" />}
                component="label"
                disabled={uploading}
              >
                {uploading ? "업로드 중..." : "새 파일 업로드"}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </Button>
            </Box>
          ) : (
            <Box sx={{ py: 4 }}>
              <Iconify
                icon="solar:document-bold"
                width={64}
                sx={{ mb: 2, opacity: 0.3, color: "text.secondary" }}
              />
              <Box sx={{ mb: 3, color: "text.secondary" }}>
                등록된 사업자 등록증이 없습니다.
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="solar:upload-bold" />}
                component="label"
                disabled={uploading}
              >
                {uploading ? "업로드 중..." : "파일 업로드"}
                <input
                  type="file"
                  hidden
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
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

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.name}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.email}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.phone}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.shop_name}</TableCell>

        <TableCell sx={{ whiteSpace: "nowrap" }}>
          {formatBusinessNumber(row.business_number)}
        </TableCell>

        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title="사업자 등록증 보기" placement="top" arrow>
              <IconButton onClick={certificateDialog.onTrue}>
                <Iconify icon="solar:document-text-bold" />
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
      {renderCertificateDialog()}
    </>
  );
}
