import {
  Card,
  CardHeader,
  Collapse,
  Divider,
  Stack,
  MenuItem,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";
import { Field } from "src/components/hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { KeywordsInput } from "../component/keywords-input";
import { Editor } from "src/components/editor";
import { RenderCollapseButton } from "../component/product-collapse-button";
import { CategorySelector } from "../component/category-selector";
import { useEffect } from "react";

export default function RenderDetails({
  openDetails,
  currentProduct,
  salePeriodEnabled,
  setSalePeriodEnabled,
}) {
  const { setValue, control } = useFormContext();
  const formValues = useWatch({ control });

  // saleStatus, displayStatus, keywords 등은 별도 상태로 관리하지 않으므로 setValue 직접 사용
  return (
    <Card>
      <CardHeader
        title="공통 정보"
        subheader="상품의 기본 정보를 설정합니다."
        action={
          <RenderCollapseButton
            value={openDetails.value}
            onToggle={openDetails.onToggle}
          />
        }
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />
        <Stack spacing={3} sx={{ p: 3 }}>
          {currentProduct && (
            <Stack
              direction={{ xs: "column-reverse", sm: "row" }}
              spacing={4}
              sx={{ alignItems: "center" }}
            >
              <Field.Select
                name="saleStatus"
                label="판매상태"
                value={formValues.saleStatus}
                onChange={(e) => setValue("saleStatus", e.target.value)}
                fullWidth
              >
                <MenuItem value="ON_SALE">판매중</MenuItem>
                <MenuItem value="WAITING">판매대기</MenuItem>
                <MenuItem value="PAUSED">판매중지</MenuItem>
                <MenuItem value="OUT_OF_STOCK">품절</MenuItem>
                <MenuItem value="ENDED">판매종료</MenuItem>
                <MenuItem value="BANNED">판매금지</MenuItem>
              </Field.Select>

              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <FormLabel component="legend" sx={{ minWidth: 60 }}>
                    전시상태
                  </FormLabel>
                  <FormControlLabel
                    control={
                      <Switch
                        name="displayStatus"
                        checked={formValues.displayStatus === "DISPLAYED"}
                        onChange={(e) =>
                          setValue(
                            "displayStatus",
                            e.target.checked ? "DISPLAYED" : "HIDDEN"
                          )
                        }
                        color="primary"
                      />
                    }
                    label={
                      formValues.displayStatus === "DISPLAYED"
                        ? "전시중"
                        : "전시중지"
                    }
                  />
                </Stack>
              </FormControl>
            </Stack>
          )}

          <CategorySelector
            initialCode={formValues.categoryCode}
            onChange={(selected) => {
              setValue("categoryCode", selected?.code || "");
            }}
          />

          <Field.Text
            name="displayName"
            label="노출상품명"
            helperText="판매 상품과 직접 관련이 없는 상품명은 변경될 수 있습니다. 100자까지 입력 가능해요."
            inputProps={{ maxLength: 100 }}
          />

          <Field.Text
            name="internalName"
            label="등록상품명(판매자관리용)"
            helperText="등록상품명은 판매자만 볼 수 있어요. 자유롭게 작성하세요."
          />

          <KeywordsInput
            value={formValues.keywords || []}
            onChange={(newKeywords) => {
              setValue("keywords", newKeywords);
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={salePeriodEnabled}
                  onChange={(e) => {
                    setSalePeriodEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setValue("saleStartDate", null);
                      setValue("saleEndDate", null);
                    }
                  }}
                  color="primary"
                />
              }
              label="판매기간 설정"
            />

            {salePeriodEnabled && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker
                  label="판매 시작일"
                  inputFormat="YYYY/MM/DD"
                  name="saleStartDate"
                  onChange={(date) => setValue("saleStartDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                <DatePicker
                  label="판매 종료일"
                  inputFormat="YYYY/MM/DD"
                  name="saleEndDate"
                  onChange={(date) => setValue("saleEndDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Stack>
            )}
          </Stack>

          <FormLabel component="legend" sx={{ minWidth: 60 }}>
            상세설명
          </FormLabel>
          <Editor
            value={formValues.description || ""}
            onChange={(v) => setValue("description", v)}
          />
        </Stack>
      </Collapse>
    </Card>
  );
}
