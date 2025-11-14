import { useState, useEffect, useCallback } from "react";
import {
  clearTempAttachmentFolder,
  uploadTempAttachments,
} from "src/actions/product";
import { getSellerSession } from "src/actions/seller";

// 옵션 그룹 관리 커스텀 훅
export function useProductOptionGroups(initialOptions = []) {
  const [options, setOptions] = useState(initialOptions);

  const handleChangeGroupName = useCallback((id, name) => {
    setOptions((prev) =>
      prev.map((group) => (group.id === id ? { ...group, name } : group))
    );
  }, []);

  const handleChangeValues = useCallback((id, values) => {
    setOptions((prev) =>
      prev.map((group) => (group.id === id ? { ...group, values } : group))
    );
  }, []);

  const handleChangeStock = useCallback((groupId, optionValue, stock) => {
    setOptions((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== groupId) return group;
        const prevEntry = group.stockMap?.[optionValue] || {};
        return {
          ...group,
          stockMap: {
            ...group.stockMap,
            [optionValue]: {
              ...prevEntry,
              stock: Number(stock),
            },
          },
        };
      })
    );
  }, []);

  const handleChangePrice = useCallback(
    (groupId, optionValue, priceType, priceValue) => {
      setOptions((prevGroups) =>
        prevGroups.map((group) => {
          if (group.id !== groupId) return group;
          const prevEntry = group.stockMap?.[optionValue] || {};
          return {
            ...group,
            stockMap: {
              ...group.stockMap,
              [optionValue]: {
                ...prevEntry,
                [priceType]: Number(priceValue),
              },
            },
          };
        })
      );
    },
    []
  );

  const handleAddOptionGroup = useCallback(() => {
    setOptions((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", values: "", stockMap: {} },
    ]);
  }, []);

  const handleRemoveOptionGroup = useCallback((id) => {
    setOptions((prev) => prev.filter((group) => group.id !== id));
  }, []);

  return {
    options,
    onChangeGroupName: handleChangeGroupName,
    onChangeValues: handleChangeValues,
    onChangeStock: handleChangeStock,
    onChangePrice: handleChangePrice,
    onAddOptionGroup: handleAddOptionGroup,
    onRemoveOptionGroup: handleRemoveOptionGroup,
  };
}

// 가격, 할인율, 판매가 동기화 커스텀 훅
export function useSyncProductPrice({ watch, setValue }) {
  const price = watch("price");
  const priceSale = watch("priceSale");
  const discountRate = watch("discountRate");

  useEffect(() => {
    if (price == null || price <= 0) {
      setValue("priceSale", null, { shouldValidate: true });
      setValue("discountRate", null, { shouldValidate: true });
      return;
    }
    if (priceSale != null && priceSale >= 0) {
      const rate = Math.floor(((price - priceSale) / price) * 100);
      if (rate !== discountRate) {
        setValue("discountRate", rate, { shouldValidate: true });
      }
    } else if (discountRate != null && discountRate >= 0) {
      const sale = Math.floor(price * (1 - discountRate / 100));
      if (sale !== priceSale) {
        setValue("priceSale", sale, { shouldValidate: true });
      }
    }
  }, [price, priceSale, discountRate, setValue]);
}

