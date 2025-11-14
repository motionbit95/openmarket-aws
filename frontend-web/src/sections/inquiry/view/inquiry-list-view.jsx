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
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Chip from "@mui/material/Chip";

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

import { InquiryTableRow } from "../inquiry-table-row";
import { InquiryTableToolbar } from "../inquiry-table-toolbar";
import { InquiryTableFiltersResult } from "../inquiry-table-filters-result";
import { deleteInquiry, getAllInquiries } from "src/actions/inquiry";

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: "senderType", label: "구분", width: 100 }, // seller → "판매자"
  { id: "senderName", label: "작성자", width: 180 }, // senderInfo.name
  { id: "title", label: "제목", width: 220 },
  { id: "status", label: "상태", width: 180 },
  { id: "createdAt", label: "작성일자", width: 180 }, // 포맷 필요시 dayjs
  { id: "", width: 88 }, // 액션 버튼용
];
// ----------------------------------------------------------------------

export function InquiryListView() {
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState([]);
  const [currentTab, setCurrentTab] = useState("all");

  const filters = useSetState({
    name: "",
    startDate: null,
    endDate: null,
    sortBy: "latest",
    senderType: "all", // seller, user, all
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
    currentTab,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    !!currentFilters.startDate ||
    !!currentFilters.endDate ||
    currentFilters.senderType !== "all";

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // 탭별 카운트 계산
  const getTabCounts = () => {
    const counts = {
      all: tableData.length,
      pending: 0,
      answered: 0,
    };

    tableData.forEach((inquiry) => {
      const statusLower = String(inquiry.status || "").toLowerCase();
      const isAnswered =
        statusLower.includes("완료") ||
        statusLower.includes("answered") ||
        statusLower.includes("completed") ||
        statusLower.includes("done") ||
        statusLower.includes("처리") ||
        statusLower.includes("processing");

      if (isAnswered) {
        counts.answered++;
      } else {
        counts.pending++;
      }
    });

    return counts;
  };

  const tabCounts = getTabCounts();

  // 상태를 한글로 변환하는 함수
  const getStatusInKorean = (status) => {
    const statusLower = String(status).toLowerCase();
    const statusMap = {
      pending: "대기중",
      answered: "답변완료",
      접수: "접수",
      처리중: "처리중",
      답변완료: "답변완료",
      완료: "완료",
    };
    return statusMap[statusLower] || status;
  };

  const formatInquiryData = (inquiries) => {
    console.log("📌 원본 inquiries:", inquiries);

    return inquiries.map((item) => {
      console.log("📌 item.senderInfo:", item.senderInfo);
      console.log("📌 item.senderType:", item.senderType);

      const senderTypeLower = String(item.senderType).toLowerCase();

      return {
        ...item,
        senderName:
          senderTypeLower === "seller"
            ? item.senderInfo?.name || item.senderInfo?.shop_name || "알 수 없음"
            : item.senderInfo?.user_name || "알 수 없음",
        senderEmail: item.senderInfo?.email || "",
        // 상태를 한글로 변환
        status: getStatusInKorean(item.status),
        // senderType을 소문자로 정규화
        senderType: senderTypeLower,
      };
    });
  };

  // 컴포넌트가 마운트될 때 한번 실행
  const fetchInquiry = async () => {
    try {
      const search = filters.name || "";
      const res = await getAllInquiries({ search });

      const formatted = formatInquiryData(res);

      setTableData(formatted);
    } catch (err) {
      console.error("문의 불러오기 실패", err);
    }
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 한번 실행
    fetchInquiry();
  }, [table.rowsPerPage, table.page]); // 빈 배열: 처음 마운트될 때만 실행

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteInquiry(id); // ✅ 서버에 먼저 삭제 요청
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
      await Promise.all(selectedIds.map((id) => deleteInquiry(id)));

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
    fetchInquiry();
    table.onResetPage(); // 페이지도 0으로
  };

  return (
    <>
      <DashboardContent>
        <Card>
          <Tabs
            value={currentTab}
            onChange={(event, newValue) => {
              setCurrentTab(newValue);
              table.onResetPage();
            }}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${theme.vars.palette.divider}`,
            }}
          >
            <Tab
              value="all"
              label="전체"
              icon={
                <Chip
                  label={tabCounts.all}
                  size="small"
                  variant="soft"
                  color="default"
                />
              }
              iconPosition="end"
            />
            <Tab
              value="pending"
              label="답변대기"
              icon={
                <Chip
                  label={tabCounts.pending}
                  size="small"
                  variant="soft"
                  color="warning"
                />
              }
              iconPosition="end"
            />
            <Tab
              value="answered"
              label="답변완료"
              icon={
                <Chip
                  label={tabCounts.answered}
                  size="small"
                  variant="soft"
                  color="success"
                />
              }
              iconPosition="end"
            />
          </Tabs>

          <InquiryTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            onSubmitted={handleRefresh}
          />
          {canReset && (
            <InquiryTableFiltersResult
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
                      <InquiryTableRow
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

function applyFilter({ inputData, comparator, filters, currentTab }) {
  const { name, startDate, endDate, sortBy, senderType } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  // 탭별 필터링 (상태)
  if (currentTab !== "all") {
    inputData = inputData.filter((inquiry) => {
      const inquiryStatus = String(inquiry.status || "").toLowerCase();
      const isAnswered =
        inquiryStatus.includes("완료") ||
        inquiryStatus.includes("answered") ||
        inquiryStatus.includes("completed") ||
        inquiryStatus.includes("done") ||
        inquiryStatus.includes("처리") ||
        inquiryStatus.includes("processing");

      if (currentTab === "pending") {
        return !isAnswered;
      } else if (currentTab === "answered") {
        return isAnswered;
      }
      return true;
    });
  }

  // 구분 필터 (seller/user)
  if (senderType && senderType !== "all") {
    inputData = inputData.filter((inquiry) => {
      const inquirySenderType = String(inquiry.senderType || "").toLowerCase();
      return inquirySenderType === senderType.toLowerCase();
    });
  }

  // 검색어 필터 (제목, 작성자 이름만)
  if (name) {
    inputData = inputData.filter(
      (inquiry) =>
        inquiry.senderName?.toLowerCase().includes(name.toLowerCase()) ||
        inquiry.title?.toLowerCase().includes(name.toLowerCase())
    );
  }

  // 기간 필터
  if (startDate) {
    inputData = inputData.filter((inquiry) => {
      const inquiryDate = new Date(inquiry.createdAt);
      return inquiryDate >= new Date(startDate);
    });
  }

  if (endDate) {
    inputData = inputData.filter((inquiry) => {
      const inquiryDate = new Date(inquiry.createdAt);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      return inquiryDate <= endDateTime;
    });
  }

  // 정렬
  if (sortBy) {
    inputData = [...inputData].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (sortBy === "latest") {
        return dateB - dateA; // 최신순
      } else if (sortBy === "oldest") {
        return dateA - dateB; // 오래된순
      }
      return 0;
    });
  }

  return inputData;
}
