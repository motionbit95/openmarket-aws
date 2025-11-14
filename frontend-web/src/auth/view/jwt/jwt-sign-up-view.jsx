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

import { signUp } from "../../context/jwt";
import { useAuthContext } from "../../hooks";
import { getErrorMessage } from "../../utils";
import { FormHead } from "../../components/form-head";
import { SignUpTerms } from "./sign-up-terms";

// ----------------------------------------------------------------------

export const SignUpSchema = zod
  .object({
    name: zod.string().min(1, { message: "이름을 입력해주세요." }),
    email: zod
      .string()
      .min(1, { message: "이메일을 입력해주세요." })
      .email({ message: "유효한 이메일 주소를 입력해주세요." }),
    password: zod
      .string()
      .min(1, { message: "비밀번호를 입력해주세요." })
      .min(6, { message: "비밀번호는 최소 6자 이상이어야 합니다." }),
    passwordConfirm: zod
      .string()
      .min(1, { message: "비밀번호 확인이 필요합니다." }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않습니다.",
  });

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState("");

  const defaultValues = {
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  };

  const [agreements, setAgreements] = useState({
    age: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleAgreementChange = (key) => (e) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: e.target.checked,
    }));
  };

  const handleAllAgreement = (checked) => {
    setAgreements({
      age: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const requiredAgreed =
    agreements.age && agreements.terms && agreements.privacy;

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // 회원가입 성공 후 seller-info 페이지로 이동
      router.push(paths.auth.jwt.sellerInfo);
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      <Field.Text
        name="name"
        label="이름"
        placeholder="이름을 입력해주세요."
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Field.Text
        name="email"
        label="이메일 주소"
        placeholder="유효한 이메일 주소를 입력해주세요."
        slotProps={{ inputLabel: { shrink: true } }}
      />

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

      <Field.Text
        name="passwordConfirm"
        label="비밀번호 확인"
        placeholder="비밀번호를 다시 입력해주세요"
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
  );

  return (
    <>
      <FormHead
        title={`회원가입하고\n비즈니스 성공을 시작해보세요!`}
        description={
          <>
            {`이미 계정이 있으신가요? `}
            <Link
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              variant="subtitle2"
            >
              로그인하기
            </Link>
          </>
        }
        sx={{ textAlign: { xs: "center", md: "left" } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
        <SignUpTerms
          checks={agreements}
          onChangeAll={handleAllAgreement}
          onChangeEach={handleAgreementChange}
        />

        <Button
          fullWidth
          color="inherit"
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          loadingIndicator="계정 생성 중..."
          sx={{ mt: 4 }}
          disabled={
            !methods.formState.isValid ||
            !(agreements.age && agreements.terms && agreements.privacy)
          }
        >
          계정 생성하기
        </Button>
      </Form>
    </>
  );
}
