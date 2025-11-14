import {
  Card,
  CardHeader,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormContext } from "react-hook-form";
import NOTICE_FIELDS_BY_CATEGORY from "./notice-fields-by-category";

// infoNotices는 ProductInfoNotice[] 배열임
// ProductInfoNotice: { id, productId, name, value }

export default function ProductCardNoticeInfo({ categoryCode }) {
  const { setValue, watch } = useFormContext();
  const fields =
    (categoryCode && NOTICE_FIELDS_BY_CATEGORY[categoryCode]) ||
    NOTICE_FIELDS_BY_CATEGORY.DEFAULT ||
    [];

  // infoNotices는 배열임
  const infoNotices = watch("infoNotices") || [];

  // name으로 infoNotices를 빠르게 찾기 위한 맵
  const infoNoticesMap = {};
  infoNotices?.forEach((notice) => {
    infoNoticesMap[notice.name] = notice;
  });

  // 특정 name의 value를 가져오는 함수
  const getNoticeValue = (name) => {
    return infoNoticesMap[name]?.value || "";
  };

  // 특정 name의 id를 가져오는 함수 (있으면)
  const getNoticeId = (name) => {
    return infoNoticesMap[name]?.id;
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (name, value) => {
    // 이미 해당 name이 있으면 value만 변경, 없으면 새로 추가
    const idx = infoNotices.findIndex((n) => n.name === name);
    let newInfoNotices;
    if (idx !== -1) {
      newInfoNotices = [
        ...infoNotices.slice(0, idx),
        {
          ...infoNotices[idx],
          value,
        },
        ...infoNotices.slice(idx + 1),
      ];
    } else {
      newInfoNotices = [
        ...infoNotices,
        {
          id: undefined, // 새로 추가하는 경우 id는 undefined (DB 저장시 생성)
          productId: undefined,
          name,
          value,
        },
      ];
    }
    setValue("infoNotices", newInfoNotices, { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader
        title="상품정보제공 고시"
        subheader="카테고리별로 필수 고시 항목을 입력하세요."
        sx={{ mb: 3 }}
      />
      <Divider />
      <Stack spacing={2} sx={{ p: 3 }}>
        {fields.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            해당 카테고리의 고시 항목이 없습니다.
          </Typography>
        ) : (
          fields.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              value={getNoticeValue(field.name)}
              onChange={(e) => {
                handleFieldChange(field.name, e.target.value);
              }}
              required={field.required}
              fullWidth
              variant="outlined"
            />
          ))
        )}
      </Stack>
    </Card>
  );
}
