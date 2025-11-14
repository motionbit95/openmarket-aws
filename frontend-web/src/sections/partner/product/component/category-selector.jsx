import { useEffect, useState, useRef } from "react";
import { Autocomplete, TextField, Stack } from "@mui/material";
import { categories } from "./category";

// 카테고리 코드로 대분류/중분류 객체를 찾아주는 함수
function findCategoryByCode(code) {
  for (const main of categories.카테고리) {
    if (main.code === code) return { main, sub: null };
    if (main.children) {
      const sub = main.children.find((c) => c.code === code);
      if (sub) return { main, sub };
    }
  }
  return { main: null, sub: null };
}

export const CategorySelector = ({ onChange, initialCode }) => {
  const [mainCategory, setMainCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);

  // 대분류 변경 시 중분류 자동 선택 방지용 ref
  const skipSubAutoSelect = useRef(false);

  // initialCode가 변경될 때마다 main/sub 카테고리 세팅
  useEffect(() => {
    if (initialCode) {
      const { main, sub } = findCategoryByCode(initialCode);
      setMainCategory(main);
      setSubCategory(sub);
    } else {
      setMainCategory(null);
      setSubCategory(null);
    }
  }, [initialCode]);

  // 대분류 변경 시 중분류 자동 초기화, 단 같은 대분류 내에서만 유지
  const handleMainChange = (event, newValue) => {
    setMainCategory(newValue);

    // 대분류에 중분류가 있으면 첫 번째 중분류 자동 선택
    if (newValue && newValue.children && newValue.children.length > 0) {
      const firstSub = newValue.children[0];
      setSubCategory(firstSub);
      onChange?.({
        main: newValue.name,
        middle: firstSub.name,
        code: firstSub.code,
      });
    } else {
      setSubCategory(null);
      onChange?.("");
    }
    skipSubAutoSelect.current = false;
  };

  // 중분류 선택 시 onChange 호출
  const handleSubChange = (event, newValue) => {
    setSubCategory(newValue);

    if (mainCategory && newValue) {
      onChange?.({
        main: mainCategory.name,
        middle: newValue.name,
        code: newValue.code,
      });
    } else {
      onChange?.("");
    }
  };

  // 대분류만 선택하고 중분류가 1개뿐이면 자동 선택 (단, 대분류 변경 직후에는 자동 선택하지 않음)
  // useEffect(() => {
  //   if (
  //     mainCategory &&
  //     mainCategory.children &&
  //     mainCategory.children.length === 1 &&
  //     !subCategory
  //   ) {
  //     if (skipSubAutoSelect.current) {
  //       skipSubAutoSelect.current = false;
  //       return;
  //     }
  //     setSubCategory(mainCategory.children[0]);
  //     onChange?.({
  //       main: mainCategory.name,
  //       middle: mainCategory.children[0].name,
  //       code: mainCategory.children[0].code,
  //     });
  //   }
  // }, [mainCategory, subCategory, onChange]);

  return (
    <Stack
      direction={"row"}
      spacing={2}
      sx={{ alignItems: "center", width: "100%" }}
    >
      <Autocomplete
        options={categories.카테고리}
        getOptionLabel={(option) => option.name}
        value={mainCategory}
        onChange={handleMainChange}
        renderInput={(params) => (
          <TextField {...params} label="대분류" fullWidth />
        )}
        clearOnEscape
        sx={{ flex: 1, minWidth: 0 }} // flex-grow 하면서 최소 너비 0으로 설정
      />

      <Autocomplete
        options={mainCategory ? mainCategory.children : []}
        getOptionLabel={(option) => option.name}
        value={subCategory}
        onChange={handleSubChange}
        renderInput={(params) => (
          <TextField {...params} label="중분류" fullWidth />
        )}
        disabled={!mainCategory}
        clearOnEscape
        sx={{ flex: 1, minWidth: 0 }}
      />
    </Stack>
  );
};
