import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input/input";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";

import { useRouter } from "src/routes/hooks";

import { Form, Field, schemaHelper } from "src/components/hook-form";
import { useBoolean } from "minimal-shared/hooks";
import { IconButton, InputAdornment } from "@mui/material";
import { Iconify } from "src/components/iconify";
import { createUser, updateUser } from "src/actions/user";
import { toast } from "sonner";

// ----------------------------------------------------------------------

// 신규 생성 스키마 (비밀번호 필수)
const NewUserSchema = zod.object({
  user_name: zod.string().min(1, { message: "이름을 입력해주세요." }),
  user_id: zod
    .string()
    .min(1, { message: "아이디(이메일)를 입력해주세요." })
    .email({ message: "유효한 이메일 주소를 입력해주세요." }),
  phone: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  password: zod.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

// 수정 스키마 (비밀번호 제외)
const EditUserSchema = zod.object({
  user_name: zod.string().min(1, { message: "이름을 입력해주세요." }),
  user_id: zod
    .string()
    .min(1, { message: "아이디(이메일)를 입력해주세요." })
    .email({ message: "유효한 이메일 주소를 입력해주세요." }),
  phone: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  mileage: zod.number().min(0, { message: "마일리지는 0 이상이어야 합니다." }),
});

// ----------------------------------------------------------------------

export function UserNewEditForm({ currentUser, onClose, onSubmitted }) {
  const router = useRouter();
  const showPassword = useBoolean();

  const defaultValues = {
    user_name: "",
    user_id: "",
    phone: "",
    password: "",
    mileage: 0,
  };

  // currentUser가 있을 때 email을 user_id로 매핑
  const formValues = currentUser
    ? {
        ...currentUser,
        user_id: currentUser.email || currentUser.user_id || "",
      }
    : undefined;

  const methods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(currentUser ? EditUserSchema : NewUserSchema),
    defaultValues,
    values: formValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentUser) {
        // ACTION - updateUser
        await updateUser(currentUser.id, data);
        toast.success("수정이 완료되었습니다!");
      } else {
        // ACTION - createUser
        await createUser(data);
        toast.success("생성이 완료되었습니다!");
      }

      onClose?.(); // 다이얼로그 닫기
      onSubmitted?.(); // 페이지 리셋
    } catch (error) {
      // console.error("회원 등록/수정 중 오류 발생:", error);
      toast.error(error.message);
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
            <Field.Text name="user_name" label="이름" />
            <Field.Text
              name="user_id"
              label="아이디(이메일)"
              disabled={!!currentUser}
            />
            <Field.Text name="phone" label="전화번호" />
            <Field.Text
              name="mileage"
              label="마일리지"
              type="number"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  inputProps: { min: 0, step: 100 },
                },
              }}
            />
            {/* 수정 모드일 때는 비밀번호 필드 숨김 */}
            {!currentUser && (
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
            )}
          </Box>

          {/* 버튼을 form 내에 넣기 */}
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
