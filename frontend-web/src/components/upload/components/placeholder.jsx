import { mergeClasses } from "minimal-shared/utils";

import { styled } from "@mui/material/styles";

import { createClasses } from "src/theme/create-classes";
import { UploadIllustration } from "src/assets/illustrations";

// ----------------------------------------------------------------------

const uploadPlaceholderClasses = {
  root: createClasses("upload__placeholder__root"),
  content: createClasses("upload__placeholder__content"),
  title: createClasses("upload__placeholder__title"),
  description: createClasses("upload__placeholder__description"),
};

export function UploadPlaceholder({
  sx,
  className,
  title = "파일을 선택하거나 드래그하세요",
  description = (
    <>
      파일을 이곳에 드롭하거나
      <span>찾아보기</span>를 클릭해 선택하세요.
    </>
  ),
  ...other
}) {
  return (
    <PlaceholderRoot
      className={mergeClasses([uploadPlaceholderClasses.root, className])}
      sx={sx}
      {...other}
    >
      <UploadIllustration hideBackground sx={{ width: 100 }} />
      <PlaceholderContent>
        <div className={uploadPlaceholderClasses.title}>{title}</div>
        <div className={uploadPlaceholderClasses.description}>
          {description}
        </div>
      </PlaceholderContent>
    </PlaceholderRoot>
  );
}

// ----------------------------------------------------------------------

const PlaceholderRoot = styled("div")(() => ({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  justifyContent: "center",
}));

const PlaceholderContent = styled("div")(({ theme }) => ({
  display: "flex",
  textAlign: "center",
  gap: theme.spacing(1),
  flexDirection: "column",
  [`& .${uploadPlaceholderClasses.title}`]: { ...theme.typography.h6 },
  [`& .${uploadPlaceholderClasses.description}`]: {
    ...theme.typography.body2,
    color: theme.vars.palette.text.secondary,
    "& span": {
      textDecoration: "underline",
      margin: theme.spacing(0, 0.5),
      color: theme.vars.palette.primary.main,
    },
  },
}));
