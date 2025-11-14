const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API 문서",
      version: "1.0.0",
      description: "Node.js + Prisma 기반 API 명세서",
    },
    components: {
      schemas: {
        User: {
          description: "회원 사용자 모델",
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            user_name: { type: "string", example: "홍길동" },
            email: { type: "string", example: "hong@example.com" },
            password: { type: "string", example: "hashed_password" },
            phone: { type: "string", example: "010-1234-5678" },
            mileage: { type: "integer", example: 1000 },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        UserInput: {
          description: "사용자 생성/수정 입력 스키마",
          type: "object",
          properties: {
            user_name: { type: "string", example: "홍길동" },
            email: { type: "string", example: "hong@example.com" },
            password: { type: "string", example: "plain_password" },
            phone: { type: "string", example: "010-1234-5678" },
          },
          required: ["user_name", "email", "password"],
        },
        Seller: {
          description: "판매자 계정 모델",
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "홍길동" },
            email: { type: "string", example: "seller@example.com" },
            shop_name: { type: "string", example: "홍길동샵" },
            password: { type: "string", example: "hashed_password" },
            phone: { type: "string", example: "010-1234-5678" },
            business_number: { type: "string", example: "123-45-67890" },
            bank_type: {
              type: "string",
              enum: [
                "KB",
                "SH",
                "HN",
                "WR",
                "IB",
                "NH",
                "KAKAOBANK",
                "KBANK",
                "IBK",
                "SUHYUP",
                "SC",
                "CITI",
                "DG",
                "BS",
                "GJ",
                "JB",
                "JJ",
                "GN",
              ],
              example: "KB",
            },
            bank_account: { type: "string", example: "123-456-7890" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        SellerInput: {
          description: "판매자 생성/수정 입력 스키마",
          type: "object",
          properties: {
            name: { type: "string", example: "홍길동" },
            email: { type: "string", example: "seller@example.com" },
            shop_name: { type: "string", example: "홍길동샵" },
            password: { type: "string", example: "plain_password" },
            phone: { type: "string", example: "010-1234-5678" },
            business_number: { type: "string", example: "123-45-67890" },
            bank_type: {
              type: "string",
              enum: [
                "KB",
                "SH",
                "HN",
                "WR",
                "IB",
                "NH",
                "KAKAOBANK",
                "KBANK",
                "IBK",
                "SUHYUP",
                "SC",
                "CITI",
                "DG",
                "BS",
                "GJ",
                "JB",
                "JJ",
                "GN",
              ],
              example: "KB",
            },
            bank_account: { type: "string", example: "123-456-7890" },
          },
          required: ["name", "email", "password"],
        },
        UserGuide: {
          description: "이용자 가이드 문서",
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            type: { type: "string", example: "CUSTOMER" },
            title: { type: "string", example: "사용자 가이드 제목" },
            content: { type: "string", example: "사용자 가이드 상세 내용" },
            is_pinned: { type: "boolean", example: false },
            view_count: { type: "integer", example: 100 },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "파일명.jpg" },
                  key: { type: "string", example: "uploads/file-key.jpg" },
                  url: {
                    type: "string",
                    example:
                      "https://bucket.s3.amazonaws.com/uploads/file-key.jpg",
                  },
                  size: { type: "integer", example: 123456 },
                  mimetype: { type: "string", example: "image/jpeg" },
                },
              },
            },
          },
        },
        ErrorReport: {
          description: "사용자/판매자 오류 신고",
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            reporter_id: { type: "integer", example: 123 },
            reporter_type: { type: "string", example: "user" }, // 또는 "seller"
            category: { type: "string", example: "버그" },
            title: { type: "string", example: "버튼이 동작하지 않음" },
            content: {
              type: "string",
              example: "홈화면의 버튼이 작동하지 않음",
            },
            status: { type: "string", example: "접수" },
            updated_by: { type: "string", example: "admin" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },

        ErrorReportInput: {
          description: "오류 신고 입력 스키마",
          type: "object",
          required: ["reporter_id", "reporter_type", "category", "content"],
          properties: {
            reporter_id: { type: "integer", example: 123 },
            reporter_type: { type: "string", example: "user" },
            category: { type: "string", example: "버그" },
            title: { type: "string", example: "버튼이 작동하지 않음" },
            content: {
              type: "string",
              example: "메인 화면의 버튼이 클릭되지 않음",
            },
            status: { type: "string", example: "접수" },
            updated_by: { type: "string", example: "admin" },
          },
        },
        Banner: {
          description: "배너(광고/판매자) 모델",
          type: "object",
          properties: {
            id: { type: "string", example: "1234567890123456789" }, // BigInt를 문자열로 표현
            attachmentId: { type: "string", example: "9876543210987654321" },
            url: {
              type: "string",
              example: "https://example.com/banner-click",
            },
            ownerType: {
              type: "string",
              enum: ["ADVERTISER", "SELLER"],
              example: "ADVERTISER",
            },
            ownerId: {
              type: "string",
              example: "seller",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-07-05T12:34:56Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-07-05T12:34:56Z",
            },
            attachment: {
              type: "object",
              description: "첨부파일 정보",
              properties: {
                id: { type: "string", example: "9876543210987654321" },
                key: { type: "string", example: "uploads/banner-image.jpg" },
                url: {
                  type: "string",
                  example:
                    "https://bucket.s3.amazonaws.com/uploads/banner-image.jpg",
                },
                name: { type: "string", example: "banner-image.jpg" },
                size: { type: "integer", example: 204800 },
                mimetype: { type: "string", example: "image/jpeg" },
              },
            },
          },
          required: [
            "id",
            "attachmentId",
            "url",
            "ownerType",
            "ownerId",
            "createdAt",
            "updatedAt",
          ],
        },
        Inquiry: {
          description: "1:1 문의 모델",
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            senderId: { type: "integer", example: 123 },
            senderType: {
              type: "string",
              enum: ["user", "seller"],
              example: "user",
            },
            title: { type: "string", example: "배송 문의" },
            content: { type: "string", example: "배송이 언제 오나요?" },
            status: { type: "string", example: "접수" },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-07-05T12:34:56Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2025-07-06T10:00:00Z",
            },
          },
          required: [
            "id",
            "senderId",
            "senderType",
            "title",
            "content",
            "status",
            "createdAt",
          ],
        },
        InquiryInput: {
          description: "1:1 문의 입력 스키마",
          type: "object",
          properties: {
            senderId: { type: "integer", example: 123 },
            senderType: {
              type: "string",
              enum: ["user", "seller"],
              example: "user",
            },
            title: { type: "string", example: "배송 문의" },
            content: { type: "string", example: "배송이 언제 오나요?" },
            status: { type: "string", example: "접수" },
          },
          required: ["senderId", "senderType", "title", "content"],
        },

        // --- Product 관련 스키마 시작 ---
        Product: {
          description: "상품 기본 모델",
          type: "object",
          properties: {
            id: { type: "string", example: "ckxyz123abc" },
            sellerId: { type: "integer", example: 1 },
            displayName: { type: "string", example: "테스트 상품" },
            internalName: { type: "string", example: "test-product" },
            keywords: { type: "string", example: "티셔츠,반팔,여름" },
            categoryCode: { type: "string", example: "TOP001" },
            brand: { type: "string", example: "테스트브랜드" },
            manufacturer: { type: "string", example: "테스트제조사" },
            taxIncluded: { type: "boolean", example: true },
            saleStatus: { type: "string", example: "ON_SALE" },
            displayStatus: { type: "string", example: "DISPLAYED" },
            stockQuantity: { type: "integer", example: 100 },
            saleStartDate: {
              type: "string",
              format: "date-time",
              example: "2025-07-11T00:00:00Z",
            },
            saleEndDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: null,
            },
            description: {
              type: "string",
              example: "이것은 테스트 상품입니다.",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            prices: { $ref: "#/components/schemas/ProductPrice" },
            delivery: { $ref: "#/components/schemas/ProductDelivery" },
            returns: { $ref: "#/components/schemas/ProductReturn" },
            images: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductImage" },
            },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductOption" },
            },
            infoNotices: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductInfoNotice" },
            },
            isSingleProduct: { type: "boolean", example: true },
          },
        },
        ProductPrice: {
          description: "상품 가격 정보",
          type: "object",
          properties: {
            originalPrice: { type: "number", example: 30000 },
            salePrice: { type: "number", example: 25000 },
            discountRate: { type: "number", example: 16.7 },
          },
        },
        ProductDelivery: {
          description: "상품 배송 정보",
          type: "object",
          properties: {
            originAddress: { type: "string", example: "서울시 강남구" },
            deliveryMethod: { type: "string", example: "택배" },
            isBundle: { type: "boolean", example: true },
            isIslandAvailable: { type: "boolean", example: true },
            courier: { type: "string", example: "CJ대한통운" },
            deliveryFeeType: { type: "string", example: "FREE" },
            deliveryFee: { type: "number", example: 0 },
            deliveryTime: { type: "string", example: "2~3일" },
          },
        },
        ProductReturn: {
          description: "상품 반품/교환 정보",
          type: "object",
          properties: {
            returnAddress: {
              type: "string",
              example: "서울시 강남구 반품센터",
            },
            initialShippingFee: { type: "number", example: 0 },
            returnShippingFee: { type: "number", example: 2500 },
            exchangeShippingFee: { type: "number", example: 3000 },
          },
        },
        ProductImage: {
          description: "상품 이미지 정보",
          type: "object",
          properties: {
            url: { type: "string", example: "https://cdn.com/image1.jpg" },
            isMain: { type: "boolean", example: true },
            sortOrder: { type: "integer", example: 1 },
          },
        },
        ProductOption: {
          description: "상품 옵션 정의",
          type: "object",
          properties: {
            name: { type: "string", example: "사이즈" },
            values: { type: "string", example: "S,M,L" },
            stockMap: {
              type: "object",
              example: { S: 10, M: 5, L: 0 },
              additionalProperties: { type: "integer" },
            },
          },
        },
        ProductInfoNotice: {
          description: "상품 정보고시 항목",
          type: "object",
          properties: {
            name: { type: "string", example: "품명 및 모델명" },
            value: { type: "string", example: "테스트 티셔츠" },
          },
        },
        // --- Product 스키마 끝 ---
        ReviewImage: {
          description: "리뷰 이미지",
          type: "object",
          properties: {
            id: { type: "string", example: "ckxyz123abc456" },
            reviewId: { type: "string", example: "review123" },
            url: { type: "string", example: "https://example.com/image.jpg" },
            sortOrder: { type: "integer", example: 0 },
          },
        },

        UserSummary: {
          description: "간단 사용자 정보",
          type: "object",
          properties: {
            id: { type: "integer", format: "int64", example: 123 },
            user_name: { type: "string", example: "홍길동" },
          },
        },

        Review: {
          description: "상품 리뷰",
          type: "object",
          properties: {
            id: { type: "string", example: "ckxyz123abc456" },
            productId: { type: "string", example: "prod123" },
            userId: { type: "integer", format: "int64", example: 123 },
            rating: { type: "integer", example: 5 },
            content: { type: "string", example: "상품이 정말 좋아요!" },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-07-11T10:00:00Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2025-07-11T12:00:00Z",
            },
            user: { $ref: "#/components/schemas/UserSummary" },
            images: {
              type: "array",
              items: { $ref: "#/components/schemas/ReviewImage" },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"], // JSDoc 주석 있는 라우트 파일들
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  // JSON 스펙 노출
  app.get("/api-docs.json", (req, res) => res.json(specs));

  // Swagger UI (기존 유지)
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  // Scalar UI (ESM 동적 임포트로 래핑)
  app.use("/docs", async (req, res, next) => {
    try {
      const { apiReference } = await import("@scalar/express-api-reference");
      return apiReference({
        theme: "default",
        darkMode: true,
        layout: "modern",
        spec: { url: "/api-docs.json" },
      })(req, res, next);
    } catch (e) {
      next(e);
    }
  });
};
