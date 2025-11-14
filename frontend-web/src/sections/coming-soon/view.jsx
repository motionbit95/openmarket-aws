"use client";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { ComingSoonIllustration } from "src/assets/illustrations";

// ----------------------------------------------------------------------

export function ComingSoonView() {
  return (
    <Container
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box textAlign="center">
        <Typography variant="h3" sx={{ mb: 2 }}>
          Coming Soon!
        </Typography>

        <Typography sx={{ color: "text.secondary" }}>
          이 페이지는 현재 열심히 준비 중입니다. 곧 찾아뵙겠습니다!
        </Typography>

        <ComingSoonIllustration sx={{ my: { xs: 5, sm: 10 } }} />
      </Box>
    </Container>
  );
}
