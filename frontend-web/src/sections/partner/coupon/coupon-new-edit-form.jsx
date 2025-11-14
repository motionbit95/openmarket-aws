import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { Form, Field } from "src/components/hook-form";
import { toast } from "sonner";
import { createCoupon, updateCoupon } from "src/actions/coupon";
import { useEffect } from "react";
import dayjs from "dayjs";
import { getSellerSession } from "src/actions/seller";

// 참고: 값 초기화 로직을 getDefaultValues 함수에서 처리합니다.
const CouponSchema = zod.object({
  title: zod.string().min(1, { message: "제목을 입력해주세요." }),
  content: zod.string().min(1, { message: "내용을 입력해주세요." }),
  coupon_type: zod.string().min(1, { message: "쿠폰 유형을 선택해주세요." }),
  discount_mode: zod.string().min(1, { message: "할인 방식을 선택해주세요." }),
  discount_amount: zod.preprocess(
    (val) => {
      if (val === "" || val == null) return undefined;
      if (typeof val === "string" && !/^\d+$/.test(val)) return val; // allow zod to catch non-numeric
      const parsed = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(parsed) ? val : parsed;
    },
    zod
      .number({
        required_error: "할인 금액을 입력해주세요.",
        invalid_type_error: "숫자를 입력해주세요.",
      })
      .min(1, { message: "할인 금액을 입력해주세요." })
  ),
  discount_max: zod.preprocess(
    (val) =>
      val === "" || val == null
        ? null
        : typeof val === "string"
          ? parseInt(val, 10)
          : val,
    zod.number().nullable().optional()
  ),
  min_order_amount: zod.preprocess(
    (val) =>
      val === "" || val == null
        ? null
        : typeof val === "string"
          ? parseInt(val, 10)
          : val,
    zod.number().nullable().optional()
  ),
  total_count: zod.preprocess(
    (val) => {
      if (val === "" || val == null) return undefined;
      if (typeof val === "string" && !/^\d+$/.test(val)) return val; // allow zod to catch non-numeric
      const parsed = typeof val === "string" ? parseInt(val, 10) : val;
      return isNaN(parsed) ? val : parsed;
    },
    zod
      .number({
        required_error: "총 발급 수량을 입력해주세요.",
        invalid_type_error: "숫자를 입력해주세요.",
      })
      .min(1, { message: "총 발급 수량을 입력해주세요." })
  ),
  issuer_type: zod.enum(["admin", "partner"], {
    errorMap: () => ({ message: "발급자 구분을 선택해주세요." }),
  }),
  start_date: zod.date({ required_error: "발급 시작일을 선택해주세요." }),
  end_date: zod.date({ required_error: "발급 종료일을 선택해주세요." }).refine(
    (val, ctx) => {
      const issueStartDate = ctx?.parent?.start_date;
      if (
        !issueStartDate ||
        !(val instanceof Date) ||
        !(issueStartDate instanceof Date)
      ) {
        return true;
      }
      return val >= issueStartDate;
    },
    { message: "발급 종료일은 시작일 이후여야 합니다." }
  ),
  validity_type: zod.enum(["fixed", "from_issue"]),
  valid_from: zod.preprocess(
    (val) => (val === "" ? null : val),
    zod.date().nullable().optional()
  ),
  valid_to: zod.preprocess(
    (val) => (val === "" ? null : val),
    zod.date().nullable().optional()
  ),
  validity_days: zod.preprocess(
    (val) =>
      val === "" || val == null
        ? null
        : typeof val === "string"
          ? parseInt(val, 10)
          : val,
    zod
      .number()
      .nullable()
      .optional()
      .refine((val) => val == null || val > 0, {
        message: "유효기간(일)은 1 이상이어야 합니다.",
      })
  ),
});

