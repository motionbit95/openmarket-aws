"use client";

import { Field, Form } from "src/components/hook-form";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardHeader,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Editor } from "src/components/editor";
import { useEffect, useState } from "react";
import { useBoolean } from "minimal-shared/hooks";
import SimpleDatePicker from "../date-picker";

export function FormView({
  initialData = null,
  onSubmit,
  isEdit = false,
  loading = false,
}) {
  const methods = useForm({
    mode: "all",
    defaultValues: {
      // 임시
      title: "",
      content: "",
      type: "",
      discount_amount: "",
      discount_max: "",
      min_order_amount: "",
      total_count: "",
      start_date: "",
      end_date: "",
      available_date: "",
    },
  });
  const {
    watch,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { isSubmitting, isValid },
  } = methods;

  const [images, setImages] = useState({ files: [] });
  const showPreview = useBoolean();

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        content: initialData.content || "",
      });

      const initialFiles =
        initialData.attachments?.map((file) => ({
          ...file,
          preview: file.url,
          existing: true,
        })) || [];

      setImages({ files: initialFiles });
    }
  }, [initialData, reset]);

  const internalSubmit = handleSubmit(async (formData) => {
    const newFiles = images.files.filter((file) => !file.existing);
    await onSubmit({ ...formData, files: images.files, newFiles });
  });

  const types = [
    {
      id: 1,
      name: 1,
    },
    {
      id: 2,
      name: 2,
    },
    {
      id: 3,
      name: 3,
    },
    {
      id: 4,
      name: 4,
    },
    {
      id: 5,
      name: 5,
    },
  ];

  const CouponSection = (props) => (
    <Card sx={{ width: "100%" }}>
      <CardHeader
        title={props.title}
        sx={{ pb: 2, borderBottom: "1px solid #e0e0e0" }}
      />
      <Grid container spacing={3} sx={{ width: "100%", p: 3 }}>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            width: "100%",
          }}
        >
          {props.children}
        </Grid>
      </Grid>
    </Card>
  );
  const FieldGroup = (props) => (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {props.title}
      </Typography>
      {props.children}
    </Box>
  );

  const TypeButtons = () => (
    <Stack spacing={2}>
      <Controller
        name="coupon_type"
        control={control}
        render={({ field }) => (
          <Box
            sx={{
              gap: 2,
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)", // 5개니까 3-2배치 추천
            }}
          >
            {types.map((item) => (
              <Paper
                component={ButtonBase}
                variant="outlined"
                key={item.name}
                onClick={() => field.onChange(item.name)}
                sx={{
                  p: 2.5,
                  borderRadius: 1,
                  typography: "subtitle2",
                  flexDirection: "column",
                  textAlign: "center",
                  ...(item.name === field.value && {
                    borderWidth: 2,
                    borderColor: "text.primary",
                  }),
                }}
              >
                {item.name}
              </Paper>
            ))}
          </Box>
        )}
      />
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={internalSubmit}>
      <Stack gap={3}>
        <CouponSection title="쿠폰 기본 정보">
          <FieldGroup title="관리용 쿠폰이름">
            <Field.Text name="title" placeholder="쿠폰명을 입력해주세요." />
          </FieldGroup>
          <FieldGroup title="쿠폰 설명">
            <Editor
              title="내용"
              value={watch("content")}
              onChange={(v) => setValue("content", v)}
            />
          </FieldGroup>
        </CouponSection>

        <CouponSection title="타입 설정">
          <FieldGroup title="타입">
            <TypeButtons />
          </FieldGroup>
        </CouponSection>

        <CouponSection title="발급 설정">
          <FieldGroup title="총 발급 수량 설정">
            <Field.Text name="total_count" placeholder="0" />
          </FieldGroup>
        </CouponSection>

        <CouponSection title="할인 금액 설정">
          <FieldGroup title="할인금액">
            <Field.Text name="discount_amount" placeholder="0" />
          </FieldGroup>
          <FieldGroup title="최대 할인">
            <Field.Text name="discount_max" placeholder="0" />
          </FieldGroup>
          <FieldGroup title="최소 주문 금액">
            <Field.Text name="min_order_amount" placeholder="0" />
          </FieldGroup>
        </CouponSection>

        <CouponSection title="기간 설정">
          <FieldGroup title="발급 기간">
            <Box
              sx={{
                gap: 2,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              {/* <FieldContainer2 label="RHFDatePicker">
                <Field.DatePicker name="startDate" label="Start date" />
              </FieldContainer2>
              <FieldContainer2 label="RHFDatePicker">
                <Field.DatePicker name="endDate" label="End date" />
              </FieldContainer2> */}
              <SimpleDatePicker name="startDate" label="Start date" />
              <SimpleDatePicker name="endDate" label="End date" />
            </Box>
          </FieldGroup>
          <FieldGroup title="유효 기간">
            <Field.Text name="available_date" placeholder="YYYY-MM-DD" />
          </FieldGroup>
        </CouponSection>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={isSubmitting || loading}
          >
            {isEdit ? "수정" : "등록"}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}

export function FieldContainer2({ sx, children, label = "RHFTextField" }) {
  return (
    <Box
      sx={[
        () => ({
          gap: 1,
          width: 1,
          display: "flex",
          flexDirection: "column",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography
        variant="caption"
        sx={[
          (theme) => ({
            textAlign: "right",
            fontStyle: "italic",
            color: "text.disabled",
            fontSize: theme.typography.pxToRem(10),
          }),
        ]}
      >
        {label}
      </Typography>

      {children}
    </Box>
  );
}
