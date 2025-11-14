import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import CardHeader from "@mui/material/CardHeader";
import ListItemText from "@mui/material/ListItemText";

import { fToNow } from "src/utils/format-time";
import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";

import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";
import { Markdown } from "src/components/markdown";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useBoolean } from "minimal-shared/hooks";
import { InquiryDetailView } from "../inquiry/inquiry-detail-view";

// ----------------------------------------------------------------------

export function AnalyticsNews({
  title,
  subheader,
  list,
  sx,
  onAnswerSubmitted,
  ...other
}) {
  const router = useRouter();

  const handleViewAll = () => {
    router.push(paths.dashboard.partner.inquiry.center);
  };

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 1 }} />

      <Scrollbar sx={{ minHeight: 405 }}>
        <Box sx={{ minWidth: 640 }}>
          {list?.map((item) => (
            <Item
              key={item.id}
              item={item}
              onAnswerSubmitted={onAnswerSubmitted}
            />
          ))}
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2, textAlign: "right" }}>
        <Button
          size="small"
          color="inherit"
          onClick={handleViewAll}
          endIcon={
            <Iconify
              icon="eva:arrow-ios-forward-fill"
              width={18}
              sx={{ ml: -0.5 }}
            />
          }
        >
          전체보기
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function Item({ item, sx, onAnswerSubmitted, ...other }) {
  const detailDialog = useBoolean();

  const handleAnswerSubmitted = () => {
    detailDialog.onFalse();
    // 리스트 업데이트
    onAnswerSubmitted?.();
  };

  const renderDetailView = () => (
    <Dialog
      open={detailDialog.value}
      onClose={detailDialog.onFalse}
      maxWidth="md"
    >
      <DialogTitle>문의 답변</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ width: "100%", p: 1 }}>
          <InquiryDetailView
            currentInquiry={item}
            onClose={detailDialog.onFalse}
            onAnswerSubmitted={handleAnswerSubmitted}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );

  return (
    <Box
      sx={[
        (theme) => ({
          py: 2,
          px: 3,
          gap: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <ListItemText
        primary={
          <Link
            color="inherit"
            component="button"
            underline="hover"
            onClick={detailDialog.onTrue}
            sx={{ cursor: "pointer" }}
          >
            {item.senderType === "seller"
              ? item.senderInfo?.name
              : item.senderInfo?.user_name}
            {" / "}
            {item.title}
          </Link>
        }
        secondary={
          item.content
            ? item.content
                .replace(/<[^>]+>/g, "") // Remove all HTML tags
                .replace(/\r?\n|\r/g, " ") // Remove newlines
                .trim()
            : ""
        }
        slotProps={{
          primary: { noWrap: true },
          secondary: {
            noWrap: true,
            sx: { mt: 0.5 },
          },
        }}
      />

      {/* <Tooltip title="답변" placement="top" arrow>
        <IconButton
          color={detailDialog.value ? "inherit" : "default"}
          onClick={detailDialog.onTrue}
        >
          <Iconify icon="solar:chat-round-dots-bold" />
        </IconButton>
      </Tooltip> */}

      <Box
        sx={{ flexShrink: 0, typography: "caption", color: "text.disabled" }}
      >
        {fToNow(item.createdAt)}
      </Box>

      {renderDetailView()}
    </Box>
  );
}
