import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Fab, { fabClasses } from "@mui/material/Fab";

import { RouterLink } from "src/routes/components";

import { fCurrency } from "src/utils/format-number";

import { Label } from "src/components/label";
import { Image } from "src/components/image";
import { Iconify } from "src/components/iconify";
import { ColorPreview } from "src/components/color-utils";

// ----------------------------------------------------------------------

export function ProductItem({ product, detailsHref }) {
  const {
    id,
    displayName,
    ProductImage,
    ProductPrice,
    ProductOptionGroup,
    saleStatus,
    stockQuantity,
  } = product;

  // 데이터 변환
  const name = displayName;
  const coverUrl = ProductImage?.[0]?.url;
  const price = ProductPrice?.salePrice || 0;
  const available = saleStatus === "ON_SALE" && stockQuantity > 0;
  const colors = ["#000000"]; // 기본 색상
  const sizes = ["M"]; // 기본 사이즈
  const priceSale = ProductPrice?.originalPrice || price;
  const newLabel = false;
  const saleLabel = ProductPrice?.discountRate > 0;

  // 옵션이 있는 상품인지 확인
  const hasOptions = ProductOptionGroup && ProductOptionGroup.length > 0;

  const handleAddCart = async () => {
    const newProduct = {
      id,
      name,
      coverUrl,
      available,
      price,
      colors: [colors[0]],
      size: sizes[0],
      quantity: 1,
    };
    try {
      // onAddToCart 함수가 정의되지 않았으므로 주석 처리
      // onAddToCart(newProduct);
      console.log("Add to cart:", newProduct);
    } catch (error) {
      console.error(error);
    }
  };

  const renderLabels = () =>
    (newLabel || saleLabel) && (
      <Box
        sx={{
          gap: 1,
          top: 16,
          zIndex: 9,
          right: 16,
          display: "flex",
          position: "absolute",
          alignItems: "center",
        }}
      >
        {newLabel && (
          <Label variant="filled" color="info">
            NEW
          </Label>
        )}
        {saleLabel && (
          <Label variant="filled" color="error">
            SALE
          </Label>
        )}
      </Box>
    );

  const renderImage = () => (
    <Box sx={{ position: "relative", p: 1 }}>
      {!!available && (
        <Fab
          size="medium"
          color="warning"
          onClick={handleAddCart}
          sx={[
            (theme) => ({
              right: 16,
              zIndex: 9,
              bottom: 16,
              opacity: 0,
              position: "absolute",
              transform: "scale(0)",
              transition: theme.transitions.create(["opacity", "transform"], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.shorter,
              }),
            }),
          ]}
        >
          <Iconify icon="solar:cart-plus-bold" width={24} />
        </Fab>
      )}

      <Tooltip title={!available && "Out of stock"} placement="bottom-end">
        <Image
          alt={name}
          src={coverUrl || "https://via.placeholder.com/300x300?text=No+Image"}
          ratio="1/1"
          sx={{
            borderRadius: 1.5,
            ...(!available && { opacity: 0.48, filter: "grayscale(1)" }),
          }}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
          }}
        />
      </Tooltip>
    </Box>
  );

  const renderContent = () => (
    <Stack spacing={2.5} sx={{ p: 3, pt: 2 }}>
      <Link
        component={RouterLink}
        href={detailsHref}
        color="inherit"
        variant="subtitle2"
        noWrap
      >
        {name}
      </Link>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Tooltip title="Color">
          <ColorPreview colors={colors} />
        </Tooltip>

        <Box sx={{ gap: 0.5, display: "flex", typography: "subtitle1" }}>
          {priceSale && priceSale > price && (
            <Box
              component="span"
              sx={{ color: "text.disabled", textDecoration: "line-through" }}
            >
              {hasOptions ? `${fCurrency(priceSale)}~` : fCurrency(priceSale)}
            </Box>
          )}

          <Box component="span">
            {hasOptions ? `${fCurrency(price)}~` : fCurrency(price)}
          </Box>
        </Box>
      </Box>
    </Stack>
  );

  return (
    <Card
      sx={{
        "&:hover": {
          [`& .${fabClasses.root}`]: { opacity: 1, transform: "scale(1)" },
        },
      }}
    >
      {renderLabels()}
      {renderImage()}
      {renderContent()}
    </Card>
  );
}
