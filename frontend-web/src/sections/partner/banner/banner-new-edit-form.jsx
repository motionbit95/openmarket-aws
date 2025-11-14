import { useState } from "react";
import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";

import { Form, Field } from "src/components/hook-form";
import { Upload } from "src/components/upload";
import { createBannerWithUpload, updateBanner } from "src/actions/banner";
import { toast } from "sonner";

const OwnerTypeEnum = {
  ADVERTISER: "광고주",
  SELLER: "판매자",
};

const BannerSchema = zod.object({
  ownerType: zod.enum(["ADVERTISER", "SELLER"], {
    required_error: "소유자 유형을 선택해주세요.",
  }),
  ownerId: zod
    .string()
    .min(1, { message: "이메일을 입력해주세요." })
    .email({ message: "올바른 이메일 형식이 아닙니다." }),
  url: zod.string().url({ message: "유효한 URL을 입력해주세요." }),
  attachmentId: zod.string().min(1, { message: "이미지를 업로드해주세요." }),
});

export function BannerNewEditForm({ currentBanner, onClose, onSubmitted }) {
  const [selectedFile, setSelectedFile] = useState(null); // ✅ 파일 상태

  const previewSrc = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentBanner?.attachmentUrl || "";

  const defaultValues = {
    ownerType: "ADVERTISER",
    ownerId: "",
    url: "",
    attachmentId: "",
  };

  const methods = useForm({
    mode: "onSubmit",
    resolver: zodResolver(BannerSchema),
    defaultValues,
    values: currentBanner,
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentBanner) {
        await updateBanner(currentBanner.id, data);
        toast.success("배너가 수정되었습니다.");
      } else {
        if (!selectedFile) {
          toast.error("이미지를 업로드해주세요.");
          return;
        }

        await createBannerWithUpload(data, selectedFile); // ✅ 파일 전달
        toast.success("배너가 생성되었습니다.");
      }

      onClose?.();
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || "오류가 발생했습니다.");
    }
  });

  // ✅ 이미지 업로드 완료 시 처리
  const handleUploadComplete = (file) => {
    if (file) {
      setSelectedFile(file.file); // File 객체 저장
      setValue("attachmentId", "temp"); // 임시값 (Schema 통과용), 실제 업로드는 createBannerWithUpload에서 처리
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ width: "100%" }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            {/* 첫 번째 줄 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 2fr",
                },
                gap: 2,
              }}
            >
              <Field.Select name="ownerType" label="소유자 유형">
                {Object.entries(OwnerTypeEnum).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text name="ownerId" label="소유자 이메일" />
            </Box>
            {/* 링크 */}
            <Field.Text name="url" label="배너 클릭 링크" fullWidth />
            {/* 이미지 업로드 */}
            <Upload
              name="attachmentUrl"
              accept="image/*"
              multiple={false}
              value={selectedFile}
              onDelete={() => {
                setSelectedFile(null);
                setValue("attachmentId", "");
              }}
              onDropAccepted={(files) => {
                if (files?.[0]) {
                  handleUploadComplete({ file: files[0] });
                }
              }}
              thumbnail={previewSrc}
              placeholder={{
                title: "배너 이미지 업로드",
              }}
              sx={{ width: "520px" }}
            />
          </Box>

          <Stack sx={{ mt: 3, alignItems: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              size="large"
            >
              {currentBanner ? "수정하기" : "등록하기"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
