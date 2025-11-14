// components/common/GenericListView.jsx
"use client";

import {
  Box,
  Button,
  Card,
  IconButton,
  Table,
  TableBody,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useBoolean } from "minimal-shared/hooks";
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
import { Scrollbar } from "src/components/scrollbar";
import { DashboardContent } from "src/layouts/dashboard";
import { Iconify } from "src/components/iconify";

export default function ListView({
  type,
  fetchData,
  renderRow,
  tableHead,
  createButtonPath,
  dummyData,
  filters = {},
}) {
  const table = useTable();
  const [tableData, setTableData] = useState([]);
  const confirmDialog = useBoolean();

  const [currentFilters, setCurrentFilters] = useState(filters);

  useEffect(() => {
    const fetchEtcs = async () => {
      console.log(type);
      // try {
      //   if (!type) {
      //     console.warn("type이 지정되지 않았습니다.");
      //     return;
      //   }

      //   const res = await getNoticesByType(type);
      //   setTableData(res);
      // } catch (err) {
      //   console.error("타입별 공지사항 불러오기 실패", err);
      // }
    };

    fetchEtcs();
  }, [type, table.page, table.rowsPerPage, dummyData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const notFound =
    (!dataFiltered.length && Object.values(currentFilters).some(Boolean)) ||
    !dataFiltered.length;

  return (
    <DashboardContent>
      <Card sx={{ marginBottom: 3 }}>
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
            <Table size={table.dense ? "small" : "medium"}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={tableHead}
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
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) =>
                    renderRow({
                      key: row.id,
                      row,
                      selected: table.selected.includes(row.id),
                      onSelectRow: () => table.onSelectRow(row.id),
                    })
                  )}

                <TableEmptyRows
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

      {createButtonPath && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" href={createButtonPath}>
            작성
          </Button>
        </Box>
      )}
    </DashboardContent>
  );
}

// 필터 적용 함수
function applyFilter({ inputData, comparator, filters }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  inputData = stabilizedThis.map((el) => el[0]);

  if (filters.name) {
    inputData = inputData.filter((item) =>
      item.title?.toLowerCase().includes(filters.name.toLowerCase())
    );
  }

  return inputData;
}
