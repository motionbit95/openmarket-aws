import {
  Box,
  Button,
  Card,
  CardHeader,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Grid,
  Tooltip,
  Switch,
} from "@mui/material";
import { RenderCollapseButton } from "../component/product-collapse-button";
import { Iconify } from "src/components/iconify";
import { useFormContext, useWatch } from "react-hook-form";
import { useMemo } from "react";
import { ItemCaptionIcon } from "src/components/nav-section/horizontal/nav-item";
import { navSectionClasses } from "src/components/nav-section";

function OptionValueTable({
  group,
  optionValues,
  onChangeStock,
  onChangePrice,
  onToggleDisplayStatus,
}) {
  // 4 columns: 옵션값, 최종 옵션가, 재고, 진열여부
  const thStyle = {
    px: 2,
    py: 1,
    borderBottom: "1px solid #eee",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: 14,
    background: "#f5f6f8",
    width: "25%",
    verticalAlign: "middle",
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box
        component="table"
        sx={{
          width: "100%",
          minWidth: 600,
          borderCollapse: "collapse",
          background: "#fafbfc",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box component="thead">
          <Box component="tr">
            <Box component="th" sx={thStyle}>
              옵션값
            </Box>
            <Box component="th" sx={thStyle}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                최종 옵션가
                <Tooltip
                  title={"옵션별 최종 판매가를 입력해주세요."}
                  arrow
                  placement="right"
                  sx={{ ml: 1 }}
                >
                  <ItemCaptionIcon
                    icon="eva:info-outline"
                    className={navSectionClasses.item.caption}
                  />
                </Tooltip>
              </Box>
            </Box>
            <Box component="th" sx={thStyle}>
              재고
            </Box>
            <Box component="th" sx={{ ...thStyle, textAlign: "center" }}>
              진열여부
            </Box>
          </Box>
        </Box>
        <Box component="tbody">
          {optionValues.length === 0 ? (
            <Box component="tr">
              <Box
                component="td"
                colSpan={4}
                sx={{
                  textAlign: "center",
                  color: "text.disabled",
                  py: 3,
                  fontSize: 15,
                }}
              >
                옵션 값을 입력하세요.
              </Box>
            </Box>
          ) : (
            optionValues.map((val) => {
              // 옵션별 진열여부: group.stockMap?.[val]?.displayStatus !== "HIDDEN" (default DISPLAYED)
              const displayStatus =
                group.stockMap?.[val]?.displayStatus ?? "DISPLAYED";
              return (
                <Box component="tr" key={val}>
                  <Box
                    component="td"
                    sx={{
                      px: 2,
                      py: 1,
                      fontWeight: 500,
                      fontSize: 15,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {val}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      px: 2,
                      py: 1,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <TextField
                      aria-label={`${val} 최종 옵션가`}
                      label=""
                      type="number"
                      inputProps={{ min: 0 }}
                      value={group.stockMap?.[val]?.salePrice ?? ""}
                      onChange={(e) =>
                        onChangePrice(
                          group.id,
                          val,
                          "salePrice",
                          e.target.value
                        )
                      }
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      autoComplete="off"
                      placeholder="최종 옵션가"
                      size="small"
                    />
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      px: 2,
                      py: 1,
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <TextField
                      aria-label={`${val} 재고`}
                      label=""
                      type="number"
                      inputProps={{ min: 0 }}
                      value={group.stockMap?.[val]?.stock ?? ""}
                      onChange={(e) =>
                        onChangeStock(group.id, val, e.target.value)
                      }
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      autoComplete="off"
                      placeholder="재고"
                      size="small"
                    />
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      px: 2,
                      py: 1,
                      borderBottom: "1px solid #f0f0f0",
                      textAlign: "center",
                    }}
                  >
                    <Switch
                      checked={displayStatus !== "HIDDEN"}
                      onChange={(e) =>
                        onToggleDisplayStatus(group.id, val, e.target.checked)
                      }
                      color="primary"
                      inputProps={{
                        "aria-label": `${val} 진열여부`,
                      }}
                    />
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function RenderOptions({ openOptions }) {
  const { setValue, control } = useFormContext();
  // useWatch로 options만 감시 (불필요한 리렌더 방지)
  const optionGroups = useWatch({ control, name: "options" }) || [];

  // map 바깥에서 optionValuesList를 useMemo로 한 번만 계산
  const optionValuesList = useMemo(
    () =>
      optionGroups.map((group) =>
        group.values
          ? group.values
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : []
      ),
    [optionGroups]
  );

  const handleChangeGroupName = (id, name) => {
    setValue(
      "options",
      optionGroups.map((group) =>
        group.id === id ? { ...group, name } : group
      ),
      { shouldValidate: true }
    );
  };

  const handleChangeValues = (id, groupValues) => {
    setValue(
      "options",
      optionGroups.map((group) =>
        group.id === id ? { ...group, values: groupValues } : group
      ),
      { shouldValidate: true }
    );
  };

  const handleChangeStock = (groupId, optionValue, stock) => {
    setValue(
      "options",
      optionGroups.map((group) => {
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
      }),
      { shouldValidate: true }
    );
  };

  // Only handle salePrice (최종 옵션가)
  const handleChangePrice = (groupId, optionValue, priceType, priceValue) => {
    if (priceType !== "salePrice") return; // Only allow salePrice
    setValue(
      "options",
      optionGroups.map((group) => {
        if (group.id !== groupId) return group;
        const prevEntry = group.stockMap?.[optionValue] || {};
        return {
          ...group,
          stockMap: {
            ...group.stockMap,
            [optionValue]: {
              ...prevEntry,
              salePrice: Number(priceValue),
            },
          },
        };
      }),
      { shouldValidate: true }
    );
  };

  // 옵션별 진열여부 스위치 핸들러
  const handleToggleDisplayStatus = (groupId, optionValue, checked) => {
    setValue(
      "options",
      optionGroups.map((group) => {
        if (group.id !== groupId) return group;
        const prevEntry = group.stockMap?.[optionValue] || {};
        return {
          ...group,
          stockMap: {
            ...group.stockMap,
            [optionValue]: {
              ...prevEntry,
              displayStatus: checked ? "DISPLAYED" : "HIDDEN",
            },
          },
        };
      }),
      { shouldValidate: true }
    );
  };

  const handleAddOptionGroup = () => {
    setValue(
      "options",
      [
        ...optionGroups,
        {
          id: Date.now().toString(),
          name: "",
          values: "",
          stockMap: {},
          displayStatus: "DISPLAYED", // 기본값 진열
        },
      ],
      { shouldValidate: true }
    );
  };

  const handleRemoveOptionGroup = (id) => {
    setValue(
      "options",
      optionGroups.filter((group) => group.id !== id),
      { shouldValidate: true }
    );
  };

  // 옵션 그룹의 진열 여부 스위치 핸들러 (그룹 전체 숨김/진열)
  // 상단 스위치 제거: 이 함수와 관련 UI 삭제

  return (
    <Card>
      <CardHeader
        title="옵션"
        subheader="상품의 옵션 그룹을 추가하고, 각 옵션별 재고와 최종 옵션가를 한눈에 관리하세요."
        action={
          <RenderCollapseButton
            value={openOptions.value}
            onToggle={openOptions.onToggle}
          />
        }
        sx={{ mb: 3 }}
      />

      <Collapse in={openOptions.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          {optionGroups.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                color: "text.secondary",
                background: "#f8fafd",
                border: "1px dashed #dbe3ea",
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                아직 옵션 그룹이 없습니다.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                예시: <b>사이즈</b> 그룹에 <b>S, M, L</b> 옵션값을 추가해보세요.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleAddOptionGroup}
                startIcon={<Iconify icon="solar:add-circle-bold" />}
              >
                옵션 그룹 추가
              </Button>
            </Paper>
          )}

          {optionGroups.map((group, idx) => {
            const optionValues = optionValuesList[idx];

            return (
              <Paper
                key={group.id}
                elevation={2}
                sx={{
                  p: 3,
                  position: "relative",
                  borderRadius: 2,
                  border: "1px solid #e3e8ef",
                  background: "#fff",
                }}
              >
                {/* 옵션 그룹 삭제 버튼 오른쪽 상단 */}
                <Tooltip title="옵션 그룹 삭제">
                  <IconButton
                    color="error"
                    aria-label="옵션 그룹 삭제"
                    onClick={() => handleRemoveOptionGroup(group.id)}
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      zIndex: 2,
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>

                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="옵션 그룹명"
                      value={group.name}
                      onChange={(e) =>
                        handleChangeGroupName(group.id, e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      autoComplete="off"
                      placeholder="예: 사이즈, 색상"
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="옵션 값들 (쉼표로 구분)"
                      value={group.values}
                      onChange={(e) =>
                        handleChangeValues(group.id, e.target.value)
                      }
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                      placeholder="예: S, M, L"
                      autoComplete="off"
                    />
                  </Grid>
                  {/* 상단 스위치 제거, 헤더와 정렬 맞춤 */}
                </Grid>

                <OptionValueTable
                  group={group}
                  optionValues={
                    // 옵션 그룹이 숨김이어도 옵션값은 항상 보여줌
                    optionValues
                  }
                  onChangeStock={handleChangeStock}
                  onChangePrice={handleChangePrice}
                  onToggleDisplayStatus={handleToggleDisplayStatus}
                />
              </Paper>
            );
          })}

          {optionGroups.length > 0 && (
            <Button
              variant="outlined"
              size="large"
              onClick={handleAddOptionGroup}
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              sx={{ alignSelf: "flex-start", mt: 1 }}
            >
              옵션 그룹 추가
            </Button>
          )}
        </Stack>
      </Collapse>
    </Card>
  );
}
