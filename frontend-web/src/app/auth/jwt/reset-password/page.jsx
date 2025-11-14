import { Box } from "@mui/material";
import { JwtResetPasswordView } from "src/auth/view/jwt/jwt-reset-password-view";
import { CONFIG } from "src/global-config";

// ----------------------------------------------------------------------

export const metadata = {
  title: `Reset password | Firebase - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <Box sx={{ margin: "auto" }}>
      <JwtResetPasswordView />
    </Box>
  );
}
