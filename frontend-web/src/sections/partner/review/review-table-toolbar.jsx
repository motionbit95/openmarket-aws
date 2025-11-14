import { useCallback, useState } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { Iconify } from "src/components/iconify";
import { ReviewNewEditForm } from "./review-new-edit-form";

export function ReviewTableToolbar({
  filters,
  options,
  onResetPage,
  onSubmitted,
  onExcelDownload,
  dataLength,
  sortBy,
  onSortChange,
}) {
  const { state: currentFilters, setState: updateFilters } = filters;

  const [openDialog, setOpenDialog] = useState(false);

  const handleFilterKeyword = useCallback(
    (event) => {
      onResetPage();
      updateFilters({ keyword: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  const renderNewReviewForm = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>리뷰 등록</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <ReviewNewEditForm
            productId={"7"}
            initialData={null}
            onClose={handleCloseDialog}
            onSubmitted={onSubmitted}
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
            value={currentFilters.keyword}
            onChange={handleFilterKeyword}
            placeholder="리뷰 내용 검색"
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
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>정렬</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              label="정렬"
            >
              <MenuItem value="latest">최신순</MenuItem>
              <MenuItem value="oldest">오래된순</MenuItem>
              <MenuItem value="rating_high">평점 높은순</MenuItem>
              <MenuItem value="rating_low">평점 낮은순</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:download-fill" />}
            onClick={onExcelDownload}
            disabled={dataLength === 0}
          >
            엑셀 다운로드
          </Button>
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

      {renderNewReviewForm()}
    </>
  );
}
