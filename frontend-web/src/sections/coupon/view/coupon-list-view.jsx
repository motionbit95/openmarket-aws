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
import { deleteCoupon, getAllCoupons } from "src/actions/coupon";
import { getSellerById } from "src/actions/seller";

// ----------------------------------------------------------------------

// 관리자 쿠폰 테이블 헤더
const TABLE_HEAD_ADMIN = [
  { id: "title", label: "제목", minWidth: 200 },
  { id: "coupon_type", label: "쿠폰타입", width: 120 },
  { id: "total_count", label: "총 발급수량", width: 100 },
  { id: "discount_amount", label: "할인금액/비율", width: 120 },
  { id: "issue_status", label: "발급상태", width: 100 },
  { id: "start_date", label: "발급기간", width: 200 },
  { id: "validity_period", label: "유효기간", width: 200 },
  { id: "", width: 88 },
];

// 판매자 쿠폰 테이블 헤더 (판매자명 추가)
const TABLE_HEAD_PARTNER = [
  { id: "title", label: "제목", minWidth: 150 },
  { id: "seller_name", label: "판매자", width: 120 },
  { id: "coupon_type", label: "쿠폰타입", width: 110 },
  { id: "total_count", label: "발급수량", width: 85 },
  { id: "discount_amount", label: "할인", width: 100 },
  { id: "issue_status", label: "상태", width: 90 },
  { id: "start_date", label: "발급기간", width: 190 },
  { id: "validity_period", label: "유효기간", width: 190 },
  { id: "", width: 88 },
];

// ----------------------------------------------------------------------

export function CouponListView({ type }) {
  const table = useTable();

  // 타입에 따라 테이블 헤더 선택
  const TABLE_HEAD = type === "partner" ? TABLE_HEAD_PARTNER : TABLE_HEAD_ADMIN;

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({
    name: "",
    couponType: "all",
    status: "all",
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    currentFilters.couponType !== "all" ||
    currentFilters.status !== "all";

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

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
      const res = await getAllCoupons({
        search,
        issued_by: type,
      });

      console.log("쿠폰 응답 데이터:", res);

      // API 응답 구조에 따라 데이터 추출
      let couponData = Array.isArray(res)
        ? res
        : res?.data || res?.coupons || [];

      console.log("처리된 쿠폰 데이터:", couponData);

      // 판매자발급쿠폰인 경우, 판매자 정보를 추가로 가져오기
      if (type === "partner" && couponData.length > 0) {
        console.log("판매자 정보 조회 시작...");

        // 판매자 ID 추출 및 중복 제거
        const sellerIds = [
          ...new Set(
            couponData
              .map((coupon) => coupon.issued_partner_id)
              .filter((id) => id != null)
          ),
        ];

        console.log("판매자 IDs:", sellerIds);

        // 판매자 정보 조회
        const sellerPromises = sellerIds.map((id) =>
          getSellerById(id).catch((err) => {
            console.error(`판매자 ${id} 조회 실패:`, err);
            return null;
          })
        );

        const sellers = await Promise.all(sellerPromises);

        // 판매자 정보를 ID로 매핑
        const sellerMap = {};
        sellers.forEach((seller, index) => {
          if (seller) {
            sellerMap[sellerIds[index]] = seller;
          }
        });

        console.log("조회된 판매자 정보:", sellerMap);

        // 쿠폰 데이터에 판매자 정보 추가
        couponData = couponData.map((coupon) => ({
          ...coupon,
          seller: coupon.issued_partner_id
            ? sellerMap[coupon.issued_partner_id]
            : null,
        }));
      }

      setTableData(couponData);
    } catch (err) {
      console.error("쿠폰 불러오기 실패", err);
      toast.error("쿠폰 목록을 불러오는데 실패했습니다.");
      setTableData([]);
    }
  };

  const handleRefresh = () => {
    console.log("쿠폰 목록 새로고침 중...");
    fetchCoupons();
    // 페이지 리셋은 하지 않음 - 현재 페이지 유지
  };

  return (
    <>
      <DashboardContent maxWidth="xxl">
        <Card>
          <CouponTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
            type={type}
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
                        showSeller={type === "partner"}
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
  const { name, couponType, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  // 이름 검색
  if (name) {
    inputData = inputData.filter((coupon) =>
      coupon.title.toLowerCase().includes(name.toLowerCase())
    );
  }

  // 쿠폰 타입 필터
  if (couponType && couponType !== "all") {
    inputData = inputData.filter((coupon) => coupon.coupon_type === couponType);
  }

  // 발급 상태 필터
  if (status && status !== "all") {
    const now = new Date();
    inputData = inputData.filter((coupon) => {
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);

      if (status === "upcoming") {
        // 발급 예정: 시작일이 아직 오지 않음
        return startDate > now;
      } else if (status === "active") {
        // 발급 중: 시작일과 종료일 사이
        return startDate <= now && endDate >= now;
      } else if (status === "expired") {
        // 발급 종료: 종료일이 지남
        return endDate < now;
      }
      return true;
    });
  }

  return inputData;
}
