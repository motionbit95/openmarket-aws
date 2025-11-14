const prisma = require("../config/prisma");
const { convertBigIntToString, parseBigIntId } = require("../utils/bigint");

// ✅ 상품 생성
exports.createProduct = async (req, res) => {
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
      optionGroups,
      infoNotices,
      refundNotice,
      isSingleProduct = true,
    } = req.body;

    // Ensure sellerId is a BigInt if needed
    let parsedSellerId = sellerId;
    if (typeof sellerId === "string" && /^\d+$/.test(sellerId)) {
      parsedSellerId = BigInt(sellerId);
    }

    console.log(refundNotice);

    // Create the product first (without relations)
    const product = await prisma.product.create({
      data: {
        sellerId: parsedSellerId,
        displayName,
        internalName,
        keywords,
        categoryCode,
        brand,
        manufacturer,
        taxIncluded,
        saleStatus,
        displayStatus,
        stockQuantity,
        saleStartDate,
        saleEndDate,
        description,
        isSingleProduct,
        refundNotice,
      },
    });

    const productId = product.id;

    // Create related records in parallel if provided
    await Promise.all([
      prices
        ? prisma.productPrice.create({
            data: { ...prices, productId },
          })
        : null,
      delivery
        ? prisma.productDelivery.create({
            data: { ...delivery, productId },
          })
        : null,
      returns
        ? prisma.productReturn.create({
            data: { ...returns, productId },
          })
        : null,
      images && images.length
        ? prisma.productImage.createMany({
            data: images.map((img) => ({ ...img, productId })),
          })
        : null,
      // optionGroups의 각 항목에 id가 있다면 무시하고, DB에서 자동 생성되도록 id를 제거
      optionGroups && optionGroups.length
        ? Promise.all(
            optionGroups.map(async (optionGroup) => {
              const {
                id: groupId,
                options: optionValues,
                ...groupData
              } = optionGroup;
              const createdGroup = await prisma.productOptionGroup.create({
                data: { ...groupData, productId },
              });

              if (optionValues && optionValues.length > 0) {
                await prisma.productOptionValue.createMany({
                  data: optionValues.map((opt) => {
                    const { id: optId, ...optData } = opt;
                    return { ...optData, optionGroupId: createdGroup.id };
                  }),
                });
              }

              return createdGroup;
            })
          )
        : null,
      infoNotices && infoNotices.length
        ? prisma.productInfoNotice.createMany({
            data: infoNotices.map((info) => ({ ...info, productId })),
          })
        : null,
    ]);

    // Fetch the product with all relations
    const fullProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: true,
          },
        },
        ProductSKU: true,
        ProductInfoNotice: true,
      },
    });

    res.status(201).json(convertBigIntToString(fullProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "상품 등록 중 오류 발생" });
  }
};

// ✅ 상품 목록 조회
exports.getAllProducts = async (req, res) => {
  // 인증 헤더에서 판매자 id 추출
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }
  const token = authHeader.split(" ")[1];

  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "secret";

  let sellerId;
  try {
    // 개발 환경에서는 test-token 허용
    if (token === "test-token") {
      sellerId = "1"; // 테스트용 판매자 ID
      console.log("Using test token, seller ID:", sellerId);
    } else {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Decoded token:", decoded);
      sellerId = decoded.id;
      console.log("Seller ID from token:", sellerId, "type:", typeof sellerId);
    }

    if (!sellerId) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }

  try {
    const products = await prisma.product.findMany({
      where: { sellerId: BigInt(sellerId) },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: true,
          },
        },
        ProductSKU: true,
        ProductInfoNotice: true,
        Review: true,
        Inquiry: true,
        UserLikeProduct: true,
        CartItem: true,
        OrderItem: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(convertBigIntToString(products));
  } catch (error) {
    console.error("Product query error:", error.message);
    console.error("Full error:", error);
    res
      .status(500)
      .json({ message: "상품 목록 조회 오류", error: error.message });
  }
};

