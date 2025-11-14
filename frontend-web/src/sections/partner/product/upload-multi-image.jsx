import {
  Box,
  IconButton,
  Typography,
  Stack,
  ImageList,
  ImageListItem,
  Card,
  useMediaQuery,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { styled, useTheme } from "@mui/material/styles";
import { Iconify } from "src/components/iconify";
import { Image } from "src/components/image";
import { toast } from "sonner";

const DropZoneStyle = styled(Box)(({ theme }) => ({
  border: `1px dashed ${theme.palette.divider}`,
  width: "100%",
  aspectRatio: 1,
  borderRadius: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.background.default,
  position: "relative",
  overflow: "hidden",
}));

export default function UploadMultiImage({
  files = [],
  onDrop,
  onRemove,
  maxFiles = 9,
  helperText,
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
    maxFiles,
  });

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const cols = isMdUp ? 5 : 3;

  return (
    <Stack spacing={2}>
      {helperText && (
        <Typography variant="caption" color="text.disabled">
          {helperText}
        </Typography>
      )}

      <ImageList cols={cols} gap={8} sx={{ overflow: "visible" }}>
        <DropZoneStyle {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography variant="body2" color="text.secondary">
              이미지를 여기에 놓으세요
            </Typography>
          ) : (
            <Iconify
              icon={"mingcute:add-line"}
              sx={{ fontSize: 48, color: "text.disabled" }}
            />
          )}
        </DropZoneStyle>
        {files.length > 0 &&
          files.map((file, index) => (
            <Card key={file.preview || file.url || index}>
              <ImageListItem key={index}>
                <Image
                  src={file.preview || file.url || ""}
                  alt={`uploaded-${index}`}
                  loading="lazy"
                  style={{
                    borderRadius: 8,
                    aspectRatio: 1,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => onRemove(file)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.8)" },
                  }}
                >
                  <Iconify icon={"solar:trash-bin-trash-bold"} />
                </IconButton>
              </ImageListItem>
            </Card>
          ))}
      </ImageList>
    </Stack>
  );
}
