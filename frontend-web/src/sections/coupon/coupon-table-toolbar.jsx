import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";

import { Iconify } from "src/components/iconify";
import { CouponNewEditForm } from "./coupon-new-edit-form";

export function CouponTableToolbar({
  filters,
  options,
  onResetPage,
  onSubmitted,
  type, // 쿠폰 타입 (admin / partner)
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

  const handleFilterType = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ couponType: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterStatus = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ status: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const renderNewUserForm = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>쿠폰 생성</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <CouponNewEditForm
            currentUser={null} // 새 회원 생성이니 null
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
            placeholder="쿠폰 이름으로 검색"
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

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>쿠폰 타입</InputLabel>
            <Select
              value={currentFilters.couponType || "all"}
              onChange={handleFilterType}
              label="쿠폰 타입"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="USER">마켓 찜 유도</MenuItem>
              <MenuItem value="SELLER_FIRST">첫구매</MenuItem>
              <MenuItem value="SELLER_REPEAT">재구매</MenuItem>
              <MenuItem value="SELLER_MESSAGE">메시지 전용</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>발급 상태</InputLabel>
            <Select
              value={currentFilters.status || "all"}
              onChange={handleFilterStatus}
              label="발급 상태"
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="upcoming">발급 예정</MenuItem>
              <MenuItem value="active">발급 중</MenuItem>
              <MenuItem value="expired">발급 종료</MenuItem>
            </Select>
          </FormControl>

          {/* 판매자발급쿠폰 페이지에서는 등록하기 버튼 숨김 */}
          {type !== "partner" && (
            <Button
              variant="outlined"
              size="large"
              sx={{ minWidth: 120, fontWeight: "bold" }}
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
