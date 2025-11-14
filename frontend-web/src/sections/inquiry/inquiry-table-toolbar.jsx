import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { Iconify } from "src/components/iconify";
import { InquiryNewEditForm } from "./inquiry-new-edit-form";

export function InquiryTableToolbar({
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

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onResetPage();
      updateFilters({ startDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onResetPage();
      updateFilters({ endDate: newValue });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterSort = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ sortBy: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterSenderType = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ senderType: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const renderNewUserForm = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>문의 생성</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <InquiryNewEditForm
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
            flexWrap: "wrap",
          }}
        >
          <TextField
            sx={{ minWidth: 280, flexGrow: 1 }}
            value={currentFilters.name}
            onChange={handleFilterName}
            placeholder="작성자 이름 또는 문의 제목으로 검색"
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

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>구분</InputLabel>
            <Select
              value={currentFilters.senderType || "all"}
              onChange={handleFilterSenderType}
              label="구분"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="seller">판매자</MenuItem>
              <MenuItem value="user">사용자</MenuItem>
            </Select>
          </FormControl>

          <DatePicker
            label="시작일"
            value={currentFilters.startDate}
            onChange={handleFilterStartDate}
            slotProps={{
              textField: {
                sx: { minWidth: 160 },
              },
            }}
          />

          <DatePicker
            label="종료일"
            value={currentFilters.endDate}
            onChange={handleFilterEndDate}
            slotProps={{
              textField: {
                sx: { minWidth: 160 },
              },
            }}
          />

          <FormControl sx={{ minWidth: 130 }}>
            <InputLabel>정렬</InputLabel>
            <Select
              value={currentFilters.sortBy || "latest"}
              onChange={handleFilterSort}
              label="정렬"
            >
              <MenuItem value="latest">최신순</MenuItem>
              <MenuItem value="oldest">오래된순</MenuItem>
            </Select>
          </FormControl>

          {/* <Button
            variant="outlined"
            size="large"
            sx={{ width: 120, fontWeight: "bold" }}
            onClick={handleOpenDialog}
          >
            등록하기
          </Button> */}
        </Box>
      </Box>

      {renderNewUserForm()}
    </>
  );
}
