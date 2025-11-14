"use client";
import { useState, useCallback, useEffect } from "react";
import { useBoolean, useSetState } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import TableBody from "@mui/material/TableBody";
import IconButton from "@mui/material/IconButton";

import { DashboardContent } from "src/layouts/dashboard";
import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { ConfirmDialog } from "src/components/custom-dialog";
import { exportToExcel } from "src/utils/excel-export";
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from "src/components/table";

import { ReviewTableRow } from "../review-table-row";
import { ReviewTableToolbar } from "../review-table-toolbar";
import { ReviewTableFiltersResult } from "../review-table-filters-result";
import { deleteReview, getReviewsBySeller } from "src/actions/review";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: "productId", label: "상품", width: 200 },
  { id: "userId", label: "작성자", width: 120 },
  { id: "rating", label: "평점", width: 80 },
  { id: "content", label: "내용", width: 250 },
  { id: "images", label: "사진", width: 100 },
  { id: "created_at", label: "작성일자", width: 160 },
  { id: "", width: 88 }, // 액션 버튼
];

// ----------------------------------------------------------------------

export function ReviewListView() {
  const table = useTable();
  const confirmDialog = useBoolean();
  const [tableData, setTableData] = useState([]);
  const [sortBy, setSortBy] = useState("latest");

  const filters = useSetState({ name: "", status: "all" });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
    sortBy,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!currentFilters.name || currentFilters.status !== "all";

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const fetchReviews = async () => {
    try {
      let data = await getSellerSession();

      const sellerId = data?.user?.id || data?.seller?.id;
      if (!sellerId) {
        console.error("Seller ID를 찾을 수 없습니다.");
        return;
      }

      const res = await getReviewsBySeller(sellerId);

      setTableData(res);
    } catch (err) {
      console.error("리뷰 불러오기 실패", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [table.rowsPerPage, table.page]);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteReview(id);
        toast.success("리뷰가 삭제되었습니다.");
        const deleteRow = tableData.filter((row) => row.id !== id);
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error("리뷰 삭제 중 오류:", error);
        toast.error("리뷰 삭제에 실패했습니다.");
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const selectedIds = table.selected;
      await Promise.all(selectedIds.map((id) => deleteReview(id)));
      toast.success("선택한 리뷰가 삭제되었습니다.");
      const deleteRows = tableData.filter(
        (row) => !selectedIds.includes(row.id)
      );
      setTableData(deleteRows);
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (error) {
      console.error("다중 리뷰 삭제 실패:", error);
      toast.error("일부 리뷰 삭제에 실패했습니다.");
    }
  }, [
    table.selected,
    dataInPage.length,
    dataFiltered.length,
    table,
    tableData,
  ]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="리뷰 삭제"
      content={
        <>
          선택한 <strong>{table.selected.length}</strong>개의 리뷰를
          삭제하시겠습니까?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          삭제
        </Button>
      }
    />
  );

  const handleRefresh = () => {
    fetchReviews();
    table.onResetPage();
  };

  const handleExcelDownload = () => {
    try {
      const excelData = tableData.map(review => ({
        리뷰번호: review.id || "",
        작성일: review.created_at ? new Date(review.created_at).toLocaleDateString("ko-KR") : "",
        상품명: review.Product?.name || "",
        작성자: review.User?.user_name || "",
        평점: review.rating || 0,
        내용: review.content || "",
        답변여부: review.reply ? "답변완료" : "미답변",
      }));
      const success = exportToExcel(excelData, "리뷰관리", "리뷰");
      if (success) {
        toast.success("엑셀 파일이 다운로드되었습니다.");
      } else {
        toast.error("엑셀 다운로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("엑셀 다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <DashboardContent>
        <Card>
          <ReviewTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
            onExcelDownload={handleExcelDownload}
            dataLength={tableData.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {canReset && (
            <ReviewTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: "relative" }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table
                size={table.dense ? "small" : "medium"}
                sx={{ width: "100%" }}
              >
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataInPage.map((row) => (
                    <ReviewTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onSubmitted={handleRefresh}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(
                      table.page,
                      table.rowsPerPage,
                      dataFiltered.length
                    )}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, sortBy }) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((review) =>
      review.content.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Apply sorting
  if (sortBy === "latest") {
    inputData = inputData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else if (sortBy === "oldest") {
    inputData = inputData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortBy === "rating_high") {
    inputData = inputData.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "rating_low") {
    inputData = inputData.sort((a, b) => a.rating - b.rating);
  }

  return inputData;
}
