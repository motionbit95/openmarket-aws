import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";
import { formatDateTime } from "../hook/product-hook";

export default function RenderTempSavedDialog({
  open,
  onClose,
  onRestore,
  tempSaveInfo,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: 340,
          p: 0,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "primary.lighter",
          color: "primary.darker",
          fontWeight: 700,
          fontSize: 18,
          py: 2,
          px: 3,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <span role="img" aria-label="임시저장" style={{ fontSize: 22 }}>
            💾
          </span>
          임시저장된 값이 있습니다
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ py: 3, px: 3 }}>
        <Stack spacing={1.5}>
          {tempSaveInfo && tempSaveInfo.savedAt ? (
            <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 16, color: "#90caf9", marginRight: 10 }}>
                🕒
              </span>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  fontWeight: 500,
                  textAlign: "left",
                  display: "inline",
                  alignItems: "center",
                  gap: 0.5,
                }}
                component="span"
              >
                마지막 임시저장: {formatDateTime(tempSaveInfo.savedAt)}
              </Typography>
            </Box>
          ) : null}
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            임시저장된 값을 불러오시겠습니까?
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          sx={{
            borderRadius: 2,
            minWidth: 90,
            fontWeight: 500,
            mr: 1,
            borderColor: "grey.300",
            color: "text.secondary",
            "&:hover": {
              borderColor: "grey.400",
              bgcolor: "grey.100",
            },
          }}
        >
          아니오
        </Button>
        <Button
          onClick={onRestore}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 2,
            minWidth: 90,
            fontWeight: 600,
            boxShadow: "none",
          }}
        >
          불러오기
        </Button>
      </DialogActions>
    </Dialog>
  );
}
