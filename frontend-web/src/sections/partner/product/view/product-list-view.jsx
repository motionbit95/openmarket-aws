"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBoolean, useSetState } from "minimal-shared/hooks";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  DataGrid,
  gridClasses,
  GridToolbarExport,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from "@mui/x-data-grid";

import { paths } from "src/routes/paths";
import { RouterLink } from "src/routes/components";

import { deleteProduct, PRODUCT_STOCK_OPTIONS } from "src/actions/product";
import { useGetProducts } from "src/actions/product";
import { DashboardContent } from "src/layouts/dashboard";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { EmptyContent } from "src/components/empty-content";
import { ConfirmDialog } from "src/components/custom-dialog";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";

import { ProductTableToolbar } from "../product-table-toolbar";
import { ProductTableFiltersResult } from "../product-table-filters-result";
import {
  RenderCellStock,
  RenderCellPrice,
  RenderCellPublish,
  RenderCellProduct,
  RenderCellCreatedAt,
} from "../product-table-row";
import { InputAdornment, TextField } from "@mui/material";

// 한글화용 localeText 객체
const customLocaleText = {
  toolbarColumns: "열 선택",
  toolbarFilters: "필터",
  toolbarExport: "내보내기",
  toolbarExportCSV: "CSV로 내보내기",
  toolbarExportPrint: "인쇄",
  noRowsLabel: "표시할 데이터가 없습니다.",
  noResultsOverlayLabel: "검색 결과가 없습니다.",
  // 필요하면 더 추가 가능
};

const saleStatusOptions = [
  { value: "ON_SALE", label: "판매중" },
  { value: "WAITING", label: "판매대기" },
  { value: "PAUSED", label: "판매중지" },
  { value: "OUT_OF_STOCK", label: "품절" },
  { value: "ENDED", label: "판매종료" },
  { value: "BANNED", label: "판매금지" },
];

const displayStatusOptions = [
  { value: "DISPLAYED", label: "전시중" },
  { value: "HIDDEN", label: "전시중지" },
];

const HIDE_COLUMNS = { category: false };

const HIDE_COLUMNS_TOGGLABLE = ["category", "actions"];