// ✅ 상품 단건 조회
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // prisma가 정의되어 있는지 확인
    if (!prisma || !prisma.product) {
      console.error("prisma 인스턴스가 정의되어 있지 않습니다.");
      return res.status(500).json({ message: "서버 내부 오류: DB 연결 문제" });
    }

    // 'options' 필드는 Product 모델에 없으므로 include에서 제거
    const product = await prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: true,
          },
        },
        ProductSKU: true,
        ProductInfoNotice: {
          orderBy: { id: "desc" },
        },
        Review: true,
        Inquiry: true,
        UserLikeProduct: true,
        CartItem: true,
        OrderItem: true,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다" });
    }

    // 옵션 정보는 이미 optionGroups와 skus에 포함되어 있음
    // stockMap이 문자열로 저장되어 있다면, 파싱해서 객체로 변환 후 stockList 배열로 내보내기
    if (product.optionGroups && Array.isArray(product.optionGroups)) {
      product.optionGroups = product.optionGroups.map((group) => {
        if (group.options && Array.isArray(group.options)) {
          group.options = group.options.map((opt) => {
            let stockMapObj = opt.stockMap;
            if (typeof stockMapObj === "string") {
              try {
                stockMapObj = JSON.parse(stockMapObj);
              } catch (e) {
                stockMapObj = opt.stockMap;
              }
            }
            let stockList = [];
            if (
              stockMapObj &&
              typeof stockMapObj === "object" &&
              !Array.isArray(stockMapObj)
            ) {
              stockList = Object.entries(stockMapObj).map(([name, value]) => {
                if (value && typeof value === "object") {
                  return {
                    name,
                    stock: value.stock ?? value,
                    originalPrice: value.originalPrice,
                    salePrice: value.salePrice,
                  };
                } else {
                  return {
                    name,
                    stock: value,
                  };
                }
              });
            }
            return {
              ...opt,
              stockList,
            };
          });
        }
        return group;
      });
    }

    // infoNotices에서 name별로 가장 최신(가장 id가 큰) 값만 남기기
    if (Array.isArray(product.infoNotices)) {
      const latestInfoNoticesMap = {};
      for (const notice of product.infoNotices) {
        if (!notice.name || !notice.id) continue;
        if (
          !latestInfoNoticesMap[notice.name] ||
          BigInt(notice.id) > BigInt(latestInfoNoticesMap[notice.name].id)
        ) {
          latestInfoNoticesMap[notice.name] = notice;
        }
      }
      product.infoNotices = Object.values(latestInfoNoticesMap);
    }

    // 🔗 연관상품 조회 (키워드 기반, 판매가 낮은 순)
    let relatedProducts = [];
    try {
      // 키워드 파싱 (JSON 배열 또는 쉼표/공백으로 구분된 문자열)
      let keywords = [];
      console.log(
        "🔍 원본 키워드:",
        product.keywords,
        "타입:",
        typeof product.keywords
      );

      try {
        if (typeof product.keywords === "string") {
          // JSON 배열 형태인지 확인
          if (
            product.keywords.startsWith("[") &&
            product.keywords.endsWith("]")
          ) {
            keywords = JSON.parse(product.keywords);
            console.log("🔍 JSON 파싱된 키워드:", keywords);
          } else {
            // 쉼표, 공백으로 구분된 문자열
            keywords = product.keywords
              .split(/[,\s]+/)
              .filter((keyword) => keyword.trim().length > 0)
              .map((keyword) => keyword.trim());
            console.log("🔍 문자열 분리된 키워드:", keywords);
          }
        }
      } catch (error) {
        console.error("키워드 파싱 오류:", error);
        keywords = [];
      }

      console.log("🔍 최종 키워드 배열:", keywords, "길이:", keywords.length);

      if (keywords.length > 0) {
        console.log("🔍 검색할 키워드:", keywords);

        // 연관상품 검색 (테스트를 위해 조건 완화)
        console.log("🔍 검색 조건:", {
          excludeId: id,
          keywords: keywords,
          categoryCode: product.categoryCode,
          brand: product.brand,
          manufacturer: product.manufacturer,
        });

        // 먼저 전체 상품 수 확인
        const totalProducts = await prisma.product.count();
        console.log("🔍 전체 상품 수:", totalProducts);

        // 현재 상품을 제외한 상품 수 확인
        const otherProducts = await prisma.product.count({
          where: { id: { not: BigInt(id) } },
        });
        console.log("🔍 다른 상품 수:", otherProducts);

        relatedProducts = await prisma.product.findMany({
          where: {
            AND: [
              { id: { not: BigInt(id) } }, // 현재 상품 제외
              // 테스트를 위해 조건 완화
              // { saleStatus: "ON_SALE" }, // 판매중인 상품만
              // { displayStatus: "DISPLAYED" }, // 전시중인 상품만
              {
                OR: [
                  // 키워드가 일치하는 상품
                  {
                    keywords: {
                      contains: keywords.join(" "),
                    },
                  },
                  // 같은 카테고리의 상품
                  { categoryCode: product.categoryCode },
                  // 같은 브랜드의 상품
                  { brand: product.brand },
                  // 같은 제조사의 상품
                  { manufacturer: product.manufacturer },
                ],
              },
            ],
          },
          select: {
            id: true,
            displayName: true,
            keywords: true,
            categoryCode: true,
            brand: true,
            manufacturer: true,
            ProductPrice: {
              select: {
                salePrice: true,
                originalPrice: true,
                discountRate: true,
              },
            },
            ProductImage: {
              where: { isMain: true },
              select: {
                url: true,
                isMain: true,
                sortOrder: true,
              },
            },
            _count: {
              select: {
                Review: true,
                UserLikeProduct: true,
              },
            },
          },
          orderBy: [
            // 1순위: 판매가 (낮은 순)
            {
              ProductPrice: {
                salePrice: "asc",
              },
            },
            // 2순위: 리뷰 수 (높은 순)
            {
              Review: {
                _count: "desc",
              },
            },
          ],
          take: 10, // 최대 10개
        });

        // 연관상품 데이터 가공
        relatedProducts = relatedProducts.map((relatedProduct) => ({
          id: relatedProduct.id,
          name: relatedProduct.displayName,
          keywords: relatedProduct.keywords,
          category: relatedProduct.categoryCode,
          brand: relatedProduct.brand,
          manufacturer: relatedProduct.manufacturer,
          salePrice: relatedProduct.prices?.salePrice || 0,
          originalPrice: relatedProduct.prices?.originalPrice || 0,
          discountRate: relatedProduct.prices?.discountRate || 0,
          mainImage: relatedProduct.images[0]?.url || null,
          isMainImage: relatedProduct.images[0]?.isMain || false,
          reviewCount: relatedProduct._count.reviews,
          likeCount: relatedProduct._count.likedByUsers,
        }));
      }
    } catch (error) {
      console.error("연관상품 조회 오류:", error);
      // 연관상품 조회 실패 시에도 메인 상품은 정상 반환
      relatedProducts = [];
    }

    // 연관상품을 응답에 추가
    const responseData = {
      ...convertBigIntToString(product),
      relatedProducts: convertBigIntToString(relatedProducts),
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "상품 조회 오류" });
  }
};

