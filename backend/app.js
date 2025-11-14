const express = require("express");
const cors = require("cors");

require("dotenv").config();

// BigInt 직렬화 문제 해결
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();

// 기본 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱

// swagger 설정
const setupSwagger = require("./config/swagger");
setupSwagger(app);

// 기본 루트 라우트
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

// Health 체크 라우트
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 라우터 연결
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/admin", adminRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/users", userRoutes);

const sellerRoutes = require("./routes/seller.routes");
app.use("/sellers", sellerRoutes);

const partnerRoutes = require("./routes/partner.routes");
app.use("/partner", partnerRoutes);

const termsRoutes = require("./routes/terms.routes");
app.use("/terms", termsRoutes);

const noticeRoutes = require("./routes/notice.routes");
app.use("/notices", noticeRoutes);

const attachmentRoutes = require("./routes/attachment.routes");
app.use("/attachments", attachmentRoutes);

const userGuideRoutes = require("./routes/guide.routes");
app.use("/guides", userGuideRoutes);

const errorReportRoutes = require("./routes/errorReport.routes");
app.use("/errorReport", errorReportRoutes);

const bannerRouter = require("./routes/banner.routes");
app.use("/banners", bannerRouter);

const couponRouter = require("./routes/coupon.routes");
app.use("/coupons", couponRouter);

const inquiryRouter = require("./routes/inquiry.routes");
app.use("/inquiries", inquiryRouter);

const faqRoutes = require("./routes/faq.routes");
app.use("/faq", faqRoutes);

const productV2Routes = require("./routes/product.v2.routes");
app.use("/products/v2", productV2Routes);

const productRoutes = require("./routes/product.routes");
app.use("/products", productRoutes);

const reviewRoutes = require("./routes/review.routes");
app.use("/reviews", reviewRoutes);

const addressRoutes = require("./routes/address.routes");
app.use("/address", addressRoutes);

const userLikeProduct = require("./routes/userLikeProduct.routes");
app.use("/user-like-products", userLikeProduct);

const cartRoutes = require("./routes/cart.routes");
app.use("/cart", cartRoutes);

const orderRoutes = require("./routes/order.routes");
app.use("/orders", orderRoutes);

const paymentRoutes = require("./routes/payment.routes");
app.use("/payment", paymentRoutes);

const settlementRoutes = require("./routes/settlement.routes");
app.use("/settlements", settlementRoutes);

const salesRoutes = require("./routes/sales.routes");
app.use("/sales", salesRoutes);

const recommendationRoutes = require("./routes/recommendation.routes");
app.use("/recommendations", recommendationRoutes);

const recentlyViewedRoutes = require("./routes/recentlyViewed.routes");
app.use("/recently-viewed", recentlyViewedRoutes);

const searchRoutes = require("./routes/search.routes");
app.use("/search", searchRoutes);

const notificationRoutes = require("./routes/notification.routes");
app.use("/notifications", notificationRoutes);

module.exports = app;
