import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBoolean } from "minimal-shared/hooks";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";
import { toast } from "src/components/snackbar";
import { Form } from "src/components/hook-form";
import RenderDetails from "./card/product-card-details";
import RenderImages from "./card/product-card-images";
import RenderPricing from "./card/product-card-pricing";
import RenderOptions from "./card/product-card-options";
import RenderActions from "./component/product-action-buttons";
import {
  useSyncProductPrice,
  useProductTempSave,
  formatDateTime,
} from "./hook/product-hook";
import {
  createProduct,
  updateProduct,
  uploadTempAttachments,
} from "src/actions/product";
import RenderTempSavedDialog from "./component/render-temp-saved-dialog";
import { getSellerSession } from "src/actions/seller";
import { Box, Button, Tooltip } from "@mui/material";
import Popover from "@mui/material/Popover";
import { Iconify } from "src/components/iconify";
import ProductCardNoticeInfo from "./card/product-card-notice-info";

export const NewProductSchema = zod.object({
  categoryCode: zod.string().min(1, { message: "카테고리를 선택해주세요." }),
  displayName: zod.string().min(1, { message: "노출상품명을 입력해주세요." }),
  internalName: zod.string().min(0, { message: "등록상품명을 입력해주세요." }), // 빈 문자열 허용
  keywords: zod.array(zod.string()).min(0), // 빈 배열 허용, 별도 메시지 없음
  description: zod.string(), // 빈 문자열 허용, 별도 메시지 없음
  isSingleProduct: zod.boolean(), // 추가
  images: zod
    .array(
      zod.object({
        url: zod.string().url(),
        isMain: zod.boolean().optional(),
        sortOrder: zod.number().optional(),
        file: zod.any().optional(), // File 객체는 타입 any로 처리
      })
    )
    .optional(),
  options: zod
    .array(
      zod.object({
        id: zod.string(), // Date.now().toString()
        name: zod.string().optional(), // 옵션명
        values: zod.string().optional(), // 콤마 구분된 옵션값
        stockMap: zod.record(zod.any()).optional(), // 재고 매핑, 세부 타입 정의 가능
      })
    )
    .optional(),
  prices: zod
    .object({
      originalPrice: zod.number({ coerce: true }).nullable().optional(),
      salePrice: zod.number({ coerce: true }).nullable().optional(),
      discountRate: zod.number({ coerce: true }).nullable().optional(),
    })
    .optional(),
  stockQuantity: zod.number({ coerce: true }).nullable().optional(),
  infoNotices: zod.array(zod.unknown()).optional(),
  saleStatus: zod.string().min(1, { message: "판매상태를 선택해주세요." }),
  displayStatus: zod.string().min(1, { message: "전시상태를 선택해주세요." }),
});

const DEFAULT_FORM_VALUES = {
  categoryCode: "", // 카테고리코드
  displayName: "", // 노출상품명
  internalName: "", // 등록상품명
  keywords: [],
  description: "",
  isSingleProduct: true, // 기본값 true
  images: [],
  options: [],
  infoNotices: [],
  prices: {
    originalPrice: null,
    salePrice: null,
    discountRate: null,
  },
  stockQuantity: null,
  saleStatus: "WAITING",
  displayStatus: "HIDDEN",
};

function ClickHelp() {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          ml: 1,
          cursor: "pointer",
          display: "inline",
          textDecoration: "underline dotted",
        }}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-describedby="option-help-popover"
      >
        도움말
      </Typography>
      <Popover
        id="option-help-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: { p: 2, maxWidth: 260 },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          물류 입고 정보가 옵션별로 다른 경우에는 '옵션상품'을 선택해주세요.
        </Typography>
      </Popover>
    </>
  );
}

