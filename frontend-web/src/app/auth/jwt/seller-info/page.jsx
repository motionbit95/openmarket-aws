import { Box } from "@mui/material";
import SellerInfoPage from "src/auth/view/jwt/seller-info";
import { CONFIG } from "src/global-config";

// ----------------------------------------------------------------------

export const metadata = {
  title: `Seller Info  - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <Box sx={{ margin: "auto" }}>
      <SellerInfoPage />
    </Box>
  );
}
