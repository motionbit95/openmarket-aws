import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

import { Iconify } from "src/components/iconify";
import { NoticeNewEditForm } from "./notice-new-edit-form";

export function NoticeTableToolbar({
  filters,
  options,
  onResetPage,
  onSubmitted,
}) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const [openDialog, setOpenDialog] = useState(false);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ name: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const renderNewUserForm = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>공지사항 생성</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <NoticeNewEditForm
            initialData={null} // 새 회원 생성이니 null
            onClose={handleCloseDialog} // 폼 완료 후 다이얼로그 닫기 위해 전달
            onSubmitted={onSubmitted} // 폼 제출 성공 시 페이지 리셋
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: "flex",
          pr: { xs: 2.5, md: 1 },
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-end", md: "center" },
        }}
      >
        <Box
          sx={{
            gap: 2,
            width: 1,
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            value={currentFilters.name}
            onChange={handleFilterName}
            placeholder="제목으로 검색"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify
                    icon="eva:search-fill"
                    sx={{ color: "text.disabled" }}
                  />
                </InputAdornment>
              ),
            }}
          />
          {process.env.NEXT_PUBLIC_BUILD_MODE === "admin" && (
            <Button
              variant="outlined"
              size="large"
              sx={{ width: 120, fontWeight: "bold" }}
              onClick={handleOpenDialog}
            >
              등록하기
            </Button>
          )}
        </Box>
      </Box>

      {renderNewUserForm()}
    </>
  );
}