export function ProductNewEditForm({ currentProduct }) {
  const router = useRouter();

  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);
  const openPricing = useBoolean(true);
  const openOptions = useBoolean(true);

  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [salePeriodEnabled, setSalePeriodEnabled] = useState(false);

  // react-hook-form 세팅 (currentProduct 있을 경우 초기값으로 세팅)
  const methods = useForm({
    resolver: zodResolver(NewProductSchema),
    defaultValues: currentProduct
      ? {
          ...DEFAULT_FORM_VALUES,
          ...currentProduct,
          // keywords는 이미 ProductCreateView에서 변환됨
        }
      : DEFAULT_FORM_VALUES,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty },
    getValues,
    setValue,
    watch,
  } = methods;

  // isSingleProduct를 form에서 watch
  const isSingleProduct = watch("isSingleProduct");

  // 가격 동기화 커스텀 훅 사용
  useSyncProductPrice(methods);

  // 임시저장 관련 커스텀 훅 사용
  const {
    tempSaveInfo,
    showRestoreDialog,
    lastSavedAt,
    isTempSaved,
    setIsTempSaved,
    setShowRestoreDialog,
    handleTempSave,
    handleRestoreTempSave,
    handleRemoveTempSave,
  } = useProductTempSave({
    currentProduct,
    getValues,
    setValue,
    reset,
    DEFAULT_FORM_VALUES,
    toast,
  });

  // 폼 변경 감지하여 임시저장 안한 상태 추적
  useEffect(() => {
    if (currentProduct) return; // 수정모드에서는 경고 불필요
    setIsTempSaved(false);
  }, [isDirty, currentProduct, setIsTempSaved]);

  // 새로고침/이동 경고 등록
  useEffect(() => {
    if (currentProduct) return; // 수정모드에서는 경고 불필요

    const handleBeforeUnload = (e) => {
      if (!isTempSaved && isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTempSaved, isDirty, currentProduct]);

  // 등록/수정 시 임시저장 삭제
  const onSubmit = handleSubmit(async (data) => {
    let sellerId = null;
    try {
      if (typeof getSellerSession === "function") {
        const session = await getSellerSession();
        sellerId = session?.user?.id || null;
      }
    } catch {
      sellerId = null;
    }

    // 1. images 처리: File 객체는 업로드하고 URL로 변환
    console.log(data.images);
    let images = data.images || [];
    const filesToUpload = images
      .filter((img) => img.file)
      .map((img) => img.file);

    let uploadedFiles = [];
    if (filesToUpload.length > 0) {
      try {
        uploadedFiles = await uploadTempAttachments(filesToUpload, sellerId);
      } catch (err) {
        toast.error("이미지 업로드 실패: " + (err.message || ""));
        return; // 업로드 실패시 제출 중단
      }
    }

    console.log(uploadedFiles);

    // 2. 업로드된 URL로 images 배열 변환
    const imagesWithUrl = images.map((img, idx) => {
      if (img.file) {
        // 업로드된 파일의 URL 매칭 (순서 보장 가정)
        return {
          url: uploadedFiles.files[idx]?.url || "",
          isMain: img.isMain ?? idx === 0,
          sortOrder: img.sortOrder ?? idx + 1,
        };
      }
      // 기존 URL 이미지는 그대로
      return {
        url: img.url,
        isMain: img.isMain ?? idx === 0,
        sortOrder: img.sortOrder ?? idx + 1,
      };
    });

    // 3. 업데이트된 데이터 준비
    const updatedData = {
      ...data, // isSingleProduct 포함됨
      keywords: JSON.stringify(data.keywords || []),
      taxes: includeTaxes ? DEFAULT_FORM_VALUES.taxes : data.taxes,
      sellerId,
      images: imagesWithUrl,
    };

    console.log(updatedData);

    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, updatedData, sellerId);
      } else {
        await createProduct(updatedData, sellerId);
      }

      reset();
      localStorage.removeItem("product_new_edit_temp_save");
      setIsTempSaved(true);

      toast.success(
        currentProduct ? "수정이 완료되었습니다!" : "등록이 완료되었습니다!"
      );
      router.push(paths.dashboard.partner.product.list);
    } catch (error) {
      console.error(error);
      toast.error("저장에 실패했습니다.");
    }
  });

  // 마지막 임시저장 시각 표시용 컴포넌트
  function LastSavedAtInfo() {
    if (!lastSavedAt) return null;
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, textAlign: "right" }}
      >
        마지막 임시저장: {formatDateTime(lastSavedAt)}
      </Typography>
    );
  }

  return (
    <>
      <RenderTempSavedDialog
        open={showRestoreDialog}
        onClose={handleRemoveTempSave}
        onRestore={handleRestoreTempSave}
        tempSaveInfo={tempSaveInfo}
        formatDateTime={formatDateTime}
      />
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: "auto" }}>
          <LastSavedAtInfo />
          <RenderActions
            handleTempSave={handleTempSave}
            isSubmitting={isSubmitting}
            currentProduct={currentProduct}
          />
          <RenderDetails
            openDetails={openDetails}
            currentProduct={currentProduct}
            salePeriodEnabled={salePeriodEnabled}
            setSalePeriodEnabled={setSalePeriodEnabled}
          />
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="subtitle2">상품 유형</Typography>
            <Tooltip
              title="옵션별로 물류 입고 정보가 다르다면 '옵션상품'을 선택하세요."
              arrow
              placement="bottom"
            >
              <Iconify
                icon="eva:info-outline"
                width={18}
                sx={{ color: "text.secondary", ml: 0.5, cursor: "pointer" }}
              />
            </Tooltip>
            <Stack direction="row" spacing={1}>
              <Button
                variant={isSingleProduct ? "contained" : "outlined"}
                color={isSingleProduct ? "primary" : "inherit"}
                size="small"
                onClick={() => setValue("isSingleProduct", true)}
                sx={{ minWidth: 90 }}
              >
                단일상품
              </Button>
              <Button
                variant={!isSingleProduct ? "contained" : "outlined"}
                color={!isSingleProduct ? "primary" : "inherit"}
                size="small"
                onClick={() => setValue("isSingleProduct", false)}
                sx={{ minWidth: 90 }}
              >
                옵션상품
              </Button>
            </Stack>
          </Stack>

          <Box>
            {isSingleProduct ? (
              <RenderPricing openPricing={openPricing} />
            ) : (
              <RenderOptions openOptions={openOptions} />
            )}
          </Box>
          <RenderImages
            openProperties={openProperties}
            currentProduct={currentProduct}
          />
          <ProductCardNoticeInfo categoryCode={watch("categoryCode")} />
          <RenderActions
            handleTempSave={handleTempSave}
            isSubmitting={isSubmitting}
            currentProduct={currentProduct}
          />
        </Stack>
      </Form>
    </>
  );
}
