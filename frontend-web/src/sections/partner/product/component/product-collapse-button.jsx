import { IconButton } from "@mui/material";
import { Iconify } from "src/components/iconify";

export function RenderCollapseButton({ value, onToggle }) {
  return (
    <IconButton onClick={onToggle}>
      <Iconify
        icon={
          value ? "eva:arrow-ios-downward-fill" : "eva:arrow-ios-forward-fill"
        }
      />
    </IconButton>
  );
}