function getDefaultValues(currentCoupon) {
  // 참고: currentCoupon이 없으면 기본값, 있으면 currentCoupon 기반으로 초기화
  const defaultValues = {
    title: "",
    content: "",
    coupon_type: "",
    discount_mode: "",
    discount_amount: "",
    discount_max: "",
    min_order_amount: "",
    total_count: "",
    issuer_type: "partner",
    start_date: null,
    end_date: null,
    validity_type: "fixed",
    valid_from: null,
    valid_to: null,
    validity_days: "",
  };

  if (!currentCoupon) return defaultValues;

  return {
    ...defaultValues,
    ...currentCoupon,
    coupon_type:
      currentCoupon?.coupon_type != null
        ? String(currentCoupon.coupon_type)
        : "",
    discount_mode:
      currentCoupon?.discount_mode != null
        ? String(currentCoupon.discount_mode)
        : "",
    discount_amount:
      currentCoupon?.discount_amount != null
        ? String(currentCoupon.discount_amount)
        : "",
    discount_max:
      currentCoupon?.discount_max != null
        ? String(currentCoupon.discount_max)
        : "",
    min_order_amount:
      currentCoupon?.min_order_amount != null
        ? String(currentCoupon.min_order_amount)
        : "",
    total_count:
      currentCoupon?.total_count != null
        ? String(currentCoupon.total_count)
        : "",
    issuer_type:
      process.env.NEXT_PUBLIC_BUILD_MODE === "admin" ? "admin" : "partner",
    start_date: currentCoupon?.start_date
      ? dayjs(currentCoupon.start_date).toDate()
      : null,
    end_date: currentCoupon?.end_date
      ? dayjs(currentCoupon.end_date).toDate()
      : null,
    validity_type: currentCoupon?.validity_type ?? "fixed",
    valid_from: currentCoupon?.valid_from
      ? dayjs(currentCoupon.valid_from).toDate()
      : null,
    valid_to: currentCoupon?.valid_to
      ? dayjs(currentCoupon.valid_to).toDate()
      : null,
    validity_days:
      currentCoupon?.validity_days != null
        ? String(currentCoupon.validity_days)
        : "",
  };
}

