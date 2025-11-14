const express = require("express");
const router = express.Router();
const salesController = require("../controllers/sales.controller");

// 매출 조회
router.get("/", salesController.getSalesData);

// 매출 통계 조회
router.get("/stats", salesController.getSalesStats);

// 일별 매출 조회
router.get("/daily", salesController.getDailySales);

// 월별 매출 조회
router.get("/monthly", salesController.getMonthlySales);

// 상품별 매출 조회
router.get("/products", salesController.getProductSales);

// 판매자별 매출 조회
router.get("/partners", salesController.getPartnerSales);

// 매출 데이터 Excel 다운로드
router.get("/export", salesController.exportSalesData);

module.exports = router;