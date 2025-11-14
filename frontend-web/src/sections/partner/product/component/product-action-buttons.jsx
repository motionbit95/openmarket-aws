import { Box, Button } from "@mui/material";

export default function RenderActions({
  handleTempSave,
  isSubmitting,
  currentProduct,
}) {
  return (
    <Box
      sx={{
        gap: 3,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Button
        type="button"
        variant="outlined"
        size="large"
        onClick={handleTempSave}
      >
        임시저장
      </Button>

      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
      >
        {!currentProduct ? "등록하기" : "수정하기"}
      </Button>
    </Box>
  );
}
