"use client";
import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Container,
  Button,
  Stack,
  TextField,
  Alert,
  Tooltip,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { DashboardContent } from "src/layouts/dashboard";
import { Iconify } from "src/components/iconify";
import { useBoolean } from "minimal-shared/hooks";
import { useForm, FormProvider } from "react-hook-form";
import { Upload } from "src/components/upload";
import axiosInstance from "src/lib/axios";
import {
  deleteFiles,
  getSellerAttachments,
  getSellerSession,
  sendVerification,
  updateSeller,
  uploadFiles,
} from "src/actions/seller";
import { toast } from "sonner";

// 은행 목록 (src/auth/view/jwt/seller-info.jsx 참고)
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
const BankKeys = Object.keys(BankType);

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

function getDefaultValues(currentSeller) {
  // 참고: currentSeller 없으면 기본값, 있으면 currentSeller 기반으로 초기화
  const base = { ...defaultValues };
  if (!currentSeller) return base;

  // files는 항상 배열로 보장
  return {
    ...base,
    ...currentSeller,
    files: Array.isArray(currentSeller.files) ? currentSeller.files : [],
  };
}

export function MyPageView({ title = "Blank", sx }) {
  const showPreview = useBoolean();

  // react-hook-form
  const methods = useForm({
    mode: "onSubmit",
    defaultValues,
  });
  const {
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;

  // form state (동기화용)
  const [form, setForm] = useState(defaultValues);

  // 이메일 인증 관련 state
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState("");

  // default 값 동기화: currentSeller가 바뀌면 폼 초기화
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        let data = await getSellerSession();

        // data 또는 data.user가 없으면 종료 (getSellerSession returns {user: ...})
        const seller = data?.seller || data?.user;
        if (!data || !seller || !seller.id) {
          console.warn("Seller session data is invalid:", data);
          return;
        }

        let files = await getSellerAttachments(seller.id);

        const existingFiles = files.map((file) => ({
          ...file,
          preview: file.url,
          existing: true,
          name: file.filename,
          size: file.filesize,
        }));

        //   files를 currentSeller에 넣어서 form에 반영
        const sellerWithFiles = {
          ...seller,
          files: Array.isArray(existingFiles) ? existingFiles : [],
        };

        const defaults = getDefaultValues(sellerWithFiles);

        reset(defaults);
        setForm(defaults);
      } catch (error) {
        console.error("Failed to fetch seller data:", error);
      }
    };
    fetchSeller();
    // eslint-disable-next-line
  }, [reset]);

  // react-hook-form 값이 바뀔 때 form state도 동기화
  useEffect(() => {
    const subscription = watch((values) => {
      setForm(values);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // 이메일 인증 상태 확인 (최초 마운트 시)
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
      }
    };
    checkEmailStatus();
  }, []);

  // 이메일 인증 메일 발송
  const handleSendVerificationEmail = async () => {
    try {
      setEmailSending(true);
      await sendVerification();
      setEmailSent(true);
    } catch (err) {
      // console.error("이메일 인증 요청 실패", err);
    } finally {
      setEmailSending(false);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setCodeError("인증번호를 입력해주세요.");
      return;
    }
    try {
      setVerifying(true);
      setCodeError("");
      let data = await getSellerSession();

      const seller = data?.seller || data?.user;
      if (!data || !seller || !seller.email) {
        setCodeError("세션 정보를 가져올 수 없습니다.");
        return;
      }

      const response = await axiosInstance.post("/auth/verify-code", {
        email: seller.email,
        code: verificationCode,
      });
      if (response.data.success) {
        setEmailVerified(true);
        setCodeError("");
      } else {
        setCodeError("인증번호가 올바르지 않습니다.");
      }
    } catch (error) {
      setCodeError("인증 중 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  // 제출
  const onSubmit = handleSubmit(async (values) => {
    try {
      const formData = new FormData();

      // files는 배열이므로 따로 처리
      Object.entries(values).forEach(([key, value]) => {
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => {
            formData.append("files", file);
          });
        } else if (value) {
          formData.append(key, value);
        }
      });

      let data = await getSellerSession();

      const seller = data?.seller || data?.user;
      if (!data || !seller || !seller.id) {
        toast.error("세션 정보를 가져올 수 없습니다.");
        return;
      }

      // 기존 파일 전체 삭제 대신, 새로 추가된 파일만 업로드, 삭제된 파일만 삭제
      const prevAttachments = await getSellerAttachments(seller.id);
      const prevFileIds = (prevAttachments || []).map((file) => file.id);

      // values.files에는 기존 파일(객체: { id, ... })과 새 파일(File)이 섞여 있을 수 있음
      const currentFileIds = (values.files || [])
        .filter((file) => file && typeof file === "object" && "id" in file)
        .map((file) => file.id);

      // 삭제된 파일 id만 추출
      const deletedFileIds = prevFileIds.filter(
        (id) => !currentFileIds.includes(id)
      );
      if (deletedFileIds.length > 0) {
        await deleteFiles({ ids: deletedFileIds });
      }

      // 새로 추가된 File 객체만 업로드
      if (values.files && values.files.length > 0) {
        const realFiles = values.files.filter((file) => file instanceof File);
        if (realFiles.length > 0) {
          await uploadFiles({ sellerId: seller.id, files: realFiles });
        }
      }

      await updateSeller(formData);

      toast.info("판매지 정보 업데이트 완료");
    } catch (err) {
      console.error("판매자 정보 제출 실패", err);
    }
  });

  return (
    <DashboardContent maxWidth="xl" data-testid="blank-view">
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Typography variant="h5" gutterBottom>
          판매자 정보 입력
        </Typography>
        {!emailVerified && (
          <Alert severity={"warning"} sx={{ whiteSpace: "pre-line" }}>
            {"이메일 인증을 진행해주세요."}
          </Alert>
        )}
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
                  startIcon={
                    emailSending ? <CircularProgress size={16} /> : null
                  }
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
                        setCodeError("");
                      }}
                      error={!!codeError}
                      helperText={codeError}
                      sx={{ flex: 5 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyCode}
                      disabled={verifying}
                      sx={{ flex: 1, height: "54px" }}
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
                  onChange={(e) => {
                    setValue("shop_name", e.target.value);
                  }}
                />
                <TextField
                  fullWidth
                  label="사업자등록번호"
                  placeholder="- 포함하여 입력해주세요."
                  value={form.business_number}
                  onChange={(e) => {
                    setValue("business_number", e.target.value);
                  }}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
                <TextField
                  fullWidth
                  label="대표자명"
                  value={form.ceo_name}
                  onChange={(e) => {
                    setValue("ceo_name", e.target.value);
                  }}
                />
                <TextField
                  fullWidth
                  label="휴대폰 번호"
                  placeholder="- 포함하여 입력해주세요."
                  value={form.phone}
                  onChange={(e) => {
                    setValue("phone", e.target.value);
                  }}
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
                  onChange={(e) => {
                    setValue("depositor_name", e.target.value);
                  }}
                />
                <TextField
                  select
                  fullWidth
                  label="은행명"
                  value={form.bank_type}
                  onChange={(e) => {
                    setValue("bank_type", e.target.value);
                  }}
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
                  onChange={(e) => {
                    setValue("bank_account", e.target.value);
                  }}
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
                    const files = [
                      ...(form.files || []),
                      ...Array.from(newFiles),
                    ].slice(0, 3);
                    setValue("files", files, { shouldValidate: true });
                  }}
                  onRemove={(fileToRemove) => {
                    // 동일한 파일이 여러개 있을 때, fileToRemove와 정확히 일치하는 첫번째 항목만 제거
                    const files = [...(form.files || [])];
                    const idx = files.findIndex((file) => {
                      // 기존 파일(객체)와 새 파일(File 객체) 모두 지원
                      if (file === fileToRemove) return true;
                      // 파일 객체일 경우 name/size로 비교
                      if (
                        fileToRemove &&
                        file &&
                        file.name &&
                        fileToRemove.name &&
                        file.size === fileToRemove.size &&
                        file.name === fileToRemove.name
                      ) {
                        return true;
                      }
                      return false;
                    });
                    if (idx !== -1) {
                      files.splice(idx, 1);
                    }
                    setValue("files", files, { shouldValidate: true });
                  }}
                  onDelete={(fileToDelete) => {
                    // onDelete도 지원 (Upload 컴포넌트가 onDelete만 쓸 수도 있으니)
                    const files = (form.files || []).filter(
                      (file) =>
                        file !== fileToDelete &&
                        !(
                          fileToDelete &&
                          file &&
                          file.name &&
                          fileToDelete.name &&
                          file.size === fileToDelete.size &&
                          file.name === fileToDelete.name
                        )
                    );
                    setValue("files", files, { shouldValidate: true });
                  }}
                  placeholder={{
                    title: "관련 서류 업로드",
                    description:
                      "사업자등록증 / 통신판매업증 / 통장사본을 업로드해주세요.",
                  }}
                  showRemove
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="contained"
                type="submit"
                disabled={!emailVerified || isSubmitting}
              >
                제출하기
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Container>
    </DashboardContent>
  );
}