export function ProductListView() {
  const confirmDialog = useBoolean();

  const { products = [], productsLoading } = useGetProducts();

  // products가 변경될 때만 tableData 갱신
  const [tableData, setTableData] = useState(products);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [filterButtonEl, setFilterButtonEl] = useState(null);

  const filters = useSetState({
    saleStatus: [],
    displayStatus: [],
    search: "",
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState(HIDE_COLUMNS);

  // products가 변경될 때만 tableData 갱신
  useEffect(() => {
    setTableData(products);
    // eslint-disable-next-line
  }, [products]);

  const canReset =
    (currentFilters.saleStatus && currentFilters.saleStatus.length > 0) ||
    (currentFilters.displayStatus && currentFilters.displayStatus.length > 0) ||
    (currentFilters.search && currentFilters.search.trim() !== "");

  // tableData와 currentFilters가 변경될 때만 dataFiltered 계산
  const dataFiltered = useMemo(
    () =>
      applyFilter({
        inputData: tableData,
        filters: currentFilters,
      }),
    [tableData, currentFilters]
  );

  // 여기 동작 수정
  const handleDeleteRow = useCallback(async (id) => {
    try {
      const result = await deleteProduct(id);
      if (!result || result.success === false) {
        throw new Error("상품 삭제 실패");
      }
      setTableData((prev) => prev.filter((row) => row.id !== id));
      toast.success("삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("삭제에 실패했습니다.");
    }
  }, []);

  const handleDeleteRows = useCallback(async () => {
    try {
      // 여러 개 삭제도 실제 삭제 API 호출
      await Promise.all(selectedRowIds.map((id) => deleteProduct(id)));
      setTableData((prev) =>
        prev.filter((row) => !selectedRowIds.includes(row.id))
      );
      toast.success("선택한 항목들이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("선택 항목 삭제에 실패했습니다.");
    }
  }, [selectedRowIds]);

  // columns는 변하지 않으므로 useMemo 사용
  const columns = useMemo(
    () => [
      { field: "category", headerName: "카테고리", filterable: false },
      {
        field: "name",
        headerName: "상품명",
        flex: 1,
        minWidth: 360,
        hideable: false,
        renderCell: (params) => (
          <RenderCellProduct
            params={params}
            href={paths.dashboard.partner.product.details(params.row.id)}
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "생성일",
        width: 160,
        renderCell: (params) => <RenderCellCreatedAt params={params} />,
      },
      {
        field: "displayStatus",
        headerName: "전시상태",
        width: 160,
        type: "singleSelect",
        valueOptions: PRODUCT_STOCK_OPTIONS,
        renderCell: (params) => <RenderCellStock params={params} />,
      },
      {
        field: "price",
        headerName: "가격",
        width: 140,
        editable: true,
        renderCell: (params) => <RenderCellPrice params={params} />,
      },
      {
        field: "saleStatus",
        headerName: "판매상태",
        width: 110,
        type: "singleSelect",
        editable: true,
        renderCell: (params) => <RenderCellPublish params={params} />,
      },
      {
        type: "actions",
        field: "actions",
        headerName: " ",
        align: "right",
        headerAlign: "right",
        width: 80,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        getActions: (params) => [
          // <GridActionsLinkItem
          //   showInMenu
          //   icon={<Iconify icon="solar:eye-bold" />}
          //   label="보기"
          //   href={paths.dashboard.partner.product.details(params.row.id)}
          //   key="view"
          // />,
          <GridActionsLinkItem
            showInMenu
            icon={<Iconify icon="solar:pen-bold" />}
            label="수정"
            href={paths.dashboard.partner.product.edit(params.row.id)}
            key="edit"
          />,
          <GridActionsCellItem
            showInMenu
            icon={<Iconify icon="solar:trash-bin-trash-bold" />}
            label="삭제"
            onClick={() => handleDeleteRow(params.row.id)}
            sx={{ color: "error.main" }}
            key="delete"
          />,
        ],
      },
    ],
    [handleDeleteRow]
  );

  const getTogglableColumns = useCallback(
    () =>
      columns
        .filter((column) => !HIDE_COLUMNS_TOGGLABLE.includes(column.field))
        .map((column) => column.field),
    [columns]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="삭제 확인"
      content={
        <>
          선택한 <strong>{selectedRowIds.length}</strong>개 항목을
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

  const handleFilterSearch = (event) => {
    const { value } = event.target;

    updateFilters({ search: value });
  };

  // CustomToolbarCallback 생성
  function CustomToolbarCallback(props) {
    // DataGrid에서 넘겨주는 props: setFilterButtonEl 등
    // 필요한 값들은 ProductListView에서 직접 내려준다.
    return (
      <CustomToolbar
        filters={filters}
        canReset={canReset}
        selectedRowIds={selectedRowIds}
        filteredResults={dataFiltered.length}
        setFilterButtonEl={props.setFilterButtonEl}
        onOpenConfirmDeleteRows={confirmDialog.onTrue}
        handleFilterSearch={handleFilterSearch}
        currentFilters={currentFilters}
      />
    );
  }

  return (
    <>
      <DashboardContent
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <CustomBreadcrumbs
          heading="상품 목록"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.partner.product.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              상품 등록
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card
          sx={{
            minHeight: 640,
            flexGrow: { md: 1 },
            display: { md: "flex" },
            height: { xs: 800, md: "1px" },
            flexDirection: { md: "column" },
          }}
        >
          <DataGrid
            checkboxSelection
            disableRowSelectionOnClick
            rows={dataFiltered}
            columns={columns}
            loading={productsLoading}
            getRowHeight={() => "auto"}
            pageSizeOptions={[5, 10, 20, { value: -1, label: "전체" }]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            onRowSelectionModelChange={(newSelectionModel) =>
              setSelectedRowIds(newSelectionModel)
            }
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) =>
              setColumnVisibilityModel(newModel)
            }
            slots={{
              toolbar: CustomToolbarCallback,
              noRowsOverlay: () => (
                <EmptyContent title="표시할 데이터가 없습니다." />
              ),
              noResultsOverlay: () => (
                <EmptyContent title="검색 결과가 없습니다." />
              ),
            }}
            slotProps={{
              toolbar: { setFilterButtonEl },
              panel: { anchorEl: filterButtonEl },
              columnsManagement: { getTogglableColumns },
            }}
            sx={{
              [`& .${gridClasses.cell}`]: {
                alignItems: "center",
                display: "inline-flex",
              },
            }}
            localeText={customLocaleText}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

function CustomToolbar({
  filters,
  canReset,
  selectedRowIds,
  filteredResults,
  setFilterButtonEl,
  onOpenConfirmDeleteRows,
  handleFilterSearch,
  currentFilters,
}) {
  // filterButtonEl 관련 useRef, useCallback 제거 (무한 루프 방지)
  // DataGrid 내부에서 ref 처리, setFilterButtonEl만 prop으로 전달

  return (
    <>
      <GridToolbarContainer>
        <ProductTableToolbar
          filters={filters}
          options={{ saleStatusOptions, displayStatusOptions }}
        />

        <TextField
          fullWidth
          autoFocus
          // value={currentFilters.search}
          // onChange={handleFilterSearch}
          // 한글 입력 중(조합 중)에는 엔터를 무시하고, 조합이 끝난 후에만 검색 실행
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.nativeEvent.isComposing === false) {
              handleFilterSearch(e);
            }
          }}
          placeholder="상품명으로 검색"
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
          sx={{ ml: 1, flex: 1 }}
        />

        <Box
          sx={{
            gap: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {!!selectedRowIds.length && (
            <Button
              size="small"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={onOpenConfirmDeleteRows}
            >
              삭제 ({selectedRowIds.length})
            </Button>
          )}
        </Box>
      </GridToolbarContainer>

      {canReset && (
        <ProductTableFiltersResult
          filters={filters}
          totalResults={filteredResults}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

export function GridActionsLinkItem({ ref, href, label, icon, sx }) {
  // MenuItem의 ref 제거 (불필요한 ref 전달 방지)
  return (
    <MenuItem sx={sx}>
      <Link
        component={RouterLink}
        href={href}
        underline="none"
        color="inherit"
        sx={{ width: 1, display: "flex", alignItems: "center" }}
      >
        {icon && <ListItemIcon>{icon}</ListItemIcon>}
        {label}
      </Link>
    </MenuItem>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters }) {
  const { saleStatus = [], displayStatus = [], search = "" } = filters;

  let filtered = inputData;

  if (saleStatus.length) {
    filtered = filtered.filter((product) =>
      saleStatus.includes(product.saleStatus)
    );
  }

  if (displayStatus.length) {
    filtered = filtered.filter((product) =>
      displayStatus.includes(product.displayStatus)
    );
  }

  if (search.trim() !== "") {
    const lowerSearch = search.trim().toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.internalName &&
        product.internalName.toLowerCase().includes(lowerSearch)
    );
  }

  return filtered;
}
