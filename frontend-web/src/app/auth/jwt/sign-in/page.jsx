import { Box } from "@mui/material";
import { JwtSignInView } from "src/auth/view/jwt";
import { CONFIG } from "src/global-config";

// ----------------------------------------------------------------------

export const metadata = { title: `Sign in | Jwt - ${CONFIG.appName}` };

export default function Page() {
  return (
    <Box sx={{ margin: "auto", width: "100%", maxWidth: "500px", padding: 4 }}>
      <JwtSignInView />
    </Box>
  );
}
