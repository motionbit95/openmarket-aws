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
import { exportToExcel, formatCouponsForExcel } from "src/utils/excel-export";
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

import { CouponTableRow } from "../coupon-table-row";
import { CouponTableToolbar } from "../coupon-table-toolbar";
import { CouponTableFiltersResult } from "../coupon-table-filters-result";
import { deleteUser, getUsers } from "src/actions/user";
import {
  deleteCoupon,
  getAllCoupons,
  getCouponsBySeller,
} from "src/actions/coupon";
import { getSellerSession } from "src/actions/seller";

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: "title", label: "제목", width: 200 },
  { id: "coupon_type", label: "쿠폰타입", width: 120 },
  { id: "total_count", label: "총 발급수량", width: 120 },
  { id: "discount_amount", label: "할인금액/비율", width: 120 },
  { id: "start_date", label: "시작일", width: 120 },
  { id: "end_date", label: "종료일", width: 120 },
  { id: "", width: 88 },
];

// ----------------------------------------------------------------------

export function CouponListView({ type }) {
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({ name: "", role: [], status: "all" });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    currentFilters.role.length > 0 ||
    currentFilters.status !== "all";

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  useEffect(() => {
    fetchCoupons();
  }, [table.rowsPerPage, table.page, filters.title, type]);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteCoupon(id); // ✅ 서버에 먼저 삭제 요청
        toast.success("쿠폰이 삭제되었습니다.");

        const deleteRow = tableData.filter((row) => row.id !== id);
        setTableData(deleteRow);

        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error("삭제 중 오류 발생:", error);
        toast.error("쿠폰 삭제에 실패했습니다.");
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // 선택된 ID 배열
      const selectedIds = table.selected;

      // ✅ API 호출 (병렬 처리)
      await Promise.all(selectedIds.map((id) => deleteCoupon(id)));

      toast.success("선택한 쿠폰이 삭제되었습니다.");

      // 클라이언트 데이터 필터링
      const deleteRows = tableData.filter(
        (row) => !selectedIds.includes(row.id)
      );
      setTableData(deleteRows);

      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (error) {
      console.error("다중 삭제 오류:", error);
      toast.error("일부 쿠폰 삭제에 실패했습니다.");
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
      title="쿠폰 삭제"
      content={
        <>
          선택한 <strong>{table.selected.length}</strong>개의 쿠폰을
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

  const fetchCoupons = async () => {
    try {
      const search = filters.title || "";

      let data = await getSellerSession();

      // 판매자 세션 확인 (백엔드가 { user: ... } 형태로 반환)
      if (!data || !data.user || !data.user.id) {
        console.error("판매자 세션 정보가 없습니다.", data);
        toast.error("판매자 정보를 불러올 수 없습니다.");
        setTableData([]);
        return;
      }

      const res = await getCouponsBySeller(data.user.id);

      setTableData(res);
    } catch (err) {
      console.error("쿠폰 불러오기 실패", err);
      toast.error("쿠폰 목록을 불러오는데 실패했습니다.");
      setTableData([]);
    }
  };

  const handleRefresh = () => {
    fetchCoupons();
    table.onResetPage(); // 페이지도 0으로
  };

  const handleExcelDownload = () => {
    try {
      const excelData = formatCouponsForExcel(tableData);
      const success = exportToExcel(excelData, "쿠폰관리", "쿠폰");
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
          <CouponTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
            onExcelDownload={handleExcelDownload}
            dataLength={tableData.length}
          />
          {canReset && (
            <CouponTableFiltersResult
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
                  {dataFiltered
                    ?.slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <CouponTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onSubmitted={handleRefresh}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
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

function applyFilter({ inputData, comparator, filters }) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((coupon) =>
      coupon.title.toLowerCase().includes(name.toLowerCase())
    );
  }

  return inputData;
}
