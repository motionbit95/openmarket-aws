import { Box } from "@mui/material";
import FindId from "src/auth/view/jwt/find-id";
import { CONFIG } from "src/global-config";

// ----------------------------------------------------------------------

export const metadata = {
  title: `Find ID | Firebase - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <Box sx={{ margin: "auto", width: "100%", maxWidth: "500px", padding: 4 }}>
      <FindId />
    </Box>
  );
}
