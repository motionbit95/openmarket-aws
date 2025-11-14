"use client";

import { z as zod } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";

import { PasswordIcon } from "src/assets/icons";

import { Form, Field } from "src/components/hook-form";

import { FormHead } from "../../components/form-head";
// import { sendPasswordResetEmail } from "../../context/firebase";
import { FormReturnLink } from "../../components/form-return-link";

// ----------------------------------------------------------------------

export const ResetPasswordSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: "이메일을 입력해주세요." })
    .email({ message: "올바른 이메일 형식을 입력해주세요." }),
});

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const router = useRouter();

  const defaultValues = {
    email: "",
  };

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const createRedirectPath = (query) => {
    const queryString = new URLSearchParams({ email: query }).toString();
    return `${paths.auth.firebase.verify}?${queryString}`;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // await sendPasswordResetEmail({ email: data.email });
      // const redirectPath = createRedirectPath(data.email);
      // router.push(redirectPath);
    } catch (error) {
      console.error(error);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: "flex", flexDirection: "column" }}>
      <Field.Text
        autoFocus
        name="email"
        label="이메일 주소"
        placeholder="example@gmail.com"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="요청 전송 중..."
      >
        비밀번호 재설정 메일 보내기
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        icon={<PasswordIcon />}
        title="비밀번호를 잊으셨나요?"
        description={`계정과 연결된 이메일 주소를 입력해 주세요.\n비밀번호 재설정 링크를 보내드립니다.`}
      />

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      {/* <FormReturnLink href={paths.auth.firebase.signIn} /> */}
    </>
  );
}
