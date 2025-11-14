import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";

import { RouterLink } from "src/routes/components";

import { fCurrency } from "src/utils/format-number";
import { fTime, fDate } from "src/utils/format-time";

import { Label } from "src/components/label";
import { useEffect } from "react";
import { getCategoryNameByCode } from "./component/category";

// ----------------------------------------------------------------------

function getPriceRangeFromOptions(options, basePrice) {
  if (!Array.isArray(options) || options.length === 0) return "";

  // 옵션이 있으면 기본 가격에 ~ 표시
  return `${fCurrency(basePrice)}~`;
}

export function RenderCellPrice({ params }) {
  // 백엔드에서 오는 데이터 구조에 맞게 수정
  const options = params.row.ProductOptionGroup || params.row.options || [];
  const priceData = params.row.ProductPrice || params.row.prices;
  const salePrice = priceData?.salePrice || 0;

  return (
    <>
      {options && options.length > 0
        ? getPriceRangeFromOptions(options, salePrice)
        : fCurrency(salePrice)}
    </>
  );
}

const statusMap = {
  ON_SALE: { text: "판매중", color: "success" },
  WAITING: { text: "판매대기", color: "warning" },
  PAUSED: { text: "판매중지", color: "default" },
  OUT_OF_STOCK: { text: "품절", color: "error" },
  ENDED: { text: "판매종료", color: "default" },
  BANNED: { text: "판매금지", color: "error" },
};

export function RenderCellPublish({ params }) {
  const status = params.row.saleStatus;
  const { text, color } = statusMap[status] || {
    text: status,
    color: "default",
  };

  return (
    <Label variant="soft" color={color}>
      {text}
    </Label>
  );
}

export function RenderCellCreatedAt({ params }) {
  return (
    <Box sx={{ gap: 0.5, display: "flex", flexDirection: "column" }}>
      <span>{fDate(params.row.createdAt)}</span>
      <Box
        component="span"
        sx={{ typography: "caption", color: "text.secondary" }}
      >
        {fTime(params.row.createdAt)}
      </Box>
    </Box>
  );
}

export function RenderCellStock({ params }) {
  const status = params.row.displayStatus;

  return (
    <Label
      variant="soft"
      color={status === "DISPLAYED" ? "success" : "default"}
      sx={{ textTransform: "uppercase" }}
    >
      {status === "DISPLAYED" ? "전시중" : "전시중지"}
    </Label>
  );
}

export function RenderCellProduct({ params, href }) {
  return (
    <Box
      sx={{
        py: 2,
        gap: 2,
        width: 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Avatar
        alt={params.row.internalName}
        src={
          params.row.ProductImage?.[0]?.url ||
          "https://via.placeholder.com/64x64?text=No+Image"
        }
        variant="rounded"
        sx={{ width: 64, height: 64 }}
        imgProps={{
          onError: (e) => {
            e.target.src = "https://via.placeholder.com/64x64?text=No+Image";
          },
        }}
      />

      <ListItemText
        primary={
          <span
            style={{
              display: "inline-block",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "bottom",
            }}
            title={params.row.internalName}
          >
            {params.row.internalName}
          </span>
        }
        secondary={getCategoryNameByCode(params.row.categoryCode)}
        slotProps={{
          primary: { noWrap: true },
          secondary: { sx: { color: "text.disabled" } },
        }}
      />
    </Box>
  );
}
