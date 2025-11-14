"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Card,
  Grid,
  Stack,
  Button,
  Typography,
  Chip,
  Divider,
  Paper,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ImageList,
  ImageListItem,
} from "@mui/material";

import { DashboardContent } from "src/layouts/dashboard";
import { Iconify } from "src/components/iconify";
import { fCurrency } from "src/utils/format-number";
import { fDateTime } from "src/utils/format-time";

// ----------------------------------------------------------------------

const RETURN_STATUS = {
  REQUESTED: { label: "반품요청", color: "warning" },
  APPROVED: { label: "반품승인", color: "info" },
  PICKUP_SCHEDULED: { label: "수거예정", color: "primary" },
  PICKED_UP: { label: "수거완료", color: "primary" },
  INSPECTING: { label: "검수중", color: "primary" },
  COMPLETED: { label: "반품완료", color: "success" },
  REJECTED: { label: "반품거부", color: "error" },
};

const RETURN_REASON = {
  DEFECTIVE: "상품 하자/불량",
  DIFFERENT_FROM_DESCRIPTION: "상품정보 상이",
  DAMAGED_DURING_DELIVERY: "배송중 파손",
  WRONG_PRODUCT: "다른 상품 배송",
  SIZE_COLOR_MISMATCH: "사이즈/색상 불일치",
  CUSTOMER_CHANGE_MIND: "단순 변심",
  OTHER: "기타",
};

export default function ReturnDetailPage() {
  const params = useParams();
  const { id } = params;

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchReturnDetail = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${id}`
        );
        const data = await response.json();

        if (data.success) {
          setReturnData(data.return);
        } else {
          console.error("API Error:", data.message);
        }
      } catch (error) {
        console.error("Failed to fetch return details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReturnDetail();
    }
  }, [id]);

  const handleAction = async () => {
    try {
      if (!action) {
        alert("처리 방법을 선택해주세요.");
        return;
      }

      if (action === "reject" && !reason) {
        alert("거부 사유를 입력해주세요.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/partner/returns/${id}/process`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
        setReturnData((prev) => ({ ...prev, status: newStatus }));

        setActionDialogOpen(false);
        setAction("");
        setReason("");

        alert(
          `반품 요청이 ${action === "approve" ? "승인" : "거부"}되었습니다.`
        );
      } else {
        alert("반품 처리에 실패했습니다: " + data.message);
      }
    } catch (error) {
      console.error("Failed to process return:", error);
      alert("반품 처리 중 오류가 발생했습니다.");
    }
  };

  const getStatusChip = (status) => {
    const statusOption = RETURN_STATUS[status] || RETURN_STATUS.REQUESTED;
    return (
      <Chip
        variant="soft"
        color={statusOption.color}
        label={statusOption.label}
        size="medium"
      />
    );
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>로딩 중...</Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (!returnData) {
    return (
      <DashboardContent>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>반품 정보를 찾을 수 없습니다.</Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ p: 3 }}>
        {/* 헤더 */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4">반품 상세정보</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              반품번호: {returnData.returnNumber}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {returnData.status === "REQUESTED" && (
              <Button
                variant="contained"
                onClick={() => setActionDialogOpen(true)}
                startIcon={<Iconify icon="eva:edit-fill" />}
              >
                반품 처리
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              뒤로가기
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* 왼쪽 컬럼 */}
          <Grid item xs={12} md={8}>
            {/* 반품 정보 */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 3 }}
              >
                <Typography variant="h6">반품 정보</Typography>
                {getStatusChip(returnData.status)}
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    반품번호
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {returnData.returnNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    주문번호
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {returnData.orderNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    반품 요청일
                  </Typography>
                  <Typography variant="body1">
                    {fDateTime(returnData.requestedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    반품 사유
                  </Typography>
                  <Typography variant="body1">
                    {RETURN_REASON[returnData.returnReason]}
                  </Typography>
                </Grid>
              </Grid>

              {returnData.customerMessage && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    고객 메시지
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: "background.neutral" }}
                  >
                    <Typography variant="body2">
                      {returnData.customerMessage}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Card>

            {/* 반품 상품 정보 */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                반품 상품
              </Typography>

              {returnData.items.map((item) => (
                <Box key={item.id} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Avatar
                      src={item.product.image}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {item.product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU: {item.product.sku}
                      </Typography>
                      <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            단가
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fCurrency(item.product.price)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            주문수량
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.quantity}개
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            반품수량
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "error.main" }}
                          >
                            {item.returnQuantity}개
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                  {returnData.items.length > 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Card>

            {/* 첨부 이미지 */}
            {returnData.images && returnData.images.length > 0 && (
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  첨부 이미지
                </Typography>
                <ImageList cols={3} rowHeight={160}>
                  {returnData.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={`${image}?w=160&h=160&fit=crop&auto=format`}
                        srcSet={`${image}?w=160&h=160&fit=crop&auto=format&dpr=2 2x`}
                        alt={`반품 이미지 ${index + 1}`}
                        loading="lazy"
                        style={{ borderRadius: 8 }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Card>
            )}
          </Grid>

          {/* 오른쪽 컬럼 */}
          <Grid item xs={12} md={4}>
            {/* 고객 정보 */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                고객 정보
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    고객명
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {returnData.customer.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    연락처
                  </Typography>
                  <Typography variant="body1">
                    {returnData.customer.phone}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    이메일
                  </Typography>
                  <Typography variant="body1">
                    {returnData.customer.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    배송지
                  </Typography>
                  <Typography variant="body1">
                    {returnData.customer.address}
                  </Typography>
                </Box>
              </Stack>
            </Card>

            {/* 환불 정보 */}
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                환불 정보
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    상품금액
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {fCurrency(returnData.refundInfo.totalAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    환불예정액
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {fCurrency(returnData.refundInfo.refundAmount)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    결제수단
                  </Typography>
                  <Typography variant="body1">
                    {returnData.refundInfo.paymentMethod === "CARD"
                      ? `카드 (****-${returnData.refundInfo.cardLast4})`
                      : returnData.refundInfo.paymentMethod}
                  </Typography>
                </Box>
              </Stack>
            </Card>

            {/* 처리 이력 */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                처리 이력
              </Typography>
              <Stack spacing={2}>
                {returnData.timeline.map((item, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: `${item.color}.main`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <Iconify icon={item.icon} width={16} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(item.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* 반품 처리 다이얼로그 */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>반품 요청 처리</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                반품 요청을 승인하거나 거부할 수 있습니다.
              </Alert>

              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>처리 방법</InputLabel>
                  <Select
                    value={action}
                    label="처리 방법"
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <MenuItem value="approve">반품 승인</MenuItem>
                    <MenuItem value="reject">반품 거부</MenuItem>
                  </Select>
                </FormControl>

                {action === "reject" && (
                  <TextField
                    label="거부 사유"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="반품 거부 사유를 입력하세요"
                    multiline
                    rows={4}
                    fullWidth
                  />
                )}
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>취소</Button>
            <Button variant="contained" onClick={handleAction}>
              처리
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardContent>
  );
}
