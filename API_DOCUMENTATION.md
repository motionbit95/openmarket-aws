# 📚 OpenMarket API Documentation

> **RESTful API 문서**
>
> OpenMarket Backend API의 모든 엔드포인트를 문서화합니다.

---

## 📋 목차

1. [API 개요](#-api-개요)
2. [인증](#-인증)
3. [공통 응답 형식](#-공통-응답-형식)
4. [에러 코드](#-에러-코드)
5. [API 엔드포인트](#-api-엔드포인트)
   - [인증 (Auth)](#인증-auth)
   - [사용자 (Users)](#사용자-users)
   - [상품 (Products)](#상품-products)
   - [카테고리 (Categories)](#카테고리-categories)
   - [장바구니 (Cart)](#장바구니-cart)
   - [주문 (Orders)](#주문-orders)
   - [리뷰 (Reviews)](#리뷰-reviews)
   - [관리자 (Admin)](#관리자-admin)
   - [판매자 (Seller)](#판매자-seller)

---

## 🌐 API 개요

### Base URL

```
Development:  http://localhost:3001/api
Staging:      https://api-staging.openmarket.example.com/api
Production:   https://api.openmarket.com/api
```

### 버전

- **Current Version**: v1
- **API Prefix**: `/api`

### Content-Type

```
Content-Type: application/json
Accept: application/json
```

### Rate Limiting

| 사용자 유형 | 요청 제한 | 기간 |
|------------|---------|------|
| Guest      | 100 req | 15분 |
| User       | 1000 req| 15분 |
| Seller     | 2000 req| 15분 |
| Admin      | 무제한   | -    |

---

## 🔐 인증

### JWT Token 기반 인증

대부분의 API 엔드포인트는 JWT 토큰 인증이 필요합니다.

#### Header 형식
```http
Authorization: Bearer <your_jwt_token>
```

#### 토큰 획득

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

#### 토큰 갱신

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📦 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "message": "작업이 성공적으로 완료되었습니다"
}
```

### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}
  }
}
```

### 페이지네이션 응답

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

## ⚠️ 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `AUTH_REQUIRED` | 401 | 인증이 필요합니다 |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `TOKEN_EXPIRED` | 401 | 토큰이 만료되었습니다 |
| `FORBIDDEN` | 403 | 권한이 없습니다 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없습니다 |
| `VALIDATION_ERROR` | 400 | 입력 값 검증 실패 |
| `DUPLICATE_EMAIL` | 400 | 이미 존재하는 이메일 |
| `INVALID_CREDENTIALS` | 401 | 잘못된 이메일 또는 비밀번호 |
| `INSUFFICIENT_STOCK` | 400 | 재고 부족 |
| `PAYMENT_FAILED` | 400 | 결제 실패 |
| `SERVER_ERROR` | 500 | 서버 오류 |

---

## 📡 API 엔드포인트

### 인증 (Auth)

#### 회원가입

```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "010-1234-5678",
  "role": "USER"  // USER | SELLER | ADMIN
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

#### 로그인

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

#### 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

#### 비밀번호 재설정 요청

```http
POST /api/auth/forgot-password
```

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "비밀번호 재설정 이메일이 발송되었습니다"
}
```

---

### 사용자 (Users)

#### 내 정보 조회

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "010-1234-5678",
    "role": "USER",
    "address": {
      "postal_code": "12345",
      "address": "서울시 강남구",
      "detail_address": "123번지"
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 내 정보 수정

```http
PUT /api/users/me
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "John Doe Updated",
  "phone": "010-9876-5432",
  "address": {
    "postal_code": "54321",
    "address": "서울시 서초구",
    "detail_address": "456번지"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe Updated",
    // ... 업데이트된 정보
  }
}
```

#### 비밀번호 변경

```http
PUT /api/users/me/password
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다"
}
```

---

### 상품 (Products)

#### 상품 목록 조회

```http
GET /api/products?page=1&limit=20&category=electronics&sort=price&order=asc&search=laptop
```

**Query Parameters**:
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)
- `category` (optional): 카테고리 필터
- `sort` (optional): 정렬 기준 (price, name, createdAt)
- `order` (optional): 정렬 순서 (asc, desc)
- `search` (optional): 검색어
- `minPrice` (optional): 최소 가격
- `maxPrice` (optional): 최대 가격

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "MacBook Pro 16",
        "description": "고성능 노트북",
        "price": 2500000,
        "originalPrice": 3000000,
        "discountRate": 16.67,
        "stock": 50,
        "category": {
          "id": 1,
          "name": "Electronics"
        },
        "seller": {
          "id": 5,
          "name": "Tech Store"
        },
        "images": [
          {
            "url": "https://s3.amazonaws.com/...",
            "isPrimary": true
          }
        ],
        "rating": 4.5,
        "reviewCount": 123,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

#### 상품 상세 조회

```http
GET /api/products/:id
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "MacBook Pro 16",
    "description": "고성능 노트북\n\n상세 설명...",
    "price": 2500000,
    "originalPrice": 3000000,
    "discountRate": 16.67,
    "stock": 50,
    "category": {
      "id": 1,
      "name": "Electronics",
      "path": "Electronics > Computers"
    },
    "seller": {
      "id": 5,
      "name": "Tech Store",
      "rating": 4.8
    },
    "images": [
      {
        "id": 1,
        "url": "https://s3.amazonaws.com/...",
        "isPrimary": true
      },
      {
        "id": 2,
        "url": "https://s3.amazonaws.com/...",
        "isPrimary": false
      }
    ],
    "specifications": {
      "CPU": "M2 Pro",
      "RAM": "16GB",
      "Storage": "512GB SSD"
    },
    "rating": 4.5,
    "reviewCount": 123,
    "reviews": [],  // 최근 5개 리뷰
    "relatedProducts": [],  // 연관 상품
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-10T00:00:00.000Z"
  }
}
```

---

### 카테고리 (Categories)

#### 카테고리 목록 조회

```http
GET /api/categories
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "전자제품",
      "icon": "🖥️",
      "productCount": 1234,
      "children": [
        {
          "id": 2,
          "name": "Computers",
          "slug": "computers",
          "productCount": 456
        },
        {
          "id": 3,
          "name": "Smartphones",
          "slug": "smartphones",
          "productCount": 789
        }
      ]
    }
  ]
}
```

---

### 장바구니 (Cart)

#### 장바구니 조회

```http
GET /api/cart
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "MacBook Pro 16",
          "price": 2500000,
          "image": "https://s3.amazonaws.com/...",
          "stock": 50
        },
        "quantity": 2,
        "subtotal": 5000000
      }
    ],
    "summary": {
      "totalItems": 3,
      "subtotal": 8000000,
      "shipping": 3000,
      "discount": 100000,
      "total": 7903000
    }
  }
}
```

#### 장바구니에 상품 추가

```http
POST /api/cart/items
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product": {
      "id": 1,
      "name": "MacBook Pro 16",
      "price": 2500000
    },
    "quantity": 2,
    "subtotal": 5000000
  }
}
```

#### 장바구니 상품 수량 변경

```http
PUT /api/cart/items/:id
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "quantity": 3,
    "subtotal": 7500000
  }
}
```

#### 장바구니 상품 삭제

```http
DELETE /api/cart/items/:id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "상품이 장바구니에서 삭제되었습니다"
}
```

---

### 주문 (Orders)

#### 주문 생성

```http
POST /api/orders
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "phone": "010-1234-5678",
    "postal_code": "12345",
    "address": "서울시 강남구",
    "detail_address": "123번지",
    "memo": "문 앞에 놔주세요"
  },
  "paymentMethod": "card",  // card | bank_transfer | virtual_account
  "usePoints": 5000
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-20250115-123456",
    "status": "pending_payment",
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "MacBook Pro 16",
          "image": "https://s3.amazonaws.com/..."
        },
        "quantity": 2,
        "price": 2500000,
        "subtotal": 5000000
      }
    ],
    "summary": {
      "subtotal": 5000000,
      "shipping": 3000,
      "discount": 100000,
      "pointsUsed": 5000,
      "total": 4898000
    },
    "payment": {
      "method": "card",
      "amount": 4898000,
      "status": "pending"
    },
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### 내 주문 목록 조회

```http
GET /api/orders?page=1&limit=10&status=all
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 항목 수
- `status` (optional): 주문 상태 필터 (all, pending_payment, paid, preparing, shipped, delivered, cancelled)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "orderNumber": "ORD-20250115-123456",
        "status": "preparing",
        "totalAmount": 4898000,
        "itemCount": 2,
        "thumbnail": "https://s3.amazonaws.com/...",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

#### 주문 상세 조회

```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-20250115-123456",
    "status": "preparing",
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "MacBook Pro 16",
          "image": "https://s3.amazonaws.com/..."
        },
        "quantity": 2,
        "price": 2500000,
        "subtotal": 5000000,
        "status": "preparing"
      }
    ],
    "shippingAddress": {
      "name": "John Doe",
      "phone": "010-1234-5678",
      "address": "서울시 강남구 123번지"
    },
    "summary": {
      "subtotal": 5000000,
      "shipping": 3000,
      "discount": 100000,
      "pointsUsed": 5000,
      "total": 4898000
    },
    "payment": {
      "method": "card",
      "amount": 4898000,
      "status": "completed",
      "paidAt": "2025-01-15T10:35:00.000Z"
    },
    "tracking": {
      "company": "CJ대한통운",
      "number": "1234567890",
      "status": "preparing"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

#### 주문 취소

```http
POST /api/orders/:id/cancel
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "reason": "단순 변심",
  "detailReason": "다른 상품을 구매하고 싶어서"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "주문이 취소되었습니다"
}
```

---

### 리뷰 (Reviews)

#### 리뷰 작성

```http
POST /api/reviews
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "orderId": 123,
  "productId": 1,
  "rating": 5,
  "title": "정말 좋은 제품이에요!",
  "content": "배송도 빠르고 품질도 최고입니다!",
  "images": [
    "https://s3.amazonaws.com/...",
    "https://s3.amazonaws.com/..."
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 456,
    "product": {
      "id": 1,
      "name": "MacBook Pro 16"
    },
    "user": {
      "id": 1,
      "name": "John D***"
    },
    "rating": 5,
    "title": "정말 좋은 제품이에요!",
    "content": "배송도 빠르고 품질도 최고입니다!",
    "images": [],
    "likes": 0,
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 관리자 (Admin)

#### 대시보드 통계

```http
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 10000,
      "totalOrders": 5000,
      "totalRevenue": 500000000,
      "todayOrders": 123
    },
    "recentOrders": [],
    "topProducts": [],
    "salesChart": {
      "labels": ["2025-01-01", "2025-01-02", "..."],
      "data": [1000000, 1500000, "..."]
    }
  }
}
```

#### 사용자 관리

```http
GET /api/admin/users?page=1&limit=20&role=all&search=john
Authorization: Bearer <admin_token>
```

---

### 판매자 (Seller)

#### 내 상품 목록

```http
GET /api/seller/products?page=1&limit=20
Authorization: Bearer <seller_token>
```

#### 상품 등록

```http
POST /api/seller/products
Authorization: Bearer <seller_token>
```

**Request Body**:
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 100000,
  "stock": 50,
  "categoryId": 1,
  "images": [
    "https://s3.amazonaws.com/..."
  ]
}
```

#### 판매 통계

```http
GET /api/seller/statistics
Authorization: Bearer <seller_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 50,
      "totalSales": 10000000,
      "totalOrders": 200,
      "averageRating": 4.5
    },
    "salesChart": {
      "daily": [],
      "weekly": [],
      "monthly": []
    },
    "topProducts": []
  }
}
```

---

## 🧪 테스트 방법

### cURL 예시

```bash
# 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 상품 목록 조회
curl http://localhost:3001/api/products?page=1&limit=10

# 장바구니 조회 (인증 필요)
curl http://localhost:3001/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection

Postman Collection 파일은 프로젝트 루트의 `postman/` 디렉토리에서 확인할 수 있습니다.

---

## 📝 추가 참고 사항

### Swagger/OpenAPI

Swagger UI는 다음 URL에서 확인할 수 있습니다:
```
http://localhost:3001/api-docs
```

### WebSocket (실시간 알림)

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('order:status', (data) => {
  console.log('주문 상태 변경:', data);
});
```

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-01-15