// ✅ 상품 수정
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      internalName,
      keywords,
      categoryCode,
      brand,
      manufacturer,
      taxIncluded,
      saleStatus,
      displayStatus,
      stockQuantity,
      saleStartDate,
      saleEndDate,
      description,
      isSingleProduct,
      prices,
      delivery,
      returns,
      images,
      optionGroups,
      infoNotices,
      refundNotice,
    } = req.body;

    await prisma.$transaction(async (tx) => {
      // 1) 기본 정보 업데이트
      await tx.product.update({
        where: { id: BigInt(id) },
        data: {
          displayName,
          internalName,
          keywords,
          categoryCode,
          brand,
          manufacturer,
          taxIncluded,
          saleStatus,
          displayStatus,
          stockQuantity,
          saleStartDate,
          saleEndDate,
          description,
          refundNotice,
          ...(isSingleProduct !== undefined ? { isSingleProduct } : {}),
        },
      });

      // 2) 기존 연관 데이터 삭제 (외래키 제약조건을 고려한 순서)
      // 먼저 ProductOptionValue 삭제 (ProductOptionGroup을 참조)
      await tx.productOptionValue.deleteMany({
        where: {
          optionGroup: { productId: BigInt(id) },
        },
      });

      // 그 다음 ProductOptionGroup 삭제
      await tx.productOptionGroup.deleteMany({
        where: { productId: BigInt(id) },
      });

      // 나머지 데이터 삭제
      await Promise.all([
        tx.productPrice.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productDelivery.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productReturn.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productImage.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productInfoNotice.deleteMany({ where: { productId: BigInt(id) } }),
      ]);

      // 3) 연관 데이터 재생성
      if (prices) {
        await tx.productPrice.create({
          data: { ...prices, productId: BigInt(id) },
        });
      }

      if (delivery) {
        await tx.productDelivery.create({
          data: { ...delivery, productId: BigInt(id) },
        });
      }

      if (returns) {
        await tx.productReturn.create({
          data: { ...returns, productId: BigInt(id) },
        });
      }

      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((item) => ({ ...item, productId: BigInt(id) })),
        });
      }

      if (optionGroups?.length) {
        await Promise.all(
          optionGroups.map(async (optionGroup) => {
            const {
              id: groupId,
              options: optionValues,
              ...groupData
            } = optionGroup;
            const createdGroup = await tx.productOptionGroup.create({
              data: { ...groupData, productId: BigInt(id) },
            });

            if (optionValues && optionValues.length > 0) {
              await tx.productOptionValue.createMany({
                data: optionValues.map((opt) => {
                  const { id: optId, ...optData } = opt;
                  return { ...optData, optionGroupId: createdGroup.id };
                }),
              });
            }

            return createdGroup;
          })
        );
      }

      if (infoNotices?.length) {
        // 같은 name이 여러 번 들어올 경우, 마지막 값만 반영
        const uniqueInfoNotices = Array.from(
          infoNotices
            .reduce((map, item) => {
              map.set(item.name, { ...item, productId: BigInt(id) });
              return map;
            }, new Map())
            .values()
        );
        await tx.productInfoNotice.createMany({
          data: uniqueInfoNotices,
        });
      }
    });

    const updatedProduct = await prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        ProductPrice: true,
        ProductDelivery: true,
        ProductReturn: true,
        ProductImage: true,
        ProductOptionGroup: {
          include: {
            ProductOptionValue: true,
          },
        },
        ProductSKU: true,
        ProductInfoNotice: true,
      },
    });

    res.json(convertBigIntToString(updatedProduct));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "상품 수정 오류" });
  }
};

