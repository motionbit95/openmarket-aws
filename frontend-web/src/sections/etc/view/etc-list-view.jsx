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

import { EtcTableRow } from "../etc-table-row";
import { EtcTableToolbar } from "../etc-table-toolbar";
import { EtcTableFiltersResult } from "../etc-table-filters-result";
import { deleteErrorReport, getAllErrorReports } from "src/actions/etc";

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: "reporter_type", label: "구분", width: 100 }, // seller → "판매자"
  { id: "reporterName", label: "작성자", width: 180 }, // senderInfo.name
  { id: "title", label: "제목", width: 220 },
  { id: "category", label: "유형", width: 180 },
  { id: "created_at", label: "작성일자", width: 180 }, // 포맷 필요시 dayjs
  { id: "", width: 88 }, // 액션 버튼용
];
// ----------------------------------------------------------------------

export function EtcListView({ type }) {
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatEtcData = (inquiries) => {
    return inquiries.map((item) => {
      // 디버깅: seller 데이터 확인
      if (item.reporter_type === "seller") {
        console.log("Seller 데이터 상세:", {
          id: item.id,
          email: item.email,
          name: item.name,
          shop_name: item.shop_name,
          owner_name: item.owner_name,
          reporter_name: item.reporter_name,
          seller_name: item.seller_name,
          reporterInfo: item.reporterInfo,
          "모든 키": Object.keys(item),
          전체_item: item,
        });
      }

      // Seller 이름 찾기 (상세 로그)
      let reporterName = "이름 없음";

      if (item.reporter_type === "seller") {
        reporterName =
          item.owner_name ||
          item.reporterInfo?.owner_name ||
          item.reporterInfo?.name ||
          item.reporter_name ||
          item.name ||
          item.shop_name ||
          item.seller_name ||
          item.reporterInfo?.shop_name ||
          "이름 없음";

        console.log(`📌 Seller ID ${item.id} 이름 결정:`, {
          "✅ 최종_선택": reporterName,
          "1. owner_name": item.owner_name,
          "2. reporterInfo?.owner_name": item.reporterInfo?.owner_name,
          "3. reporterInfo?.name": item.reporterInfo?.name,
          "4. reporter_name": item.reporter_name,
          "5. name": item.name,
          "6. shop_name": item.shop_name,
        });
      } else {
        reporterName =
          item.name ||
          item.reporterInfo?.user_name ||
          item.reporterInfo?.name ||
          item.reporter_name ||
          item.user_name ||
          "이름 없음";
      }

      return {
        ...item,
        reporterName,
        reporterEmail:
          item.reporterInfo?.email || item.reporter_email || item.email || "",
      };
    });
  };

  // 컴포넌트가 마운트될 때 한번 실행
  const fetchEtc = async () => {
    try {
      setLoading(true);
      const search = currentFilters.name || "";

      // type에 따라 카테고리 필터링
      let category;
      if (type === "error") {
        // 오류제보: 버그신고, 로그인문제, 결제오류, 서비스장애, 기타
        category = "버그신고,로그인문제,결제오류,서비스장애,기타";
      } else if (type === "dev") {
        // 기능제안: 기능개선
        category = "기능개선";
      }

      const res = await getAllErrorReports({ search, category });

      console.log("오류/기능제보 응답 데이터:", res);

      // API 응답 구조에 따라 데이터 추출
      const rawData = Array.isArray(res)
        ? res
        : res?.data || res?.reports || [];

      console.log("처리 전 데이터:", rawData);

      const formatted = formatEtcData(rawData);

      console.log("포맷된 데이터:", formatted);

      setTableData(formatted);
    } catch (err) {
      console.error("오류/기능제보 불러오기 실패", err);
      toast.error("목록을 불러오는데 실패했습니다.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtc();
  }, [type]); // type이 변경될 때 (error/dev)

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteErrorReport(id); // ✅ 서버에 먼저 삭제 요청
        toast.success("문의가 삭제되었습니다.");

        const deleteRow = tableData.filter((row) => row.id !== id);
        setTableData(deleteRow);

        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error("삭제 중 오류 발생:", error);
        toast.error("문의 삭제에 실패했습니다.");
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // 선택된 ID 배열
      const selectedIds = table.selected;

      // ✅ API 호출 (병렬 처리)
      await Promise.all(selectedIds.map((id) => deleteErrorReport(id)));

      toast.success("선택한 문의가 삭제되었습니다.");

      // 클라이언트 데이터 필터링
      const deleteRows = tableData.filter(
        (row) => !selectedIds.includes(row.id)
      );
      setTableData(deleteRows);

      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (error) {
      console.error("다중 삭제 오류:", error);
      toast.error("일부 문의 삭제에 실패했습니다.");
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
      title="문의 삭제"
      content={
        <>
          선택한 <strong>{table.selected.length}</strong>개의 문의를
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
    fetchEtc();
    table.onResetPage(); // 페이지도 0으로
  };

  return (
    <>
      <DashboardContent>
        <Card>
          <EtcTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
            type={type}
          />
          {canReset && (
            <EtcTableFiltersResult
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan={TABLE_HEAD.length + 1}
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          로딩 중...
                        </Box>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {dataFiltered
                        ?.slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <EtcTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onSubmitted={handleRefresh}
                            type={type}
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
                    </>
                  )}
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
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (inquiry) =>
        inquiry.reporterName?.toLowerCase().includes(name.toLowerCase()) ||
        inquiry.reporterEmail?.toLowerCase().includes(name.toLowerCase()) ||
        inquiry.title?.toLowerCase().includes(name.toLowerCase())
    );
  }

  return inputData;
}
