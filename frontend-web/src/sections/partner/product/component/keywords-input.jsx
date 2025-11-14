import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, Chip, Stack } from "@mui/material";

export const KeywordsInput = ({ value = [], onChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState(value);

  useEffect(() => {
    setTags(value);
  }, [value]);

  // 입력값을 쉼표 기준으로 분리해 태그에 추가
  const handleInputChange = (event, newInput, reason) => {
    // IME 조합 중일 때는 무시
    if (event && (event.isComposing || event.key === "Process")) return;

    if (newInput.endsWith(",")) {
      const newTag = newInput.slice(0, -1).trim();

      if (newTag && !tags.includes(newTag) && tags.length < 20) {
        const newTags = [...tags, newTag];

        setTags(newTags);
        onChange?.(newTags);
      }
      setInputValue("");
    } else {
      setInputValue(newInput);
    }
  };

  // 태그 삭제 처리
  const handleDelete = (tagToDelete) => {
    const newTags = tags.filter((tag) => tag !== tagToDelete);
    setTags(newTags);
    onChange?.(newTags);
  };

  return (
    <Stack spacing={1}>
      <Autocomplete
        multiple
        freeSolo
        options={[]} // 빈 옵션으로 검색 리스트 없음
        open={false} // 드롭다운 안 뜸
        value={tags}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={(e, newValue) => {
          // 직접 태그 클릭해서 삭제, 붙여넣기로도 등록 가능
          if (newValue.length <= 20) {
            setTags(newValue);
            onChange?.(newValue);
          }
        }}
        filterSelectedOptions
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              key={option}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="키워드 (쉼표로 구분, 최대 20개)"
            placeholder="예: 신선,특가,무료배송"
            helperText={`키워드는 고객이 내 상품을 빠르게 찾을 수 있게 합니다. 상품과 관계 없는 검색어는 삭제/변경 될 수 있습니다. (${tags.length}/20)`}
          />
        )}
      />
    </Stack>
  );
};