// ✅ 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // 2) 기존 연관 데이터 삭제 (외래키 제약조건을 고려한 순서)
      // 먼저 ProductOptionValue 삭제 (ProductOptionGroup을 참조)
      await tx.productOptionValue.deleteMany({
        where: {
          optionGroup: { productId: BigInt(id) },
        },
      });

      // 그 다음 ProductOptionGroup 삭제
      await tx.productOptionGroup.deleteMany({
        where: { productId: BigInt(id) },
      });

      // 나머지 데이터 삭제
      await Promise.all([
        tx.productPrice.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productDelivery.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productReturn.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productImage.deleteMany({ where: { productId: BigInt(id) } }),
        tx.productInfoNotice.deleteMany({ where: { productId: BigInt(id) } }),
      ]);

      // 마지막으로 상품 자체 삭제
      await tx.product.delete({ where: { id: BigInt(id) } });
    });

    res.json({ message: "상품이 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "상품 삭제 오류" });
  }
};

// ✅ 키워드 자동완성
exports.getKeywordSuggestions = async (req, res) => {
  try {
    const { query } = req.query; // 검색어

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "검색어(query)가 필요합니다." });
    }

    // 모든 상품의 keywords를 가져와서 하나의 배열로 합침
    const products = await prisma.product.findMany({
      select: { keywords: true },
    });

    // keywords 배열들을 하나로 합치고, 중복 제거 (대소문자 구분 없이)
    // 예: ["Small","Recycled","Unbranded","Small"] 에서 "sma"가 들어오면 "Small"이 나와야 함
    const seen = new Set();
    const lowerQuery = query.toLowerCase();

    // 유사도 기준: 포함되는 순서대로 최대 20개만 반환
    const allKeywords = products
      .flatMap((p) => {
        // keywords가 배열 형태의 문자열일 경우 파싱
        if (typeof p.keywords === "string") {
          try {
            const arr = JSON.parse(p.keywords);
            return Array.isArray(arr) ? arr : [];
          } catch (e) {
            // 파싱 실패 시 빈 배열 반환
            return [];
          }
        }
        // 이미 배열이면 그대로 반환
        if (Array.isArray(p.keywords)) return p.keywords;
        return [];
      })
      .filter((kw) => typeof kw === "string");

    // 중복 제거 및 query 포함 필터, 최대 20개만
    const suggestions = [];
    for (const kw of allKeywords) {
      const key = kw.toLowerCase();
      if (key.includes(lowerQuery) && !seen.has(key)) {
        seen.add(key);
        suggestions.push(kw);
        if (suggestions.length >= 20) break;
      }
    }

    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "키워드 자동완성 오류" });
  }
};

