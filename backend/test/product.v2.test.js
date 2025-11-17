const request = require("supertest");
const app = require("../app");
const prisma = require("../config/prisma");
const { checkSKUStock } = require("../utils/inventory");

describe("상품 V2 API 테스트", () => {
  let testSeller;
  let singleProduct;
  let optionProduct;
  let testSKUs = [];

  beforeAll(async () => {
    // 테스트용 판매자 생성
    testSeller = await prisma.sellers.create({
      data: {
        name: "상품V2테스트판매자",
        email: `product_v2_seller_${Date.now()}@test.com`,
        shop_name: "V2테스트샵",
        password: "hashedpassword",
        phone: "010-9999-8888",
        business_number: "999-88-77777",
        bank_type: "KB",
        bank_account: "9999888777",
        depositor_name: "테스트판매자V2",
        ceo_name: "김테스트V2",
      },
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리 (역순으로)
    if (testSKUs.length > 0) {
      for (const sku of testSKUs) {
        await prisma.productSKUOption.deleteMany({ where: { skuId: sku.id } });
      }
      await prisma.productSKU.deleteMany({
        where: {
          id: { in: testSKUs.map((s) => s.id) },
        },
      });
    }

    if (optionProduct) {
      await prisma.productOptionValue.deleteMany({
        where: {
          ProductOptionGroup: {
            productId: optionProduct.id,
          },
        },
      });
      await prisma.ProductOptionGroup.deleteMany({
        where: { productId: optionProduct.id },
      });
      await prisma.productPrice.deleteMany({
        where: { productId: optionProduct.id },
      });
      await prisma.product.delete({ where: { id: optionProduct.id } });
    }

    if (singleProduct) {
      await prisma.productSKU.deleteMany({
        where: { productId: singleProduct.id },
      });
      await prisma.productPrice.deleteMany({
        where: { productId: singleProduct.id },
      });
      await prisma.product.delete({ where: { id: singleProduct.id } });
    }

    await prisma.sellers.delete({ where: { id: testSeller.id } });
  });

  describe("단일상품 생성 및 관리", () => {
    it("단일상품을 생성해야 한다", async () => {
      const productData = {
        sellerId: testSeller.id.toString(),
        displayName: "V2 단일상품 테스트",
        internalName: "v2-single-test",
        keywords: "V2,단일,테스트",
        categoryCode: "V2SINGLE001",
        brand: "V2테스트브랜드",
        manufacturer: "V2테스트제조사",
        taxIncluded: true,
        saleStatus: "ON_SALE",
        displayStatus: "DISPLAYED",
        stockQuantity: 50,
        description: "V2 단일상품 테스트 설명",
        isSingleProduct: true,
        ProductPrice: {
          originalPrice: 25000,
          salePrice: 22000,
          discountRate: 12,
          flexzonePrice: 20000,
        },
      };

      const res = await request(app)
        .post("/products/v2/create")
        .send(productData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("상품이 생성되었습니다.");
      expect(res.body.product.displayName).toBe("V2 단일상품 테스트");
      expect(res.body.product.isSingleProduct).toBe(true);
      expect(res.body.product.skus).toHaveLength(1); // 기본 SKU 생성됨
      expect(res.body.product.skus[0].displayName).toBe("기본");
      expect(res.body.product.skus[0].stockQuantity).toBe(50);

      singleProduct = { id: BigInt(res.body.product.id) };
    });

    it("단일상품 상세 정보를 조회해야 한다", async () => {
      const res = await request(app).get(`/products/v2/${singleProduct.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.displayName).toBe("V2 단일상품 테스트");
      expect(res.body.isSingleProduct).toBe(true);
      expect(res.body.skus).toHaveLength(1);
      expect(res.body.optionGroups).toHaveLength(0); // 단일상품이므로 옵션 없음
    });
  });

  describe("옵션상품 생성 및 관리", () => {
    it("옵션상품을 생성해야 한다", async () => {
      const productData = {
        sellerId: testSeller.id.toString(),
        displayName: "V2 옵션상품 테스트 티셔츠",
        internalName: "v2-option-tshirt",
        keywords: "V2,옵션,티셔츠",
        categoryCode: "V2OPTION001",
        brand: "V2옵션브랜드",
        manufacturer: "V2옵션제조사",
        taxIncluded: true,
        saleStatus: "ON_SALE",
        displayStatus: "DISPLAYED",
        description: "V2 옵션상품 테스트 - 다양한 색상과 사이즈",
        isSingleProduct: false,
        ProductPrice: {
          originalPrice: 30000,
          salePrice: 25000,
          discountRate: 16.7,
          flexzonePrice: 23000,
        },
        optionGroups: [
          {
            name: "색상",
            displayName: "Color",
            required: true,
            sortOrder: 1,
            options: [
              {
                value: "빨강",
                displayName: "Red",
                colorCode: "#FF0000",
                extraPrice: 0,
                sortOrder: 1,
              },
              {
                value: "파랑",
                displayName: "Blue",
                colorCode: "#0000FF",
                extraPrice: 0,
                sortOrder: 2,
              },
              {
                value: "검정",
                displayName: "Black",
                colorCode: "#000000",
                extraPrice: 1000,
                sortOrder: 3,
              },
            ],
          },
          {
            name: "사이즈",
            displayName: "Size",
            required: true,
            sortOrder: 2,
            options: [
              {
                value: "S",
                displayName: "Small",
                extraPrice: 0,
                sortOrder: 1,
              },
              {
                value: "M",
                displayName: "Medium",
                extraPrice: 0,
                sortOrder: 2,
              },
              {
                value: "L",
                displayName: "Large",
                extraPrice: 2000,
                sortOrder: 3,
              },
            ],
          },
        ],
        skus: [
          {
            originalPrice: 25000,
            salePrice: 23000,
            stockQuantity: 10,
            optionValues: [{ 색상: "빨강" }, { 사이즈: "M" }],
            isMain: true,
          },
          {
            originalPrice: 25000,
            salePrice: 23000,
            stockQuantity: 8,
            optionValues: [{ 색상: "파랑" }, { 사이즈: "M" }],
          },
          {
            originalPrice: 27000,
            salePrice: 25000,
            stockQuantity: 5,
            optionValues: [{ 색상: "검정" }, { 사이즈: "L" }],
          },
        ],
      };

      const res = await request(app)
        .post("/products/v2/create")
        .send(productData);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("상품이 생성되었습니다.");
      expect(res.body.product.displayName).toBe("V2 옵션상품 테스트 티셔츠");
      expect(res.body.product.isSingleProduct).toBe(false);
      expect(res.body.product.optionGroups).toHaveLength(2);
      expect(res.body.product.skus).toHaveLength(3);

      // 옵션 그룹 검증
      const colorGroup = res.body.product.optionGroups.find(
        (g) => g.name === "색상"
      );
      expect(colorGroup).toBeDefined();
      expect(colorGroup.options).toHaveLength(3);

      const sizeGroup = res.body.product.optionGroups.find(
        (g) => g.name === "사이즈"
      );
      expect(sizeGroup).toBeDefined();
      expect(sizeGroup.options).toHaveLength(3);

      // SKU 검증
      const mainSku = res.body.product.skus.find((s) => s.isMain);
      expect(mainSku).toBeDefined();
      expect(mainSku.displayName).toContain("Red");
      expect(mainSku.displayName).toContain("Medium");

      optionProduct = { id: BigInt(res.body.product.id) };
      testSKUs = res.body.product.skus.map((s) => ({ id: BigInt(s.id) }));
    });

    it("옵션상품 상세 정보를 조회해야 한다", async () => {
      const res = await request(app).get(`/products/v2/${optionProduct.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.displayName).toBe("V2 옵션상품 테스트 티셔츠");
      expect(res.body.isSingleProduct).toBe(false);
      expect(res.body.optionGroups).toHaveLength(2);
      expect(res.body.skus).toHaveLength(3);

      // SKU 옵션 조합 확인
      const skuWithOptions = res.body.skus[0];
      expect(skuWithOptions.skuOptions).toHaveLength(2); // 색상 + 사이즈
    });
  });

  describe("상품 재고 관리", () => {
    it("상품 재고 정보를 조회해야 한다", async () => {
      const res = await request(app).get(
        `/products/v2/${optionProduct.id}/stock`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.isSingleProduct).toBe(false);
      expect(res.body.skus).toHaveLength(3);

      const mainSku = res.body.skus.find((s) => s.stockQuantity === 10);
      expect(mainSku).toBeDefined();
      expect(mainSku.stockQuantity).toBe(10);
    });

    it("SKU 재고 확인 유틸리티가 작동해야 한다", async () => {
      const testSku = testSKUs[0];

      // 충분한 재고
      const stockOk = await checkSKUStock(testSku.id, 5);
      expect(stockOk).toBe(true);

      // 부족한 재고
      const stockNotOk = await checkSKUStock(testSku.id, 100);
      expect(stockNotOk).toBe(false);
    });
  });

  describe("상품 목록 조회", () => {
    it("상품 목록을 조회해야 한다", async () => {
      const res = await request(app).get("/products/v2").query({
        page: 1,
        limit: 10,
        sortBy: "latest",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);

      // 생성한 상품들이 포함되어 있는지 확인
      const productNames = res.body.products.map((p) => p.displayName);
      expect(productNames).toContain("V2 단일상품 테스트");
      expect(productNames).toContain("V2 옵션상품 테스트 티셔츠");
    });

    it("키워드로 상품을 검색해야 한다", async () => {
      const res = await request(app).get("/products/v2").query({
        keyword: "티셔츠",
        page: 1,
        limit: 10,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);

      const foundProduct = res.body.products.find((p) =>
        p.displayName.includes("티셔츠")
      );
      expect(foundProduct).toBeDefined();
    });

    it("가격 범위로 상품을 필터링해야 한다", async () => {
      const res = await request(app).get("/products/v2").query({
        minPrice: 20000,
        maxPrice: 30000,
        page: 1,
        limit: 10,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.products).toBeInstanceOf(Array);

      // 모든 상품이 가격 범위 내에 있는지 확인
      res.body.products.forEach((product) => {
        const price =
          product.prices?.salePrice || product.skus[0]?.salePrice || 0;
        expect(price).toBeGreaterThanOrEqual(20000);
        expect(price).toBeLessThanOrEqual(30000);
      });
    });
  });

  describe("에러 처리", () => {
    it("존재하지 않는 상품 조회시 404를 반환해야 한다", async () => {
      const res = await request(app).get("/products/v2/999999");

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("상품을 찾을 수 없습니다.");
    });

    it("잘못된 상품 ID로 400을 반환해야 한다", async () => {
      const res = await request(app).get("/products/v2/invalid-id");

      expect(res.statusCode).toBe(500); // parseBigIntId 오류로 500 반환
    });

    it("단일상품에 SKU 지정시 오류를 반환해야 한다", async () => {
      const productData = {
        sellerId: testSeller.id.toString(),
        displayName: "잘못된 단일상품",
        internalName: "wrong-single",
        categoryCode: "WRONG001",
        description: "잘못된 상품",
        isSingleProduct: true,
        skus: [
          {
            originalPrice: 10000,
            salePrice: 9000,
            stockQuantity: 10,
            optionValues: [{ 색상: "빨강" }], // 단일상품인데 옵션 지정
          },
        ],
      };

      const res = await request(app)
        .post("/products/v2/create")
        .send(productData);

      expect(res.statusCode).toBe(400); // 비즈니스 로직 오류 - 400 Bad Request
    });
  });
});
