"use client";

import { z as zod } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useBoolean } from "minimal-shared/hooks";
import { zodResolver } from "@hookform/resolvers/zod";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";
import { RouterLink } from "src/routes/components";

import { Iconify } from "src/components/iconify";
import { Form, Field } from "src/components/hook-form";

import { useAuthContext } from "../../hooks";
import { getErrorMessage } from "../../utils";
import { FormHead } from "../../components/form-head";
import { signInWithAdminID, signInWithPassword } from "../../context/jwt";
import { Logo } from "src/components/logo";
import { Divider, Stack, Typography } from "@mui/material";

// ----------------------------------------------------------------------
// 로그인 유효성 검사 스키마 정의
export const SignInSchema = zod
  .object({
    id: zod.string().optional(),
    email: zod
      .string()
      .optional()
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "유효한 이메일 형식을 입력해 주세요!",
      }),
    password: zod
      .string()
      .min(1, { message: "비밀번호를 입력해 주세요!" })
      .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다!" }),
  })
  .refine((data) => !!data.id || !!data.email, {
    message: "아이디 또는 이메일 중 하나를 입력해 주세요!",
    path: ["id"],
  });

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");

  // 기본 로그인 정보 (데모용)
  const defaultValues = {
    id: "",
    email: "",
    password: "",
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // 로그인 시도
  const onSubmit = handleSubmit(async (data) => {
    try {
      {
        process.env.NEXT_PUBLIC_BUILD_MODE === "admin"
          ? await signInWithAdminID({
              adminId: data.id,
              adminPw: data.password,
            })
          : await signInWithPassword({
              email: data.email,
              password: data.password,
            });
      }
      await checkUserSession?.();
      router.refresh(); // 로그인 후 페이지 갱신
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  // 로그인 폼 UI 렌더링
  const renderForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      <Field.Text
        name="email"
        label="이메일 주소"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 1.5, display: "flex", flexDirection: "column" }}>
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

        <Stack direction={"row"} sx={{ gap: 2, justifyContent: "flex-end" }}>
          {/* <Link
            component={RouterLink}
            href={paths.auth.jwt.findId}
            variant="body2"
            color="inherit"
            sx={{ alignSelf: "flex-end" }}
          >
            아이디찾기
          </Link> */}
          {/* <Link
            component={RouterLink}
            href={paths.auth.jwt.resetPassword}
            variant="body2"
            color="inherit"
            sx={{ alignSelf: "flex-end" }}
          >
            비밀번호찾기
          </Link> */}
        </Stack>
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="로그인 중..."
      >
        로그인
      </Button>
    </Box>
  );

  const renderAdminForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      <Field.Text
        name="id"
        label="아이디"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 1.5, display: "flex", flexDirection: "column" }}>
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
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="로그인 중..."
      >
        로그인
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          ml: 3,
          mb: 3,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        }}
      >
        <Logo sx={{ width: 100, height: 100 }} />
      </Box>
      {process.env.NEXT_PUBLIC_BUILD_MODE === "admin" ? (
        <FormHead
          title="관리자 로그인"
          description={"오픈마켓 관리자 로그인 화면입니다."}
        />
      ) : (
        <FormHead
          title="판매자 로그인"
          description={
            <>
              아직 계정이 없으신가요?{" "}
              <Link
                component={RouterLink}
                href={paths.auth.jwt.signUp}
                variant="subtitle2"
              >
                회원가입하기
              </Link>
            </>
          }
        />
      )}

      {/* <Alert severity="info" sx={{ mb: 3 }}>
        <strong>{defaultValues.email}</strong>
        {" 이메일과 "}
        <strong>{defaultValues.password}</strong>
        {" 비밀번호를 사용해 보세요."}
      </Alert> */}

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {process.env.NEXT_PUBLIC_BUILD_MODE === "admin"
          ? renderAdminForm()
          : renderForm()}
      </Form>
    </>
  );
}