// ✅ 키워드 기반 상품 검색
exports.getProductsByKeyword = async (req, res) => {
  try {
    const { keyword, categoryCode } = req.query;

    console.log("[getProductsByKeyword] 요청 쿼리:", { keyword, categoryCode });

    // 키워드와 카테고리 둘 다 없으면 전체 리스트 반환
    if (
      (!keyword || keyword.trim() === "") &&
      (!categoryCode || categoryCode.trim() === "")
    ) {
      console.log(
        "[getProductsByKeyword] 키워드/카테고리 없음, 전체 상품 반환"
      );
      const allProducts = await prisma.product.findMany({
        include: {
          ProductPrice: true,
          ProductImage: true,
          ProductDelivery: true,
        },
      });
      console.log(
        `[getProductsByKeyword] 전체 상품 개수: ${allProducts.length}`
      );
      return res.json(convertBigIntToString(allProducts));
    }

    // 모든 상품을 가져옴
    const products = await prisma.product.findMany({
      include: {
        ProductPrice: true,
        ProductImage: true,
        ProductDelivery: true,
      },
    });

    console.log(
      `[getProductsByKeyword] 전체 상품 개수(필터 전): ${products.length}`
    );

    const lowerKeyword = keyword ? keyword.toLowerCase() : null;
    const lowerCategory = categoryCode ? categoryCode.toLowerCase() : null;

    const filtered = products.filter((product) => {
      let keywordMatch = true;
      let categoryMatch = true;

      // 키워드 필터
      if (lowerKeyword) {
        let keywordsArr = [];
        if (typeof product.keywords === "string") {
          try {
            const arr = JSON.parse(product.keywords);
            if (Array.isArray(arr)) {
              keywordsArr = arr;
            }
          } catch (e) {
            // 파싱 실패 시 무시
            console.log(
              `[getProductsByKeyword] 상품 ID ${product.id} 키워드 파싱 실패:`,
              e.message
            );
          }
        } else if (Array.isArray(product.keywords)) {
          keywordsArr = product.keywords;
        }
        keywordMatch = keywordsArr.some(
          (kw) =>
            typeof kw === "string" && kw.toLowerCase().includes(lowerKeyword)
        );
      }

      // 카테고리 필터
      if (lowerCategory) {
        categoryMatch =
          typeof product.categoryCode === "string" &&
          product.categoryCode.toLowerCase() === lowerCategory;
      }

      return keywordMatch && categoryMatch;
    });

    console.log(
      `[getProductsByKeyword] 필터링 후 상품 개수: ${filtered.length}`
    );

    res.json(convertBigIntToString(filtered));
  } catch (error) {
    console.error("[getProductsByKeyword] 오류:", error);
    res.status(500).json({ message: "상품 키워드/카테고리 검색 오류" });
  }
};
