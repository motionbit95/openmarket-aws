import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Iconify } from "src/components/iconify";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const SignupComplete = ({ onGoToLogin }) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  return (
    <Box
      sx={{
        maxWidth: 480,
        textAlign: "center",
      }}
    >
      {/* {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={300} // 많이 터짐
          recycle={false} // 한 번만 터지고 멈춤
          gravity={1.5} // 중력 효과 (떨어지는 속도)
        />
      )} */}
      <Iconify icon={"solar:check-circle-bold"} width={40} />
      <Typography variant="h4" gutterBottom mt={1}>
        회원가입이 완료되었습니다!
      </Typography>
      <Typography variant="body1" color="text.secondary" mt={4}>
        가입해주셔서 감사합니다.
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        이제 로그인을 하시고 서비스를 이용하실 수 있습니다.
      </Typography>
      <Button variant="contained" size="large" onClick={onGoToLogin} fullWidth>
        로그인하러 가기
      </Button>
    </Box>
  );
};

export default SignupComplete;
