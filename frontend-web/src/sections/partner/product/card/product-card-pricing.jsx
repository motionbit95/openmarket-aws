import {
  Box,
  Card,
  CardHeader,
  Collapse,
  Divider,
  InputAdornment,
} from "@mui/material";
import { Field } from "src/components/hook-form";
import { RenderCollapseButton } from "../component/product-collapse-button";
import { useFormContext } from "react-hook-form";

// 스키마에 맞춰 prices.*, stockQuantity로 구조 변경
export default function RenderPricing({ openPricing }) {
  const { setValue, getValues } = useFormContext();

  // 가격 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    // prices.* 필드는 prices.originalPrice, prices.salePrice, prices.discountRate
    if (name === "prices.originalPrice") {
      const originalPrice = value === "" ? null : Number(value);
      setValue(name, originalPrice, { shouldValidate: true });

      // 판매가와 할인율 동기화
      const salePrice = getValues("prices.salePrice");
      if (
        originalPrice !== null &&
        salePrice !== null &&
        !isNaN(originalPrice) &&
        !isNaN(salePrice) &&
        originalPrice > 0
      ) {
        // 할인율 계산: ((정상가 - 판매가) / 정상가) * 100
        const discountRate = Math.round(
          ((originalPrice - salePrice) / originalPrice) * 100
        );
        setValue("prices.discountRate", discountRate, { shouldValidate: true });
      } else {
        setValue("prices.discountRate", null, { shouldValidate: true });
      }
    } else if (name === "prices.salePrice") {
      const salePrice = value === "" ? null : Number(value);
      setValue(name, salePrice, { shouldValidate: true });

      // 할인율 동기화
      const originalPrice = getValues("prices.originalPrice");
      if (
        originalPrice !== null &&
        salePrice !== null &&
        !isNaN(originalPrice) &&
        !isNaN(salePrice) &&
        originalPrice > 0
      ) {
        // 할인율 계산: ((정상가 - 판매가) / 정상가) * 100
        const discountRate = Math.round(
          ((originalPrice - salePrice) / originalPrice) * 100
        );
        setValue("prices.discountRate", discountRate, { shouldValidate: true });
      } else {
        setValue("prices.discountRate", null, { shouldValidate: true });
      }
    } else if (name === "prices.discountRate") {
      const discountRate = value === "" ? null : Number(value);
      setValue(name, discountRate, { shouldValidate: true });

      // 판매가 동기화
      const originalPrice = getValues("prices.originalPrice");
      if (
        originalPrice !== null &&
        discountRate !== null &&
        !isNaN(originalPrice) &&
        !isNaN(discountRate)
      ) {
        // 판매가 계산: 정상가 * (1 - 할인율/100)
        const salePrice = Math.round(originalPrice * (1 - discountRate / 100));
        setValue("prices.salePrice", salePrice, { shouldValidate: true });
      } else {
        setValue("prices.salePrice", null, { shouldValidate: true });
      }
    } else if (name === "stockQuantity") {
      setValue(name, value === "" ? null : Number(value), {
        shouldValidate: true,
      });
    }
  };

  return (
    <Card>
      <CardHeader
        title="가격 정보"
        subheader="단일 상품의 가격 정보를 입력해주세요."
        action={
          <RenderCollapseButton
            value={openPricing.value}
            onToggle={openPricing.onToggle}
          />
        }
        sx={{ mb: 3 }}
      />

      <Collapse in={openPricing.value}>
        <Divider />
        <Box
          sx={{
            p: 3,
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
          }}
        >
          <Field.Text
            name="prices.originalPrice"
            label="정상가"
            type="number"
            onChange={handleChange}
            helperText="할인 전 가격을 입력해주세요."
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 0.75 }}>
                    <Box component="span" sx={{ color: "text.disabled" }}>
                      ₩
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="prices.salePrice"
            label="판매가"
            type="number"
            onChange={handleChange}
            helperText="실제 판매 가격을 입력해주세요. 판매 가격에 따라 할인율을 자동 계산합니다."
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 0.75 }}>
                    <Box component="span" sx={{ color: "text.disabled" }}>
                      ₩
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="prices.discountRate"
            label="할인율 (%)"
            type="number"
            onChange={handleChange}
            helperText="할인율을 입력하면 판매가가 자동 계산됩니다."
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 0.75 }}>
                    <Box component="span" sx={{ color: "text.disabled" }}>
                      %
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Field.Text
            name="stockQuantity"
            label="재고수량"
            type="number"
            onChange={handleChange}
            helperText="상품의 재고수량을 입력해주세요."
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ ml: 0.75 }}>
                    <Box component="span" sx={{ color: "text.disabled" }}>
                      개
                    </Box>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Collapse>
    </Card>
  );
}
