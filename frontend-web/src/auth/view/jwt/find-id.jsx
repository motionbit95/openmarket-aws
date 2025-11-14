"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";

const _mock = {
  seller: {
    email: "abc123@naver.com",
    createdAt: dayjs().format("YYYY.MM.DD"),
  },
};

const FindId = () => {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [sent, setSent] = useState(false); // 인증번호 전송 여부
  const [verified, setVerified] = useState(false); // 인증번호 확인 여부

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const handleSendCode = () => {
    resetMessages();

    if (!phone) {
      setError("휴대폰 번호를 입력해주세요.");
      return;
    }

    setSent(true);
    setVerified(false); // 인증번호 재전송 시 인증 초기화
    setMessage("인증번호가 전송되었습니다. (테스트용: 111111)");
  };

  const handleVerifyCode = () => {
    resetMessages();

    if (!sent) {
      setError("먼저 인증번호를 전송해주세요.");
      return;
    }

    if (code === "111111") {
      setVerified(true);
      setMessage("인증번호가 확인되었습니다.");
    } else {
      setError("인증번호가 올바르지 않습니다.");
    }
  };

  const handleFindId = () => {
    resetMessages();

    if (!username || !phone || !code) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    if (!sent) {
      setError("인증번호를 먼저 전송해주세요.");
      return;
    }

    if (!verified) {
      setError("인증번호를 확인해주세요.");
      return;
    }

    setMessage(`아이디 찾기가 완료되었습니다.`);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8 }}>
      <Typography variant="h5" gutterBottom>
        아이디 찾기
      </Typography>

      <TextField
        label="이름"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
        <TextField
          label="휴대폰 번호"
          fullWidth
          placeholder="010-1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          sx={{ flex: 3 }}
        />
        <Button
          variant="outlined"
          onClick={handleSendCode}
          sx={{ flex: 1, height: "54px" }}
        >
          인증번호 전송
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
        <TextField
          label="인증번호"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ flex: 3 }}
        />
        <Button
          variant="outlined"
          onClick={handleVerifyCode}
          sx={{ flex: 1, height: "54px" }}
        >
          인증번호 확인
        </Button>
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {verified && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title={"아이디 정보"} />

          <Box sx={{ display: "flex", justifyContent: "space-between", p: 3 }}>
            <Typography color="text.secondary">아이디</Typography>
            <Typography>{_mock.seller.email}</Typography>
          </Box>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between", p: 3 }}>
            <Typography color="text.secondary">가입일</Typography>
            <Typography>{_mock.seller.createdAt}</Typography>
          </Box>
        </Card>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
        onClick={handleFindId}
      >
        아이디 찾기
      </Button>
    </Box>
  );
};

export default FindId;
