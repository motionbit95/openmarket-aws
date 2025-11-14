"use client";
import {
  Box,
  Button,
  Container,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Tooltip,
  IconButton,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Upload } from "src/components/upload";
import { Form } from "src/components/hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { useBoolean } from "minimal-shared/hooks";
import { Iconify } from "src/components/iconify";
import { paths } from "src/routes/paths";
import {
  getSellerSession,
  sendVerification,
  updateSeller,
} from "src/actions/seller";
import axiosInstance from "src/lib/axios";

import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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

const defaultValues = {
  phone: "",
  bank_type: "",
  bank_account: "",
  depositor_name: "",
  business_number: "",
  shop_name: "",
  ceo_name: "",
  files: [],
};

export default function SellerInfoPage() {
  const router = useRouter();
  const showPreview = useBoolean();

  const [form, setForm] = useState(defaultValues);

  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState("");

  const methods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  const handleChange = (field) => (e) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        const res = await axiosInstance.get("/auth/email/status");
        if (res?.data?.email_verified) {
          setEmailVerified(true);
        } else {
          setEmailVerified(false);
        }
      } catch (err) {
        setEmailVerified(false);
        console.error("이메일 인증 상태 확인 실패", err);
      }
    };
    checkEmailStatus();
  }, []);

  const handleSendVerificationEmail = async () => {
    try {
      setEmailSending(true);

      await sendVerification();

      setEmailSent(true);
    } catch (err) {
      console.error("이메일 인증 요청 실패", err);
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setCodeError("인증번호를 입력해주세요.");
      return;
    }

    try {
      setVerifying(true);
      setCodeError("");

      let data = await getSellerSession();

      const response = await axiosInstance.post("/auth/verify-code", {
        email: data.user.email,
        code: verificationCode,
      });

      if (response.data.success) {
        setEmailVerified(true);
        setCodeError("");
      } else {
        setCodeError("인증번호가 올바르지 않습니다.");
      }
    } catch (error) {
      console.error(error);
      setCodeError("인증 중 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = handleSubmit(async () => {
    try {
      const data = new FormData();
      console.log(data);
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      await updateSeller(data);

      router.push(paths.auth.jwt.signupComplete);
    } catch (err) {
      console.error("판매자 정보 제출 실패", err);
    }
  });

  const handleSkip = () => {
    router.push(paths.auth.jwt.signupComplete);
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h5" gutterBottom>
        판매자 정보 입력
      </Typography>
      <Alert severity={"info"} sx={{ whiteSpace: "pre-line" }}>
        {
          "안전한 거래를 위해 판매자 정보를 입력해 주시면 더욱 원활한 진행이 가능합니다.\n지금 입력하지 않으셔도 나중에 언제든지 추가하실 수 있으니 걱정하지 마세요!"
        }
      </Alert>
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          이메일 인증
        </Typography>

        {emailVerified ? (
          <Button
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            variant="contained"
            disabled
            color="success"
            sx={{ mt: 1 }}
          >
            인증 완료
          </Button>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {emailSent
                ? "인증번호를 입력해주세요."
                : "가입하신 이메일로 인증 메일을 보내드립니다."}
            </Typography>

            {!emailSent ? (
              <Button
                variant="outlined"
                onClick={handleSendVerificationEmail}
                disabled={emailSending}
                startIcon={emailSending ? <CircularProgress size={16} /> : null}
              >
                인증 메일 보내기
              </Button>
            ) : (
              <>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="인증번호"
                    variant="outlined"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      setCodeError(""); // 입력 시 에러 제거
                    }}
                    error={!!codeError}
                    helperText={codeError}
                    sx={{ flex: 5 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleVerifyCode}
                    disabled={verifying}
                    sx={{ flex: 1, height: "54px" }} // TextField 높이에 맞춤
                  >
                    인증 확인
                  </Button>
                </Stack>

                <Button
                  variant="text"
                  onClick={handleSendVerificationEmail}
                  disabled={emailSending}
                  sx={{ mt: 1 }}
                >
                  인증 메일 재전송
                </Button>
              </>
            )}
          </>
        )}
      </Box>

      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <Box sx={{ maxWidth: 900, mx: "auto" }}>
            {/* 사업자 정보 */}
            <Typography variant="subtitle1" gutterBottom>
              사업자 정보
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                label="상호"
                value={form.shop_name}
                onChange={handleChange("shop_name")}
              />
              <TextField
                fullWidth
                label="사업자등록번호"
                placeholder="- 포함하여 입력해주세요."
                value={form.business_number}
                onChange={handleChange("business_number")}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                label="대표자명"
                value={form.ceo_name}
                onChange={handleChange("ceo_name")}
              />
              <TextField
                fullWidth
                label="휴대폰 번호"
                placeholder="- 포함하여 입력해주세요."
                value={form.phone}
                onChange={handleChange("phone")}
              />
            </Stack>

            {/* 계좌 정보 */}

            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              계좌 정보
              <Tooltip title="입력한 정보로 정산금이 입금됩니다.">
                <IconButton size="small">
                  <Iconify icon={"solar:info-circle-bold"} />
                </IconButton>
              </Tooltip>
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <TextField
                fullWidth
                label="예금주"
                value={form.depositor_name}
                onChange={handleChange("depositor_name")}
              />
              <TextField
                select
                fullWidth
                label="은행명"
                value={form.bank_type}
                onChange={handleChange("bank_type")}
              >
                {BankKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {BankType[key]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="계좌번호"
                value={form.bank_account}
                onChange={handleChange("bank_account")}
              />
            </Stack>

            {/* 서류 업로드 */}
            <Typography variant="subtitle1" gutterBottom>
              서류 업로드
            </Typography>
            <Box mb={2}>
              <Upload
                multiple
                thumbnail={showPreview.value}
                value={form.files}
                name="uploadFiles"
                onDrop={(newFiles) => {
                  setForm((prev) => ({
                    ...prev,
                    files: [...prev.files, ...Array.from(newFiles)].slice(0, 3), // 최대 3개 제한
                  }));
                }}
                onDelete={(fileToDelete) => {
                  setForm((prev) => ({
                    ...prev,
                    files: prev.files.filter((file) => file !== fileToDelete),
                  }));
                }}
                placeholder={{
                  title: "관련 서류 업로드",
                  description:
                    "사업자등록증 / 통신판매업증 / 통장사본을 업로드해주세요.",
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}
          >
            <Button variant="outlined" color="inherit" onClick={handleSkip}>
              건너뛰기
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!emailVerified || isSubmitting}
              // onClick={() => console.log(form)}
            >
              제출하기
            </Button>
          </Box>
        </form>
      </FormProvider>
    </Container>
  );
}
