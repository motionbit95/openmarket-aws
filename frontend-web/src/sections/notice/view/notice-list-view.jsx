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

import { NoticeTableRow } from "../notice-table-row";
import { NoticeTableToolbar } from "../notice-table-toolbar";
import { NoticeTableFiltersResult } from "../notice-table-filters-result";
import { deleteNotice, getAllNotices } from "src/actions/notices";

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: "type", label: "구분", width: 100 }, // seller → "판매자"
  { id: "title", label: "제목", width: 220 },
  { id: "created_at", label: "작성일자", width: 180 }, // 포맷 필요시 dayjs
  { id: "", width: 88 }, // 액션 버튼용
];
// ----------------------------------------------------------------------

export function NoticeListView({ type }) {
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

  // 컴포넌트가 마운트될 때 한번 실행
  const fetchNotice = async () => {
    try {
      const search = filters.name || "";
      const res = await getAllNotices({ search, type });

      setTableData(res);
    } catch (err) {
      console.error("문의 불러오기 실패", err);
    }
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 한번 실행
    fetchNotice();
  }, [table.rowsPerPage, table.page]); // 빈 배열: 처음 마운트될 때만 실행

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteNotice(id); // ✅ 서버에 먼저 삭제 요청
        toast.success("공지사항이 삭제되었습니다.");

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
      await Promise.all(selectedIds.map((id) => deleteNotice(id)));

      toast.success("선택한 공지사항이 삭제되었습니다.");

      // 클라이언트 데이터 필터링
      const deleteRows = tableData.filter(
        (row) => !selectedIds.includes(row.id)
      );
      setTableData(deleteRows);

      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (error) {
      console.error("다중 삭제 오류:", error);
      toast.error("일부 공지사항 삭제에 실패했습니다.");
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
      title="공지사항 삭제"
      content={
        <>
          선택한 <strong>{table.selected.length}</strong>개의 공지사항을
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
    fetchNotice();
    table.onResetPage(); // 페이지도 0으로
  };

  return (
    <>
      <DashboardContent>
        <Card>
          <NoticeTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
          />
          {canReset && (
            <NoticeTableFiltersResult
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
                      <NoticeTableRow
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
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((notice) =>
      notice.title.toLowerCase().includes(name.toLowerCase())
    );
  }

  return inputData;
}
