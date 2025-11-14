"use client";

import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import SignupComplete from "src/auth/view/jwt/sign-up-complete";
import { paths } from "src/routes/paths";

export default function SignupCompletePage() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push(paths.auth.jwt.signIn);
  };

  return (
    <Box sx={{ margin: "auto", width: "100%", maxWidth: "500px", padding: 4 }}>
      <SignupComplete onGoToLogin={handleGoToLogin} />
    </Box>
  );
}
