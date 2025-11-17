const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// SKU 코드 생성 함수
function generateSKUCode(productId, optionValues) {
  const timestamp = Date.now().toString().slice(-6);
  if (!optionValues || optionValues.length === 0) {
    return `P${productId}-${timestamp}`;
  }
  const optionPart = optionValues.map((v) => v.value.toUpperCase()).join("-");
  return `P${productId}-${optionPart}-${timestamp}`;
}

// SKU 표시명 생성 함수
function generateSKUDisplayName(optionValues) {
  if (!optionValues || optionValues.length === 0) {
    return "기본";
  }
  return optionValues.map((v) => v.displayName || v.value).join("/");
}

/**
 * 상품 생성 (개선된 버전)
 * POST /products/v2/create
 */
exports.createProductV2 = async (req, res) => {
  try {
    const {
      sellerId,
      displayName,
      internalName,
      keywords,
      categoryCode,
      brand = "",
      manufacturer = "",
      taxIncluded = true,
      saleStatus = "WAITING",
      displayStatus = "HIDDEN",
      stockQuantity = 0,
      saleStartDate,
      saleEndDate,
      description,
      prices,
      delivery,
      returns,
      images,
      infoNotices,
      refundNotice,
      isSingleProduct = true,
      // 새로운 옵션 구조
      optionGroups = [], // [{ name: "색상", displayName: "Color", options: [{ value: "빨강", displayName: "Red", extraPrice: 0 }] }]
      skus = [], // [{ originalPrice: 20000, salePrice: 18000, stockQuantity: 10, optionValues: ["빨강", "M"] }]
    } = req.body;

    const parsedSellerId = parseBigIntId(sellerId);

    // 비즈니스 로직 검증
    if (isSingleProduct) {
      if (skus && skus.length > 0) {
        return res.status(400).json({
          error:
            "단일상품에는 SKU를 직접 지정할 수 없습니다. stockQuantity를 사용하세요.",
        });
      }
      if (optionGroups && optionGroups.length > 0) {
        return res.status(400).json({
          error: "단일상품에는 옵션 그룹을 지정할 수 없습니다.",
        });
      }
    } else {
      if (stockQuantity > 0) {
        return res.status(400).json({
          error:
            "옵션상품에는 stockQuantity를 직접 지정할 수 없습니다. SKU별로 재고를 관리하세요.",
        });
      }
    }

    // 트랜잭션으로 상품과 모든 관련 데이터 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 기본 상품 생성
      const product = await tx.product.create({
        data: {
          sellerId: parsedSellerId,
          displayName,
          internalName,
          keywords: keywords || "",
          categoryCode,
          brand,
          manufacturer,
          taxIncluded,
          saleStatus,
          displayStatus,
          stockQuantity: isSingleProduct ? stockQuantity : 0, // 옵션상품은 SKU별로 관리
          saleStartDate,
          saleEndDate,
          description,
          isSingleProduct,
          refundNotice,
        },
      });

      const productId = product.id;

      // 2. 관련 정보 생성
      const createPromises = [];

      if (prices) {
        createPromises.push(
          tx.productPrice.create({
            data: { ...prices, productId },
          })
        );
      }

      if (delivery) {
        createPromises.push(
          tx.productDelivery.create({
            data: { ...delivery, productId },
          })
        );
      }

      if (returns) {
        createPromises.push(
          tx.productReturn.create({
            data: { ...returns, productId },
          })
        );
      }

      if (images && images.length > 0) {
        createPromises.push(
          tx.productImage.createMany({
            data: images.map((img) => ({ ...img, productId })),
          })
        );
      }

      if (infoNotices && infoNotices.length > 0) {
        createPromises.push(
          tx.productInfoNotice.createMany({
            data: infoNotices.map((info) => ({ ...info, productId })),
          })
        );
      }

      await Promise.all(createPromises);

      // 3. 단일상품인 경우 기본 SKU 생성
      if (isSingleProduct) {
        await tx.productSKU.create({
          data: {
            productId,
            skuCode: generateSKUCode(productId, []),
            displayName: "기본",
            originalPrice: prices?.originalPrice || 0,
            salePrice: prices?.salePrice || prices?.originalPrice || 0,
            discountRate: prices?.discountRate || 0,
            stockQuantity,
            isActive: true,
            isMain: true,
          },
        });
      } else {
        // 4. 옵션상품인 경우 옵션 그룹과 SKU 생성
        const optionGroupMap = new Map();
        const optionValueMap = new Map();

        // 4-1. 옵션 그룹 생성
        for (const group of optionGroups) {
          const createdGroup = await tx.productOptionGroup.create({
            data: {
              productId,
              name: group.name,
              displayName: group.displayName || group.name,
              required: group.required !== false,
              sortOrder: group.sortOrder || 0,
            },
          });
          optionGroupMap.set(group.name, createdGroup);

          // 4-2. 옵션 값 생성
          for (const option of group.options) {
            const createdOption = await tx.productOptionValue.create({
              data: {
                optionGroupId: createdGroup.id,
                value: option.value,
                displayName: option.displayName || option.value,
                colorCode: option.colorCode,
                extraPrice: option.extraPrice || 0,
                sortOrder: option.sortOrder || 0,
                isAvailable: option.isAvailable !== false,
              },
            });
            optionValueMap.set(`${group.name}:${option.value}`, createdOption);
          }
        }

        // 4-3. SKU 생성
        let mainSkuSet = false;
        for (const sku of skus) {
          const skuOptionValues = [];

          // SKU의 옵션 값들 찾기
          if (sku.optionValues) {
            for (const optionValue of sku.optionValues) {
              const key = Object.keys(optionValue)[0]; // 예: "색상"
              const value = optionValue[key]; // 예: "빨강"
              const optionVal = optionValueMap.get(`${key}:${value}`);
              if (optionVal) {
                skuOptionValues.push(optionVal);
              }
            }
          }

          const createdSKU = await tx.productSKU.create({
            data: {
              productId,
              skuCode: generateSKUCode(productId, skuOptionValues),
              displayName: generateSKUDisplayName(skuOptionValues),
              originalPrice: sku.originalPrice,
              salePrice: sku.salePrice,
              discountRate: sku.discountRate || 0,
              stockQuantity: sku.stockQuantity || 0,
              alertStock: sku.alertStock || 5,
              isActive: sku.isActive !== false,
              isMain: !mainSkuSet && (sku.isMain || false),
              weight: sku.weight,
              barcode: sku.barcode,
            },
          });

          if (createdSKU.isMain) mainSkuSet = true;

          // SKU-옵션값 연결
          for (const optionValue of skuOptionValues) {
            await tx.productSKUOption.create({
              data: {
                skuId: createdSKU.id,
                optionValueId: optionValue.id,
              },
            });
          }
        }
      }

      return product;
    });

    // 생성된 상품 전체 정보 조회
    const fullProduct = await prisma.product.findUnique({
      where: { id: result.id },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: true,
        ProductInfoNotice: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        ProductSKU: {
          include: {
            ProductSKUOption: {
              include: {
                ProductOptionValue: {
                  include: {
                    ProductOptionGroup: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // ProductSKU를 skus로, ProductOptionGroup을 optionGroups로 매핑
    const productResponse = {
      ...fullProduct,
      skus: fullProduct.ProductSKU || [],
      optionGroups: (fullProduct.ProductOptionGroup || []).map(group => ({
        ...group,
        options: group.ProductOptionValue || [],
      })),
    };
    delete productResponse.ProductSKU;
    delete productResponse.ProductOptionGroup;
    // optionGroups 내부의 ProductOptionValue 제거
    if (productResponse.optionGroups) {
      productResponse.optionGroups.forEach(group => delete group.ProductOptionValue);
    }

    res.status(201).json({
      message: "상품이 생성되었습니다.",
      product: convertBigIntToString(productResponse),
    });
  } catch (error) {
    console.error("상품 생성 오류:", error);
    res.status(500).json({
      error: "상품 생성에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 상품 상세 조회 (개선된 버전)
 * GET /products/v2/:productId
 */
exports.getProductByIdV2 = async (req, res) => {
  try {
    const { productId } = req.params;
    const parsedProductId = parseBigIntId(productId);

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: {
          orderBy: { sortOrder: "asc" },
        },
        ProductInfoNotice: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        ProductSKU: {
          where: { isActive: true },
          include: {
            ProductSKUOption: {
              include: {
                ProductOptionValue: {
                  include: {
                    ProductOptionGroup: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { isMain: "desc" }, // 메인 SKU 먼저
            { createdAt: "asc" },
          ],
        },
        Review: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            users: {
              select: { id: true, user_name: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }

    // ProductSKU를 skus로, ProductOptionGroup을 optionGroups로 매핑
    const productResponse = {
      ...product,
      skus: (product.ProductSKU || []).map(sku => ({
        ...sku,
        skuOptions: sku.ProductSKUOption || [],
      })),
      optionGroups: (product.ProductOptionGroup || []).map(group => ({
        ...group,
        options: group.ProductOptionValue || [],
      })),
    };
    delete productResponse.ProductSKU;
    delete productResponse.ProductOptionGroup;
    // skus 내부의 ProductSKUOption 제거
    if (productResponse.skus) {
      productResponse.skus.forEach(sku => delete sku.ProductSKUOption);
    }
    // optionGroups 내부의 ProductOptionValue 제거
    if (productResponse.optionGroups) {
      productResponse.optionGroups.forEach(group => delete group.ProductOptionValue);
    }

    res.json(convertBigIntToString(productResponse));
  } catch (error) {
    console.error("상품 조회 오류:", error);
    res.status(500).json({
      error: "상품 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * 상품 목록 조회 (개선된 버전)
 * GET /products/v2
 */
exports.getProductsV2 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      categoryCode,
      keyword,
      sellerId,
      minPrice,
      maxPrice,
      sortBy = "latest", // latest, price_low, price_high, popular
      inStock = true,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 기본 조건
    const where = {
      displayStatus: "DISPLAYED",
      saleStatus: { in: ["ON_SALE"] },
    };

    // 필터링 조건
    if (categoryCode) where.categoryCode = categoryCode;
    if (sellerId) where.sellerId = parseBigIntId(sellerId);
    if (keyword) {
      where.OR = [
        { displayName: { contains: keyword } },
        { keywords: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    // 재고 있는 상품만
    if (inStock === "true") {
      where.OR = [
        // 단일상품 & 재고 있음
        {
          AND: [{ isSingleProduct: true }, { stockQuantity: { gt: 0 } }],
        },
        // 옵션상품 & SKU 중 재고 있는 것 존재
        {
          AND: [
            { isSingleProduct: false },
            { skus: { some: { stockQuantity: { gt: 0 }, isActive: true } } },
          ],
        },
      ];
    }

    // 정렬 조건
    let orderBy = {};
    switch (sortBy) {
      case "price_low":
        // 가격 정렬은 나중에 JavaScript로 처리
        orderBy = { createdAt: "desc" };
        break;
      case "price_high":
        // 가격 정렬은 나중에 JavaScript로 처리
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
        orderBy = [
          { likedByUsers: { _count: "desc" } },
          { reviews: { _count: "desc" } },
        ];
        break;
      default: // latest
        orderBy = { createdAt: "desc" };
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          ProductPrice: true,
          ProductImage: {
            where: { isMain: true },
            take: 1,
          },
          ProductSKU: {
            where: { isActive: true },
            take: 1,
            orderBy: { isMain: "desc" },
          },
          _count: {
            select: {
              Review: true,
              UserLikeProduct: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    // ProductSKU를 skus로 매핑
    const mappedProducts = products.map(product => ({
      ...product,
      skus: product.ProductSKU || [],
    }));
    // ProductSKU 제거
    mappedProducts.forEach(product => delete product.ProductSKU);

    // 가격 필터링 (Prisma에서 직접 지원하지 않는 복잡한 가격 조건)
    let filteredProducts = mappedProducts;
    if (minPrice || maxPrice) {
      filteredProducts = mappedProducts.filter((product) => {
        const price =
          product.ProductPrice?.[0]?.salePrice || product.skus?.[0]?.salePrice || 0;
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // 가격 정렬 (JavaScript로 처리)
    if (sortBy === "price_low") {
      filteredProducts.sort((a, b) => {
        const priceA = a.ProductPrice?.[0]?.salePrice || a.skus?.[0]?.salePrice || 0;
        const priceB = b.ProductPrice?.[0]?.salePrice || b.skus?.[0]?.salePrice || 0;
        return priceA - priceB;
      });
    } else if (sortBy === "price_high") {
      filteredProducts.sort((a, b) => {
        const priceA = a.ProductPrice?.[0]?.salePrice || a.skus?.[0]?.salePrice || 0;
        const priceB = b.ProductPrice?.[0]?.salePrice || b.skus?.[0]?.salePrice || 0;
        return priceB - priceA;
      });
    }

    res.json({
      products: convertBigIntToString(filteredProducts),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("상품 목록 조회 오류:", error);
    res.status(500).json({
      error: "상품 목록 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

/**
 * SKU별 재고 조회
 * GET /products/v2/:productId/stock
 */
exports.getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const parsedProductId = parseBigIntId(productId);

    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: {
        id: true,
        displayName: true,
        isSingleProduct: true,
        stockQuantity: true,
        ProductSKU: {
          where: { isActive: true },
          select: {
            id: true,
            skuCode: true,
            displayName: true,
            stockQuantity: true,
            reservedStock: true,
            alertStock: true,
            salePrice: true,
            ProductSKUOption: {
              include: {
                ProductOptionValue: {
                  include: {
                    ProductOptionGroup: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "상품을 찾을 수 없습니다." });
    }

    // ProductSKU를 skus로 매핑
    const stockResponse = {
      ...product,
      skus: (product.ProductSKU || []).map(sku => ({
        ...sku,
        skuOptions: sku.ProductSKUOption || [],
      })),
    };
    delete stockResponse.ProductSKU;
    // skus 내부의 ProductSKUOption 제거
    if (stockResponse.skus) {
      stockResponse.skus.forEach(sku => delete sku.ProductSKUOption);
    }

    res.json(convertBigIntToString(stockResponse));
  } catch (error) {
    console.error("재고 조회 오류:", error);
    res.status(500).json({
      error: "재고 조회에 실패했습니다.",
      details: error.message,
    });
  }
};

module.exports = exports;
