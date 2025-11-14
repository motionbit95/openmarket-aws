import { useMemo, useCallback, useEffect } from "react";
import { Card, CardHeader, Collapse, Divider, Stack } from "@mui/material";
import { toast } from "sonner";
import UploadMultiImage from "../upload-multi-image";
import { RenderCollapseButton } from "../component/product-collapse-button";
import { useFormContext, useWatch } from "react-hook-form";
import { uploadProductImages } from "src/actions/product";

export default function RenderImages({ openProperties, currentProduct }) {
  const { setValue, control } = useFormContext();
  const formValues = useWatch({ control });
  const images = formValues.images || [];

  // 새로고침/임시저장 복원 시 File 객체의 preview가 없으면 생성
  useEffect(() => {
    if (!Array.isArray(images)) return;
    let changed = false;
    const fixed = images.map((img) => {
      if (img.file && !img.preview) {
        changed = true;
        return { ...img, preview: URL.createObjectURL(img.file) };
      }
      return img;
    });
    if (changed) {
      setValue("images", fixed, { shouldValidate: false });
      console.log(fixed);
    }
  }, [images, setValue]);

  // images 배열에서 대표 이미지와 추가 이미지 분리 (useMemo로 메모이제이션)
  const { representativeImage, additionalImages } = useMemo(() => {
    if (!Array.isArray(images)) {
      return { representativeImage: null, additionalImages: [] };
    }
    const mainImage = images.find((img) => img.isMain) ?? null;
    const others = images.filter((img) => !img.isMain);

    return { representativeImage: mainImage, additionalImages: others };
  }, [images]);

  // 대표 이미지 업로드 (서버 업로드 후 url만 저장, 임시저장일 때는 File 객체 저장)
  const handleDropRepresentativeImage = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) {
        toast.error("대표 이미지 1장을 선택해주세요.");
        return;
      }
      // 상품 생성 전(임시저장)에는 File 객체 자체를 저장
      if (!currentProduct?.id) {
        const file = acceptedFiles[0];
        const updatedImages = [
          {
            url: file.preview || (file.name ? URL.createObjectURL(file) : ""),
            file, // File 객체 저장
            isMain: true,
            sortOrder: 1,
          },
          ...additionalImages.map((img, i) => ({
            ...img,
            sortOrder: i + 2,
            isMain: false,
          })),
        ];
        setValue("images", updatedImages, { shouldValidate: true });
        console.log(updatedImages);
        return;
      }
      // 상품 생성 후에는 서버 업로드
      try {
        const uploaded = await uploadProductImages(currentProduct.id, [
          acceptedFiles[0],
        ]);

        const files = uploaded.files || uploaded || [];
        if (!files || files.length === 0) throw new Error("업로드 실패");
        const url = files[0].url;

        const updatedImages = [
          {
            url,
            isMain: true,
            sortOrder: 1,
          },
          ...additionalImages.map((img, i) => ({
            ...img,
            sortOrder: i + 2,
            isMain: false,
          })),
        ];

        setValue("images", updatedImages, { shouldValidate: true });
        console.log(updatedImages);
        toast.success("대표 이미지 업로드 완료!");
      } catch (err) {
        toast.error("대표 이미지 업로드 실패: " + (err.message || ""));
      }
    },
    [additionalImages, setValue, currentProduct]
  );

  const handleRemoveRepresentativeImage = useCallback(() => {
    const updatedImages = additionalImages.map((img, i) => ({
      ...img,
      sortOrder: i + 1,
      isMain: false,
    }));
    setValue("images", updatedImages, { shouldValidate: true });
    console.log(updatedImages);
  }, [additionalImages, setValue]);

  // 추가 이미지 업로드 (서버 업로드 후 url만 저장, 임시저장일 때는 File 객체 저장)
  const handleDropAdditionalImages = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) {
        toast.error("추가 이미지를 선택하지 않았습니다.");
        return;
      }
      // 상품 생성 전(임시저장)에는 File 객체 자체를 저장
      if (!currentProduct?.id) {
        const combined = [
          ...additionalImages,
          ...acceptedFiles.map((file) => ({
            url: file.preview || (file.name ? URL.createObjectURL(file) : ""),
            file, // File 객체 저장
            isMain: false,
            sortOrder: 0, // 임시, 아래에서 재정렬
          })),
        ];
        if (combined.length > 9) {
          toast.error("최대 9장까지만 업로드할 수 있습니다.");
          return;
        }
        const imagesWithoutMain = combined.map((img, i) => ({
          ...img,
          isMain: false,
          sortOrder: i + 2,
        }));
        const mainImg = representativeImage
          ? [
              {
                ...representativeImage,
                sortOrder: 1,
                isMain: true,
              },
            ]
          : [];
        setValue("images", [...mainImg, ...imagesWithoutMain], {
          shouldValidate: true,
        });
        console.log([...mainImg, ...imagesWithoutMain]);
        return;
      }
      // 상품 생성 후에는 서버 업로드
      try {
        const uploaded = await uploadProductImages(
          currentProduct.id,
          acceptedFiles
        );
        const files = uploaded.files || uploaded || [];
        if (!files || files.length === 0) throw new Error("업로드 실패");
        const combined = [...additionalImages, ...files];
        if (combined.length > 9) {
          toast.error("최대 9장까지만 업로드할 수 있습니다.");
          return;
        }
        const imagesWithoutMain = combined.map((file, i) => ({
          url: file.url,
          isMain: false,
          sortOrder: i + 2,
        }));
        const mainImg = representativeImage
          ? [
              {
                url: representativeImage.url,
                isMain: true,
                sortOrder: 1,
              },
            ]
          : [];
        setValue("images", [...mainImg, ...imagesWithoutMain], {
          shouldValidate: true,
        });
        console.log([...mainImg, ...imagesWithoutMain]);
        toast.success("추가 이미지 업로드 완료!");
      } catch (err) {
        toast.error("추가 이미지 업로드 실패: " + (err.message || ""));
      }
    },
    [additionalImages, setValue, representativeImage, currentProduct]
  );

  const handleRemoveAdditionalImage = useCallback(
    (fileToRemove) => {
      const filtered = additionalImages.filter((file) => file !== fileToRemove);
      // images 배열 업데이트 (대표 이미지 유지)
      const imagesWithoutMain = filtered.map((file, i) => ({
        ...file,
        isMain: false,
        sortOrder: i + 2,
      }));
      const mainImg = representativeImage
        ? [
            {
              ...representativeImage,
              isMain: true,
              sortOrder: 1,
            },
          ]
        : [];
      setValue("images", [...mainImg, ...imagesWithoutMain], {
        shouldValidate: true,
      });
      console.log([...mainImg, ...imagesWithoutMain]);
    },
    [additionalImages, setValue, representativeImage]
  );

  return (
    <Card>
      <CardHeader
        title="상품 이미지"
        subheader="대표 이미지 및 추가 이미지를 업로드하세요."
        action={
          <RenderCollapseButton
            value={openProperties.value}
            onToggle={openProperties.onToggle}
          />
        }
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />
        <Stack spacing={3} sx={{ p: 3 }}>
          <UploadMultiImage
            files={representativeImage ? [representativeImage] : []}
            onDrop={handleDropRepresentativeImage}
            onRemove={handleRemoveRepresentativeImage}
            maxFiles={1}
            helperText="대표 이미지를 업로드 해주세요."
          />

          <UploadMultiImage
            files={additionalImages}
            onDrop={handleDropAdditionalImages}
            onRemove={handleRemoveAdditionalImage}
            maxFiles={9}
            helperText="최대 9장의 추가 이미지를 업로드할 수 있습니다."
          />
        </Stack>
      </Collapse>
    </Card>
  );
}