export function CouponNewEditForm({ currentCoupon, onClose, onSubmitted }) {
  const methods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(CouponSchema),
    defaultValues: getDefaultValues(currentCoupon),
    // values: currentCoupon, // <-- 이 줄이 문제! 제거해야 정상 동작
  });

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Controller로 select, date, radio 등 관리
  const discountMode = useWatch({ control, name: "discount_mode" });
  const validityType = useWatch({ control, name: "validity_type" });

  // currentCoupon이 바뀔 때마다 폼 값 초기화
  useEffect(() => {
    const defaults = getDefaultValues(currentCoupon);
    reset(defaults);

    // eslint-disable-next-line
  }, [currentCoupon, reset]);

  // validity_type 변경시 validity_days, valid_from, valid_to 초기화
  useEffect(() => {
    if (validityType === "fixed") {
      setValue("validity_days", getDefaultValues(currentCoupon).validity_days);
      setValue("valid_from", getDefaultValues(currentCoupon).valid_from);
      setValue("valid_to", getDefaultValues(currentCoupon).valid_to);
    } else {
      setValue("valid_from", null);
      setValue("valid_to", null);
    }
    // eslint-disable-next-line
  }, [validityType]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      let credential = await getSellerSession();
      // 백엔드 필드명에 맞게 변환
      const parsedData = {
        title: data.title,
        content: data.content,
        coupon_type: data.coupon_type,
        discount_mode: data.discount_mode,
        discount_amount: Number(data.discount_amount),
        discount_max:
          data.discount_max !== "" && data.discount_max != null
            ? Number(data.discount_max)
            : null,
        min_order_amount:
          data.min_order_amount !== "" && data.min_order_amount != null
            ? Number(data.min_order_amount)
            : null,
        total_count: Number(data.total_count),
        start_date: data.start_date,
        end_date: data.end_date,
        issued_by: "partner",
        validity_type: data.validity_type,
        validity_days:
          data.validity_type === "from_issue" && data.validity_days !== ""
            ? Number(data.validity_days)
            : null,
        valid_from:
          data.validity_type === "fixed" && data.valid_from
            ? data.valid_from
            : null,
        valid_to:
          data.validity_type === "fixed" && data.valid_to
            ? data.valid_to
            : null,
        issued_partner_id: credential.user.id,
      };

      if (currentCoupon) {
        await updateCoupon(currentCoupon.id, parsedData);
        toast.success("쿠폰 수정이 완료되었습니다!");
      } else {
        await createCoupon(parsedData);
        toast.success("쿠폰 생성이 완료되었습니다!");
      }

      onClose?.();
      onSubmitted?.();
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={5}>
        {/* 기본 정보 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            쿠폰 기본정보
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Field.Text
                name="title"
                label="제목"
                fullWidth
                type="text"
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ flex: 1 }}>
              <Field.Text
                name="content"
                label="내용"
                fullWidth
                type="text"
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* 타입 및 발급 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            타입 및 발급 설정
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="coupon_type"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    label="쿠폰 유형"
                    sx={{ width: 200 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    {...field}
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="user">마켓 찜 유도</MenuItem>
                    <MenuItem value="seller_first">첫구매</MenuItem>
                    <MenuItem value="seller_repeat">재구매</MenuItem>
                    <MenuItem value="seller_message">메시지 전용</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            {/* <Grid item xs={12} sm={4}>
              <Field.Select
                name="issuer_type"
                label="발급자 구분"
                sx={{ width: 200 }}
              >
                <MenuItem value="admin">관리자</MenuItem>
                <MenuItem value="partner">파트너</MenuItem>
              </Field.Select>
            </Grid> */}
            <Grid item xs={12} sm={4}>
              <Field.Text
                name="total_count"
                label="총 발급 수량"
                fullWidth
                type="number"
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Field.Text
                name="min_order_amount"
                label="최소 주문 금액 (선택)"
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="start_date"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label="발급 시작일"
                    inputFormat="YYYY/MM/DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toDate() : null)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="end_date"
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label="발급 종료일"
                    inputFormat="YYYY/MM/DD"
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toDate() : null)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>

        {/* 할인 설정 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            할인금액 설정
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="discount_mode"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    label="할인 방식"
                    sx={{ width: 200 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    {...field}
                  >
                    <MenuItem value="amount">정액 (원)</MenuItem>
                    <MenuItem value="percent">정률 (%)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Field.Text
                name="discount_amount"
                label="할인 금액/비율"
                fullWidth
                type="number"
                inputProps={{ min: 1 }}
              />
            </Grid>
            {/* discount_mode가 'percent'일 때만 최대 할인 금액 필드 노출 */}
            {discountMode === "percent" && (
              <Grid item xs={12} sm={4}>
                <Field.Text
                  name="discount_max"
                  label="최대 할인 금액 (선택)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* 유효기간 설정 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            유효기간 설정
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Controller
            name="validity_type"
            control={control}
            render={({ field }) => (
              <RadioGroup
                row
                {...field}
                value={field.value ?? ""}
                sx={{ mb: 3 }}
                name="validity_type"
              >
                <FormControlLabel
                  value="fixed"
                  control={<Radio />}
                  label="고정 기간"
                />
                <FormControlLabel
                  value="from_issue"
                  control={<Radio />}
                  label="발급일 기준 기간"
                />
              </RadioGroup>
            )}
          />

          {validityType === "fixed" ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="valid_from"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="유효 시작일"
                      inputFormat="YYYY/MM/DD"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? date.toDate() : null)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="valid_to"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label="유효 종료일"
                      inputFormat="YYYY/MM/DD"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) =>
                        field.onChange(date ? date.toDate() : null)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ width: 200 }}>
              <Controller
                name="validity_days"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="발급일 기준 유효기간(일)"
                    type="number"
                    inputProps={{ min: 1 }}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
            </Box>
          )}
        </Box>

        {/* 버튼 */}
        <Stack sx={{ mt: 3, alignItems: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            // loading={isSubmitting} // MUI Button에는 loading prop이 없음. 필요시 CircularProgress 등으로 대체
            size="large"
          >
            {currentCoupon ? "수정하기" : "등록하기"}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
