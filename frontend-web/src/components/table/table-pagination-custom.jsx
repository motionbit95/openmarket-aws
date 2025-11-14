import Box from "@mui/material/Box";
import TablePagination from "@mui/material/TablePagination";

// ----------------------------------------------------------------------

export function TablePaginationCustom({
  sx,
  rowsPerPageOptions = [10, 25, 50],
  ...other
}) {
  return (
    <Box sx={[{ position: "relative" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        {...other}
        sx={{ borderTopColor: "transparent" }}
        labelRowsPerPage="페이지당 행 수 :"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} / 총 ${count !== -1 ? `${count}건` : `${to}건 이상`}`
        }
      />
    </Box>
  );
}
