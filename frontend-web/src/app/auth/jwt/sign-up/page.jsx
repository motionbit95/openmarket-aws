import { CONFIG } from "src/global-config";

import { JwtSignUpView } from "src/auth/view/jwt";
import { Box } from "@mui/material";

// ----------------------------------------------------------------------

export const metadata = { title: `Sign up | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Box sx={{ margin: "auto", width: "100%", maxWidth: "500px", padding: 4 }}>
      <JwtSignUpView />
    </Box>
  );
}
