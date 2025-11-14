"use client";
import PhoneNumberInput from "react-phone-number-input/input";
import { useCallback } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { inputBaseClasses } from "@mui/material/InputBase";

// ----------------------------------------------------------------------

export function PhoneInput({
  sx,
  size,
  value,
  label,
  onChange,
  placeholder,
  variant = "outlined",
  ...other
}) {
  const hasLabel = !!label;

  const cleanValue = value?.replace(/[\s-]+/g, "");

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <Box
      sx={[
        {
          position: "relative",
          [`& .${inputBaseClasses.input}`]: {
            pl: 1,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <PhoneNumberInput
        size={size}
        label={label}
        value={cleanValue}
        variant={variant}
        onChange={onChange}
        hiddenLabel={!label}
        inputComponent={CustomInput}
        {...other}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

function CustomInput({ ref, ...other }) {
  return <TextField inputRef={ref} {...other} />;
}
