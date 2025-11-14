import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input/input";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";

import { useRouter } from "src/routes/hooks";

import { Form, Field, schemaHelper } from "src/components/hook-form";
import { useBoolean } from "minimal-shared/hooks";
import { IconButton, InputAdornment } from "@mui/material";
import { Iconify } from "src/components/iconify";
import { createUser, updateUser } from "src/actions/user";
import { toast } from "sonner";
import { createSeller, updateSeller } from "src/actions/seller";

// ----------------------------------------------------------------------

const BankType = {
  KB: "국민은행",
  SH: "신한은행",
  HN: "하나은행",
  WR: "우리은행",
  IB: "기업은행",
  NH: "농협은행",
  KAKAOBANK: "카카오뱅크",
  KBANK: "케이뱅크",
  IBK: "산업은행",
  SUHYUP: "수협은행",
  SC: "SC제일은행",
  CITI: "씨티은행",
  DG: "대구은행",
  BS: "부산은행",
  GJ: "광주은행",
  JB: "전북은행",
  JJ: "제주은행",
  GN: "경남은행",
};

// zod 스키마 수정: 은행 선택, 계좌번호 추가
const BankKeys = Object.keys(BankType);

const NewUserSchema = zod.object({
  name: zod.string().min(1, { message: "이름을 입력해주세요." }),
  email: zod
    .string()
    .min(1, { message: "이메일을 입력해주세요." })
    .email({ message: "유효한 이메일 주소를 입력해주세요." }),
  phone: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  password: zod.string().min(1, { message: "비밀번호를 입력해주세요." }),
  bank_type: zod.enum(BankKeys, {
    errorMap: () => ({ message: "은행을 선택해주세요." }),
  }),
  bank_account: zod.string().min(5, { message: "계좌번호를 입력해주세요." }),
  shop_name: zod.string().min(1, { message: "매장명을 입력해주세요." }),
  business_number: zod
    .string()
    .min(1, { message: "사업자등록번호를 입력해주세요." }),
});

// ----------------------------------------------------------------------

export function SellerNewEditForm({ currentUser, onClose, onSubmitted }) {
  const router = useRouter();
  const showPassword = useBoolean();

  const defaultValues = {
    name: "",
    email: "",
    phone: "",
    password: "",
    bank_type: "",
    bank_account: "",
    shop_name: "",
    business_number: "",
  };

  const methods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(NewUserSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentUser) {
        await updateSeller({ ...data, email: currentUser.email });
        toast.success("수정이 완료되었습니다!");
      } else {
        await createSeller(data);
        toast.success("생성이 완료되었습니다!");
      }

      onClose?.();
      onSubmitted?.();
    } catch (error) {
      toast.error(error.message ?? "오류가 발생했습니다.");
      return;
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
              },
            }}
          >
            <Field.Text name="name" label="이름" />
            <Field.Text name="email" label="이메일" />
            <Field.Text name="phone" label="전화번호" />
            <Field.Text
              name="password"
              label="비밀번호"
              placeholder="6자 이상 입력"
              type={showPassword.value ? "text" : "password"}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={showPassword.onToggle} edge="end">
                        <Iconify
                          icon={
                            showPassword.value
                              ? "solar:eye-bold"
                              : "solar:eye-closed-bold"
                          }
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Field.Text name="shop_name" label="매장명" />
            <Field.Text name="business_number" label="사업자등록번호" />

            {/* 은행 선택 필드 */}
            <Field.Select
              name="bank_type"
              label="은행명"
              placeholder="은행을 선택하세요"
            >
              {BankKeys.map((key) => (
                <MenuItem key={key} value={key}>
                  {BankType[key]}
                </MenuItem>
              ))}
            </Field.Select>

            {/* 계좌번호 입력 필드 */}
            <Field.Text
              name="bank_account"
              label="계좌번호"
              placeholder="계좌번호를 입력하세요"
            />
          </Box>

          <Stack sx={{ mt: 3, alignItems: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={isSubmitting}
              size="large"
            >
              {currentUser ? "수정하기" : "등록하기"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
