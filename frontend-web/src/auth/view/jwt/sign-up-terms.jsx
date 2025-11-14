"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { EmptyContent } from "src/components/empty-content";
import { getLatestTermByType, getTerms } from "src/actions/terms";
import { Markdown } from "src/components/markdown";

const TERMS_CONTENT = {
  terms: {
    title: "서비스 이용약관",
  },
  privacy: {
    title: "개인정보 수집 및 이용",
  },
  marketing: {
    title: "마케팅 목적의 개인정보 수집 및 이용",
  },
};

export function SignUpTerms({
  checks,
  onChangeAll,
  onChangeEach,
  sx,
  ...other
}) {
  const allAgree =
    checks.age && checks.terms && checks.privacy && checks.marketing;

  const [openType, setOpenType] = useState(null); // 'terms' | 'privacy' | 'marketing' | null

  const handleAllAgree = (e) => {
    const checked = e.target.checked;
    onChangeAll(checked);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const openDialog = (type) => () => setOpenType(type);
  const closeDialog = () => setOpenType(null);

  const [term, setTerm] = useState(null);

  useEffect(() => {
    async function fetchTerms() {
      let content = await getLatestTermByType(openType);
      setTerm(content);
    }
    if (openType) fetchTerms();
  }, [openType]);

  const renderTermsDialog = (term) => {
    if (!term) return null;

    const { title, content } = term;

    return (
      <Dialog
        fullWidth
        fullScreen={isMobile}
        open={Boolean(openType)}
        onClose={closeDialog}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {content ? (
            <Box sx={{ mt: 1 }}>
              <Markdown>{content}</Markdown>
            </Box>
          ) : (
            <EmptyContent />
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeDialog}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <FormGroup sx={{ mt: 3, gap: 1, ...sx }} {...other}>
      <FormControlLabel
        control={
          <Checkbox
            checked={allAgree}
            onChange={handleAllAgree}
            sx={{ borderRadius: "50%" }}
          />
        }
        label={<Typography fontWeight="bold">모두 동의합니다</Typography>}
      />

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={checks.age}
              onChange={onChangeEach("age")}
              sx={{ borderRadius: "50%" }}
            />
          }
          label="만 14세 이상입니다."
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={checks.terms}
              onChange={onChangeEach("terms")}
              sx={{ borderRadius: "50%" }}
            />
          }
          label={
            <>
              <Link
                component="button"
                underline="always"
                color="text.primary"
                onClick={openDialog("terms")}
              >
                서비스 이용약관
              </Link>
              에 동의합니다.
            </>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={checks.privacy}
              onChange={onChangeEach("privacy")}
              sx={{ borderRadius: "50%" }}
            />
          }
          label={
            <>
              <Link
                component="button"
                underline="always"
                color="text.primary"
                onClick={openDialog("privacy")}
              >
                개인정보 수집 및 이용
              </Link>
              에 동의합니다.
            </>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={checks.marketing}
              onChange={onChangeEach("marketing")}
              sx={{ borderRadius: "50%" }}
            />
          }
          label={
            <>
              <Link
                component="button"
                underline="always"
                color="text.primary"
                onClick={openDialog("marketing")}
              >
                마케팅 목적의 개인정보 수집 및 이용
              </Link>
              에 동의합니다. (선택)
            </>
          }
        />
      </Box>

      {renderTermsDialog(term)}
    </FormGroup>
  );
}