// 날짜 포맷 유틸
export function formatDateTime(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// 임시저장 관련 커스텀 훅
export function useProductTempSave({
  currentProduct,
  getValues,
  setValue,
  reset,
  DEFAULT_FORM_VALUES,
  toast,
}) {
  const TEMP_SAVE_KEY = "product_new_edit_temp_save";
  const [tempSaveInfo, setTempSaveInfo] = useState(null); // { values, savedAt }
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isTempSaved, setIsTempSaved] = useState(true);

  // 임시저장 불러오기 다이얼로그 및 localStorage 체크
  useEffect(() => {
    if (currentProduct) return; // 수정모드에서는 임시저장 불필요
    try {
      const temp = localStorage.getItem(TEMP_SAVE_KEY);
      if (temp) {
        const parsed = JSON.parse(temp);
        setTempSaveInfo(parsed);
        setShowRestoreDialog(true);
      }
    } catch (e) {
      // ignore
    }
  }, [currentProduct]);

  // 임시저장 시각 표시
  useEffect(() => {
    if (tempSaveInfo && tempSaveInfo.savedAt) {
      setLastSavedAt(tempSaveInfo.savedAt);
    }
  }, [tempSaveInfo]);

  // 임시저장 핸들러
  const handleTempSave = useCallback(() => {
    const values = getValues();
    const now = new Date();
    const saveObj = {
      values,
      savedAt: now.toISOString(),
    };

    localStorage.setItem(TEMP_SAVE_KEY, JSON.stringify(saveObj));
    setLastSavedAt(saveObj.savedAt);
    setIsTempSaved(true);

    // images 필드 비동기 업로드 및 url 교체
    const processImages = async () => {
      if (!Array.isArray(values.images)) return;

      const imagesWithFile = values.images
        .map((img, idx) => ({ ...img, _idx: idx }))
        .filter((img) => img.file);

      const files = imagesWithFile.map((img) => img.file);

      let uploaded = [];
      if (files.length > 0) {
        try {
          const { user } =
            typeof getSellerSession === "function"
              ? await getSellerSession()
              : {};
          const id = user?.id;
          uploaded = await uploadTempAttachments(files, id);
        } catch {
          uploaded = [];
        }
      }

      const uploadedFiles = Array.isArray(uploaded?.files)
        ? uploaded.files
        : [];

      const images = values.images.map((img, idx) => {
        const fileIdx = imagesWithFile.findIndex((f) => f._idx === idx);
        let url = img.url;
        if (fileIdx !== -1 && uploadedFiles[fileIdx]?.url) {
          url = uploadedFiles[fileIdx].url;
        }
        if (url && typeof url === "string" && url.startsWith("blob:")) {
          url = uploadedFiles[fileIdx]?.url || null;
        }
        return {
          url,
          isMain: img.isMain ?? idx === 0,
          sortOrder: img.sortOrder ?? idx + 1,
        };
      });

      values.images = images;

      const updatedSaveObj = {
        ...saveObj,
        values: { ...saveObj.values, images },
      };
      localStorage.setItem(TEMP_SAVE_KEY, JSON.stringify(updatedSaveObj));
    };

    processImages();

    console.log(saveObj);

    toast.info(`임시저장되었습니다. (${formatDateTime(saveObj.savedAt)})`);
  }, [getValues, toast]);

  // 임시저장 불러오기
  const handleRestoreTempSave = useCallback(() => {
    if (tempSaveInfo && tempSaveInfo.values) {
      // 불러온 값 콘솔에 출력
      console.log("불러온 임시저장 값:", tempSaveInfo.values);

      reset(tempSaveInfo.values, { keepDefaultValues: true });

      setTimeout(() => {
        // setValue를 통해 모든 필드를 다시 set해도 됨
        Object.entries(tempSaveInfo.values).forEach(([key, value]) => {
          setValue(key, value, { shouldValidate: false, shouldDirty: false });
        });
      }, 0);

      setLastSavedAt(tempSaveInfo.savedAt);
      setIsTempSaved(true); // 임시저장 값 불러왔으니 경고 안함
      toast.success("임시저장된 값을 불러왔습니다.");
    }
    setShowRestoreDialog(false);
  }, [tempSaveInfo, reset, setValue, toast]);

  // 임시저장 삭제
  const handleRemoveTempSave = useCallback(() => {
    localStorage.removeItem(TEMP_SAVE_KEY);
    setTempSaveInfo(null);
    setShowRestoreDialog(false);
    setLastSavedAt(null);
    setIsTempSaved(true); // 임시저장 삭제 후 경고 안함

    // clearTempAttachmentFolder 호출을 비동기로 분리
    (async () => {
      if (typeof clearTempAttachmentFolder === "function") {
        let seller;
        if (typeof getSellerSession === "function") {
          const session = await getSellerSession();
          seller = session?.user;
        }
        const id = seller?.id;
        clearTempAttachmentFolder(id);
      }
    })();
    toast.info("임시저장된 값이 삭제되었습니다.");
  }, [toast]);

  return {
    tempSaveInfo,
    showRestoreDialog,
    lastSavedAt,
    isTempSaved,
    setIsTempSaved,
    setShowRestoreDialog,
    handleTempSave,
    handleRestoreTempSave,
    handleRemoveTempSave,
  };
}
