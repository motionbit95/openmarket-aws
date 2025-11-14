// 상품정보제공 고시 항목 정의 (카테고리별, 가장 하위 코드 기준)
// 실제 서비스에서는 이 파일에 모든 카테고리별 항목을 확장/관리

// 공통 필드 정의 (중복/유사 문구 통합 및 재활용)
const COMMON_FIELDS = {
  material: { name: "material", label: "소재" },
  color: { name: "color", label: "색상" },
  size: { name: "size", label: "치수" },
  type: { name: "type", label: "종류" },
  manufacturerImporter: {
    name: "manufacturerImporter",
    label: "제조자/수입자",
  },
  origin: { name: "origin", label: "제조국/원산지" },
  caution: { name: "caution", label: "주의사항" },
  qualityAssurance: {
    name: "qualityAssurance",
    label: "품질보증기준",
  },
  asContact: {
    name: "asContact",
    label: "A/S 연락처",
  },
  washingMethod: {
    name: "washingMethod",
    label: "세탁/취급방법",
  },
  manufactureDate: {
    name: "manufactureDate",
    label: "제조연월",
  },
  productNameModel: {
    name: "productNameModel",
    label: "품명/모델명",
  },
  certification: {
    name: "certification",
    label: "인증/허가",
  },
  kcCertification: {
    name: "kcCertification",
    label: "KC 인증",
  },
  energyEfficiencyGrade: {
    name: "energyEfficiencyGrade",
    label: "에너지등급",
  },
  ratedVoltagePower: {
    name: "ratedVoltagePower",
    label: "정격전압/소비전력",
  },
  releaseDate: {
    name: "releaseDate",
    label: "출시년월",
  },
  additionalInstallCost: {
    name: "additionalInstallCost",
    label: "추가설치비",
  },
  defaultOrigin: {
    name: "origin",
    label: "제조국/원산지",
  },
  defaultManufacturerImporter: {
    name: "manufacturerImporter",
    label: "제조자/수입자",
  },
  defaultAsContact: {
    name: "asContact",
    label: "A/S 연락처",
  },
};

// 재활용 가능한 필드 정의 (유사 문구 통합)
const FIELD_VARIANTS = {
  fashionMaterial: {
    ...COMMON_FIELDS.material,
    label: "제품 소재(혼용률)",
  },
  shoesMaterial: {
    ...COMMON_FIELDS.material,
    label: "주소재(운동화: 겉/안감)",
  },
  shoesSize: {
    ...COMMON_FIELDS.size,
    label: "치수(발길이/굽높이)",
  },
  bagSize: {
    ...COMMON_FIELDS.size,
    label: "크기",
  },
  beddingSize: {
    ...COMMON_FIELDS.size,
    label: "치수",
  },
  furnitureProductName: { name: "productName", label: "품명" },
  furnitureComposition: {
    name: "composition",
    label: "구성품",
  },
  beddingComposition: {
    name: "composition",
    label: "제품 구성",
  },
  furnitureMainMaterial: {
    name: "mainMaterial",
    label: "주요 소재",
  },
  furnitureRefurbishedInfo: {
    name: "refurbishedInfo",
    label: "리퍼/하자 정보",
  },
  furnitureDeliveryInstallCost: {
    name: "deliveryInstallCost",
    label: "배송/설치비",
  },
  tvSizeShape: { name: "sizeShape", label: "크기/형태" },
  tvScreenSpec: {
    name: "screenSpec",
    label: "화면사양",
  },
  homeElectronicsSizeCapacityShape: {
    name: "sizeCapacityShape",
    label: "크기/용량/형태",
  },
  sizeWeight: {
    name: "sizeWeight",
    label: "크기/무게",
  },
  mainSpec: {
    name: "mainSpec",
    label: "주요 사양",
  },
};

// 카테고리별 필수 필드 required 여부 통합 관리
const REQUIRED_FIELDS_BY_CATEGORY = {
  FASHION: [
    "fashionMaterial",
    "color",
    "size",
    "manufacturerImporter",
    "origin",
    "asContact",
  ],
  SHOES: [
    "shoesMaterial",
    "color",
    "shoesSize",
    "manufacturerImporter",
    "origin",
    "asContact",
  ],
  BAG: [
    "type",
    "material",
    "color",
    "bagSize",
    "manufacturerImporter",
    "origin",
    "asContact",
  ],
  FASHION_ACCESSORY: [
    "type",
    "material",
    "size",
    "manufacturerImporter",
    "origin",
    "asContact",
  ],
  BEDDING_CURTAIN: [
    "fashionMaterial",
    "color",
    "beddingSize",
    "beddingComposition",
    "manufacturerImporter",
    "origin",
    "asContact",
  ],
  FURNITURE: [
    "furnitureProductName",
    "kcCertification",
    "color",
    "furnitureComposition",
    "furnitureMainMaterial",
    "manufacturerImporter",
    "origin",
    "bagSize",
    "furnitureDeliveryInstallCost",
    "qualityAssurance",
    "asContact",
  ],
  TV_VIDEO: [
    "productNameModel",
    "kcCertification",
    "ratedVoltagePower",
    "energyEfficiencyGrade",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "tvSizeShape",
    "tvScreenSpec",
    "qualityAssurance",
    "asContact",
  ],
  HOME_ELECTRONICS: [
    "productNameModel",
    "kcCertification",
    "ratedVoltagePower",
    "energyEfficiencyGrade",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "homeElectronicsSizeCapacityShape",
    "qualityAssurance",
    "asContact",
  ],
  SEASONAL_ELECTRONICS: [
    "productNameModel",
    "kcCertification",
    "ratedVoltagePower",
    "energyEfficiencyGrade",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "sizeShape",
    "coolingHeatingArea",
    "qualityAssurance",
    "asContact",
  ],
  OFFICE_EQUIPMENT: [
    "productNameModel",
    "kcCertification",
    "ratedVoltagePower",
    "energyEfficiencyGrade",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "sizeWeight",
    "mainSpec",
    "qualityAssurance",
    "asContact",
  ],
  OPTICAL_EQUIPMENT: [
    "productNameModel",
    "kcCertification",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "sizeWeight",
    "mainSpec",
    "qualityAssurance",
    "asContact",
  ],
  SMALL_ELECTRONICS: [
    "productNameModel",
    "kcCertification",
    "ratedVoltagePower",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "sizeWeight",
    "mainSpec",
    "qualityAssurance",
    "asContact",
  ],
  MOBILE_COMMUNICATION: [
    "productNameModel",
    "kcCertification",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "sizeWeight",
    "mobileSubscription",
    "mainSpec",
    "qualityAssurance",
    "asContact",
  ],
  NAVIGATION: [
    "productNameModel",
    "kcCertification",
    "ratedVoltage",
    "sameModelReleaseDate",
    "manufacturerImporter",
    "origin",
    "sizeWeight",
    "mainSpec",
    "mapUpdateCostPeriod",
    "qualityAssurance",
    "asContact",
  ],
  AUTO_SUPPLIES: [
    "productNameModel",
    "releaseDate",
    "kcCertification",
    "manufacturerImporter",
    "origin",
    "size",
    "applicableCarType",
    "qualityAssurance",
    "asContact",
  ],
  MEDICAL_DEVICE: [
    "productNameModel",
    "releaseDate",
    "manufacturerImporter",
    "origin",
    "purposeUsage",
    "precautions",
    "qualityAssurance",
    "asContact",
  ],
};

// 필드 조합 정의 (required 여부는 REQUIRED_FIELDS_BY_CATEGORY에서 관리)
const FASHION_COMMON_NOTICE_FIELDS = [
  FIELD_VARIANTS.fashionMaterial,
  COMMON_FIELDS.color,
  COMMON_FIELDS.size,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  COMMON_FIELDS.washingMethod,
  COMMON_FIELDS.manufactureDate,
  COMMON_FIELDS.qualityAssurance,
  COMMON_FIELDS.asContact,
];

const SHOES_NOTICE_FIELDS = [
  FIELD_VARIANTS.shoesMaterial,
  COMMON_FIELDS.color,
  FIELD_VARIANTS.shoesSize,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  COMMON_FIELDS.caution,
  COMMON_FIELDS.qualityAssurance,
  COMMON_FIELDS.asContact,
];

const BAG_NOTICE_FIELDS = [
  COMMON_FIELDS.type,
  COMMON_FIELDS.material,
  COMMON_FIELDS.color,
  FIELD_VARIANTS.bagSize,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  COMMON_FIELDS.caution,
  COMMON_FIELDS.qualityAssurance,
  COMMON_FIELDS.asContact,
];

const FASHION_ACCESSORY_NOTICE_FIELDS = [
  COMMON_FIELDS.type,
  COMMON_FIELDS.material,
  COMMON_FIELDS.size,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  COMMON_FIELDS.caution,
  COMMON_FIELDS.qualityAssurance,
  COMMON_FIELDS.asContact,
];

const DEFAULT_NOTICE_FIELDS = [
  COMMON_FIELDS.productNameModel,
  COMMON_FIELDS.certification,
  COMMON_FIELDS.defaultOrigin,
  COMMON_FIELDS.defaultManufacturerImporter,
  COMMON_FIELDS.defaultAsContact,
];

const BEDDING_CURTAIN_NOTICE_FIELDS = [
  FIELD_VARIANTS.fashionMaterial,
  COMMON_FIELDS.color,
  FIELD_VARIANTS.beddingSize,
  FIELD_VARIANTS.beddingComposition,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  COMMON_FIELDS.washingMethod,
  COMMON_FIELDS.qualityAssurance,
  COMMON_FIELDS.asContact,
];

const FURNITURE_NOTICE_FIELDS = [
  FIELD_VARIANTS.furnitureProductName,
  { ...COMMON_FIELDS.kcCertification, label: "KC 인증" },
  COMMON_FIELDS.color,
  FIELD_VARIANTS.furnitureComposition,
  FIELD_VARIANTS.furnitureMainMaterial,
  {
    ...COMMON_FIELDS.manufacturerImporter,
    label: "제조자/수입자(구성품별 표기)",
  },
  {
    ...COMMON_FIELDS.origin,
    label: "제조국(구성품별 표기)",
  },
  FIELD_VARIANTS.bagSize,
  FIELD_VARIANTS.furnitureRefurbishedInfo,
  FIELD_VARIANTS.furnitureDeliveryInstallCost,
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  COMMON_FIELDS.asContact,
];

const TV_VIDEO_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  {
    ...COMMON_FIELDS.kcCertification,
    label: "KC 인증(해당 시)",
  },
  COMMON_FIELDS.ratedVoltagePower,
  COMMON_FIELDS.energyEfficiencyGrade,
  COMMON_FIELDS.releaseDate,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  FIELD_VARIANTS.tvSizeShape,
  FIELD_VARIANTS.tvScreenSpec,
  COMMON_FIELDS.additionalInstallCost,
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  COMMON_FIELDS.asContact,
];

const HOME_ELECTRONICS_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  COMMON_FIELDS.kcCertification,
  COMMON_FIELDS.ratedVoltagePower,
  COMMON_FIELDS.energyEfficiencyGrade,
  COMMON_FIELDS.releaseDate,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  FIELD_VARIANTS.homeElectronicsSizeCapacityShape,
  COMMON_FIELDS.additionalInstallCost,
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  COMMON_FIELDS.asContact,
];

const SEASONAL_ELECTRONICS_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  COMMON_FIELDS.kcCertification,
  COMMON_FIELDS.ratedVoltagePower,
  COMMON_FIELDS.energyEfficiencyGrade,
  COMMON_FIELDS.releaseDate,
  COMMON_FIELDS.manufacturerImporter,
  COMMON_FIELDS.origin,
  { name: "sizeShape", label: "크기/형태(실외기)" },
  { name: "coolingHeatingArea", label: "냉난방면적" },
  COMMON_FIELDS.additionalInstallCost,
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  COMMON_FIELDS.asContact,
];

// 카테고리 코드 모음
const FASHION_CATEGORIES = [
  "C-FASHION-ALL",
  "C-FASHION-PANTS",
  "C-FASHION-SKIRT",
  "C-FASHION-DRESS",
  "C-FASHION-TOP",
  "C-FASHION-SOCKS-STOCKINGS",
  "C-FASHION-TRAINING",
  "C-FASHION-SET",
  "C-FASHION-UNDERWEAR",
  "C-SPORTS-WOMEN-WEAR",
  "C-SPORTS-MEN-WEAR",
  "C-SPORTS-KIDS-WEAR",
];

const FASHION_ACCESSORY_CATEGORIES = [
  "C-FASHION-HAIR-ACCESSORY",
  "C-FASHION-ACCESSORY",
  "C-FASHION-JEWELRY",
  "C-FASHION-ETC",
];

const BEDDING_CURTAIN_CATEGORIES = [
  "C-KIDS-BEDDING",
  "C-LIVING-BEDDING",
  "C-LIVING-CARPET-CUSHION-SLIPPER",
];
const FURNITURE_CATEGORIES = ["C-LIVING-FURNITURE"];
const HOME_ELECTRONICS_NOTICE_CATEGORY = [
  "C-ELECTRONICS-REFRIGERATOR",
  "C-ELECTRONICS-WASHER",
  "C-ELECTRONICS-DISHWASHER",
  "C-ELECTRONICS-MICROWAVE",
  "C-ELECTRONICS-VACUUM",
];

// 사무용 기기
const OFFICE_EQUIPMENT_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.kcCertification },
  { ...COMMON_FIELDS.ratedVoltagePower },
  { ...COMMON_FIELDS.energyEfficiencyGrade },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  {
    ...FIELD_VARIANTS.sizeWeight,
    label: "크기/무게(휴대형만)",
  },
  {
    ...FIELD_VARIANTS.mainSpec,
    label: "주요 사양(성능/용량 등)",
  },
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];
const OFFICE_EQUIPMENT_NOTICE_CATEGORY = [
  "C-ELECTRONICS-PC",
  "C-ELECTRONICS-PRINTER",
  "C-ELECTRONICS-PC-ACCESSORY",
];

// 광학기기
const OPTICAL_EQUIPMENT_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.kcCertification },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  FIELD_VARIANTS.sizeWeight,
  FIELD_VARIANTS.mainSpec,
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];

// 소형전자
const SMALL_ELECTRONICS_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.kcCertification },
  { ...COMMON_FIELDS.ratedVoltagePower },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  FIELD_VARIANTS.sizeWeight,
  FIELD_VARIANTS.mainSpec,
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];

// 휴대용 통신기기
const MOBILE_COMMUNICATION_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.kcCertification },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  FIELD_VARIANTS.sizeWeight,
  {
    name: "mobileSubscription",
    label: "이동통신 가입조건",
    fields: [
      { name: "carrier", label: "이동통신사" },
      { name: "subscriptionProcedure", label: "가입절차" },
      {
        name: "additionalCosts",
        label: "추가 부담사항",
      },
    ],
  },
  FIELD_VARIANTS.mainSpec,
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];

// 네비게이션
const NAVIGATION_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.kcCertification },
  { name: "ratedVoltage", label: "정격전압/소비전력/등급" },
  { name: "sameModelReleaseDate", label: "출시년월" },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  FIELD_VARIANTS.sizeWeight,
  FIELD_VARIANTS.mainSpec,
  { name: "mapUpdateCostPeriod", label: "맵 업데이트/무상기간" },
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];

// 자동차 용품
const AUTO_SUPPLIES_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.kcCertification },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  { name: "size", label: "크기" },
  { name: "applicableCarType", label: "적용 차종" },
  { name: "riskCaution", label: "위험/유의사항" },
  { ...COMMON_FIELDS.qualityAssurance },
  { name: "inspectionCertificateNumber", label: "검사합격증번호" },
  { ...COMMON_FIELDS.asContact },
];

const AUTO_SUPPLIES_CATEGORIES = [
  "C-AUTO-CLEANING-CARE",
  "C-AUTO-INTERIOR",
  "C-AUTO-EXTERIOR",
  "C-AUTO-ELECTRONICS",
  "C-AUTO-SAFETY",
  "C-AUTO-ETC",
];

// 의료기기
const MEDICAL_DEVICE_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel },
  { name: "certificationNumber", label: "허가/인증/신고번호" },
  {
    ...COMMON_FIELDS.ratedVoltagePower,
    label: "정격전압/소비전력",
  },
  { ...COMMON_FIELDS.releaseDate },
  { ...COMMON_FIELDS.manufacturerImporter },
  { ...COMMON_FIELDS.origin },
  { name: "purposeUsage", label: "사용목적/방법" },
  { name: "precautions", label: "주의사항" },
  { ...COMMON_FIELDS.qualityAssurance },
  { ...COMMON_FIELDS.asContact },
];

// 주방용품
const KITCHENWARE_NOTICE_FIELDS = [
  { ...COMMON_FIELDS.productNameModel, label: "품명/모델명" },
  { ...COMMON_FIELDS.material, label: "재질" },
  { name: "composition", label: "구성품" },
  { ...COMMON_FIELDS.size, label: "크기" },
  { ...COMMON_FIELDS.releaseDate, label: "출시년월" },
  {
    ...COMMON_FIELDS.manufacturerImporter,
    label: "제조자/수입자",
  },
  { ...COMMON_FIELDS.origin, label: "제조국" },
  {
    name: "importDeclaration",
    label: "수입신고",
  },
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  { ...COMMON_FIELDS.asContact, label: "A/S 연락처" },
];

const KITCHENWARE_CATEGORIES = [
  "C-KITCHEN-GOODS",
  "C-KITCHEN-DISPOSABLE",
  "C-KITCHEN-APPLIANCE",
  "C-KITCHEN-POT-PAN",
  "C-KITCHEN-KNIFE-BOARD",
  "C-KITCHEN-COOKING-TOOLS",
  "C-KITCHEN-DISH-SET",
  "C-KITCHEN-CUTLERY",
  "C-KITCHEN-STORAGE",
  "C-KITCHEN-CONTAINER-LUNCHBOX",
  "C-KITCHEN-ETC",
];

// 뷰티
const BEAUTY_NOTICE_FIELDS = [
  { name: "capacityWeight", label: "용량/중량" },
  { name: "mainSpec", label: "주요 사양" },
  {
    name: "expirationPeriod",
    label: "사용기한/개봉후기간",
  },
  { name: "usageMethod", label: "사용방법" },
  {
    name: "manufacturerDistributor",
    label: "제조/판매업자",
  },
  { ...COMMON_FIELDS.origin, label: "제조국" },
  {
    name: "allIngredients",
    label: "전성분",
  },
  {
    name: "functionalCosmetics",
    label: "기능성 화장품",
  },
  { name: "precautions", label: "주의사항" },
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  { ...COMMON_FIELDS.asContact, label: "상담 연락처" },
];

const BEAUTY_CATEGORIES = [
  "C-BEAUTY-MAKEUP",
  "C-BEAUTY-TOOLS",
  "C-BEAUTY-SKINCARE",
  "C-BEAUTY-NAIL",
  "C-BEAUTY-CLEANSING",
  "C-BEAUTY-HAIR",
  "C-BEAUTY-BODY",
];

// 귀금속/보석/시계
const JEWELRY_WATCH_NOTICE_FIELDS = [
  { name: "materialPurityBand", label: "소재/순도/밴드" },
  { name: "weight", label: "중량" },
  {
    name: "manufacturerImporter",
    label: "제조자/수입자",
  },
  {
    name: "origin",
    label: "제조국/가공지",
  },
  { name: "size", label: "치수" },
  { name: "caution", label: "착용 주의사항" },
  {
    name: "mainSpec",
    label: "주요사항",
  },
  { name: "warrantyProvided", label: "보증서 제공" },
  { ...COMMON_FIELDS.qualityAssurance, label: "품질보증기준" },
  { ...COMMON_FIELDS.asContact, label: "A/S 연락처" },
];

// 농수축산물
const AGRICULTURAL_MARINE_LIVESTOCK_NOTICE_FIELDS = [
  { name: "productName", label: "품목/명칭" },
  {
    name: "packageContent",
    label: "포장단위/용량/수량/크기",
  },
  {
    name: "producerImporter",
    label: "생산자/수입자",
  },
  {
    name: "origin",
    label: "원산지",
  },
  {
    name: "manufactureExpiration",
    label: "제조일/소비기한",
  },
  {
    name: "detailedItemNotice",
    label: "세부 표시사항",
  },
  { name: "productComposition", label: "상품구성" },
  { name: "storageHandling", label: "보관/취급방법" },
  {
    name: "precautions",
    label: "소비자 주의사항",
  },
  { name: "customerService", label: "상담 연락처" },
];

const AGRICULTURAL_MARINE_LIVESTOCK_CATEGORIES = [
  "C-FOOD-SEAFOOD-DRIED",
  "C-FOOD-MEAT-EGG",
  "C-FOOD-FRUIT",
  "C-FOOD-VEGETABLE",
  "C-FOOD-RICE-GRAIN",
];

// 가공식품
const PROCESSED_FOOD_NOTICE_FIELDS = [
  { name: "productName", label: "제품명" },
  { name: "foodType", label: "식품유형" },
  {
    name: "producerLocation",
    label: "생산자/소재지",
  },
  {
    name: "manufactureExpiration",
    label: "제조일/소비기한",
  },
  {
    name: "packageContent",
    label: "포장/용량/수량",
  },
  {
    name: "ingredientsContent",
    label: "원재료/함량",
  },
  {
    name: "nutritionInfo",
    label: "영양성분",
  },
  {
    name: "gmoNotice",
    label: "GMO 표시",
  },
  {
    name: "precautions",
    label: "소비자 주의사항",
  },
  {
    name: "customerService",
    label: "상담 연락처",
  },
];

const PROCESSED_FOOD_CATEGORIES = [
  "C-FOOD-POWDER-SEASONING-OIL",
  "C-FOOD-NOODLE-CANNED-PROCESSED",
  "C-FOOD-DAIRY-ICECREAM",
  "C-FOOD-COFFEE-TEA",
  "C-FOOD-SAUCE-DRESSING-VINEGAR",
  "C-FOOD-REFRIGERATED-FROZEN",
  "C-FOOD-SNACK-CHOCOLATE-CEREAL",
  "C-FOOD-SIDE-READY",
  "C-FOOD-WATER-DRINK",
];

// 건강기능식품
const HEALTH_FUNCTIONAL_FOOD_NOTICE_FIELDS = [
  { name: "productName", label: "제품명" },
  {
    name: "manufacturerLocation",
    label: "제조/수입업소/소재지",
  },
  {
    name: "expirationAndStorage",
    label: "소비기한/보관방법",
  },
  {
    name: "packageContent",
    label: "포장/용량/수량",
  },
  {
    name: "ingredientsContent",
    label: "원료/함량",
  },
  {
    name: "nutritionInfo",
    label: "영양정보",
  },
  {
    name: "functionInfo",
    label: "기능정보",
  },
  {
    name: "intakeAndPrecautions",
    label: "섭취량/방법/주의",
  },
  {
    name: "notMedicine",
    label: "의약품 아님",
  },
  {
    name: "precautions",
    label: "소비자 주의사항",
  },
  {
    name: "gmoNotice",
    label: "GMO 표시(해당시)",
  },
  {
    name: "importNotice",
    label: "수입신고(해당시)",
  },
  {
    name: "customerService",
    label: "상담 연락처",
  },
];

const HEALTH_FUNCTIONAL_FOOD_CATEGORIES = [
  "C-HEALTH-FUNCTIONAL-FOOD",
  "C-HEALTH-DIET-INNER-BEAUTY",
  "C-HEALTH-VITAMIN-MINERAL",
  "C-HEALTH-SUPPLEMENT",
  "C-HEALTH-GINSENG",
  "C-HEALTH-JUICE-DRINK",
  "C-HEALTH-POWDER-PILL",
];

// 어린이 제품
const KIDS_NOTICE_FIELDS = [
  {
    name: "productNameAndModel",
    label: "품명/모델명",
  },
  {
    name: "kcCertificationInfo",
    label: "KC 인증",
  },
  {
    name: "sizeAndWeight",
    label: "크기/중량",
  },
  {
    name: "color",
    label: "색상",
  },
  {
    name: "material",
    label: "재질",
  },
  {
    name: "recommendedAge",
    label: "권장연령",
  },
  {
    name: "sizeWeightLimit",
    label: "크기/체중 한계",
  },
  {
    name: "releaseDate",
    label: "출시년월",
  },
  {
    name: "manufacturerOrImporter",
    label: "제조자/수입자",
  },
  {
    name: "countryOfOrigin",
    label: "제조국",
  },
  {
    name: "handlingAndCaution",
    label: "취급/주의사항",
  },
  {
    name: "warrantyStandard",
    label: "품질보증기준",
  },
  {
    name: "asManagerAndPhone",
    label: "A/S 연락처",
  },
];

const KIDS_CATEGORIES = [
  "C-KIDS-BEDDING",
  "C-KIDS-TOY-EDU",
  "C-KIDS-MOM-PRENATAL",
];

// 악기
const INSTRUMENT_NOTICE_FIELDS = [
  { name: "productNameModel", label: "품명/모델명" },
  { name: "size", label: "크기" },
  { name: "color", label: "색상" },
  { name: "material", label: "재질" },
  { name: "composition", label: "구성품" },
  { name: "releaseDate", label: "출시년월" },
  {
    name: "manufacturerImporter",
    label: "제조자/수입자",
  },
  { name: "countryOfOrigin", label: "제조국" },
  { name: "specification", label: "세부사양" },
  { name: "warrantyStandard", label: "품질보증기준" },
  { name: "asManagerAndPhone", label: "A/S 연락처" },
];

const INSTRUMENT_CATEGORIES = [
  "C-INSTRUMENT-GUITAR-BASS",
  "C-INSTRUMENT-PIANO-KEYBOARD",
  "C-INSTRUMENT-DRUM-PERCUSSION",
  "C-INSTRUMENT-WIND-STRING",
  "C-INSTRUMENT-AUDIO-ACCESSORY",
  "C-INSTRUMENT-ETC",
];

// 스포츠용품
const SPORTS_NOTICE_FIELDS = [
  { name: "productNameModel", label: "품명/모델명" },
  {
    name: "kcCertification",
    label: "KC 인증",
  },
  { name: "sizeWeight", label: "크기/중량" },
  { name: "color", label: "색상" },
  { name: "material", label: "재질" },
  { name: "composition", label: "구성품" },
  { name: "releaseDate", label: "출시년월" },
  {
    name: "manufacturerImporter",
    label: "제조자/수입자",
  },
  { name: "countryOfOrigin", label: "제조국" },
  { name: "specification", label: "세부사양" },
  { name: "warrantyStandard", label: "품질보증기준" },
  { name: "asManagerAndPhone", label: "A/S 연락처" },
];

const SPORTS_CATEGORIES = [
  "C-SPORTS-CAMPING",
  "C-SPORTS-FISHING",
  "C-SPORTS-HEALTH-YOGA-DANCE",
  "C-SPORTS-RACKET",
  "C-SPORTS-BIKE-KICKBOARD",
  "C-SPORTS-GOLF",
  "C-SPORTS-ETC",
];

// 서적
const BOOK_NOTICE_FIELDS = [
  { name: "bookTitle", label: "도서명" },
  { name: "authorPublisher", label: "저자/출판사" },
  { name: "sizeOrFileSize", label: "크기" },
  { name: "pageCount", label: "쪽수" },
  {
    name: "composition",
    label: "구성(세트/낱권 등)",
  },
  { name: "publicationDate", label: "발행일" },
  {
    name: "contentsOrIntroduction",
    label: "목차/소개/연령",
  },
];

const BOOK_CATEGORIES = [
  "C-BOOK-NOVEL-ESSAY",
  "C-BOOK-KIDS-YOUTH",
  "C-BOOK-ECONOMY-BUSINESS",
  "C-BOOK-SELF-IMPROVEMENT",
  "C-BOOK-HUMANITIES-SOCIETY-HISTORY",
  "C-BOOK-SCIENCE-IT",
  "C-BOOK-ART-CULTURE",
  "C-BOOK-ETC",
];

// 생활 화학 제품
const LIVING_CHEMICAL_NOTICE_FIELDS = [
  { name: "productName", label: "제품명" },
  {
    name: "usageAndType",
    label: "용도/제형",
  },
  {
    name: "manufactureDateAndExpiration",
    label: "제조일/유통기한",
  },
  { name: "weightVolumeCountSize", label: "중량/용량/크기" },
  { name: "effectEfficacy", label: "효과/효능" },
  {
    name: "importerCountryManufacturer",
    label: "수입자/제조국/제조사",
  },
  { name: "childResistantPackaging", label: "어린이보호포장" },
  {
    name: "chemicalNames",
    label: "화학물질명",
  },
  { name: "precautions", label: "주의사항" },
  {
    name: "safetyConfirmationNumber",
    label: "안전확인번호",
  },
  { name: "customerServicePhone", label: "상담 연락처" },
];

const LIVING_CHEMICAL_CATEGORIES = [
  "C-LIFE-CLEANING-KITCHEN-DETERGENT",
  "C-LIFE-DEODORANT-FRAGRANCE",
  "C-LIFE-LAUNDRY-CLEANING",
  "C-LIFE-LAUNDRY-DETERGENT",
];

// 살충제
const PESTICIDE_NOTICE_FIELDS = [
  { name: "productNameAndType", label: "제품명/유형" },
  { name: "expirationDate", label: "유통기한" },
  {
    name: "weightOrVolumeAndStandardUsage",
    label: "중량/용량/사용량",
  },
  { name: "effectEfficacy", label: "효과/효능" },
  { name: "targetAndScope", label: "사용대상/범위" },
  {
    name: "importerCountryManufacturer",
    label: "수입자/제조국/제조사",
  },
  { name: "childResistantPackaging", label: "어린이보호포장" },
  { name: "substances", label: "살생물/나노물질" },
  { name: "hazardRiskInfo", label: "유해성/위해성" },
  { name: "usageAndPrecautions", label: "사용법/주의" },
  { name: "approvalNumber", label: "승인번호" },
  { name: "customerServicePhone", label: "상담 연락처" },
];

// 카테고리별 Notice Field 매핑 (중복/유사 항목 재활용)
const NOTICE_FIELDS_BY_CATEGORY = {
  ...Object.fromEntries(
    FASHION_CATEGORIES.map((code) => [code, FASHION_COMMON_NOTICE_FIELDS])
  ),
  "C-FASHION-SHOES": SHOES_NOTICE_FIELDS,
  "C-FASHION-BAG-WALLET": BAG_NOTICE_FIELDS,
  ...Object.fromEntries(
    FASHION_ACCESSORY_CATEGORIES.map((code) => [
      code,
      FASHION_ACCESSORY_NOTICE_FIELDS,
    ])
  ),
  ...Object.fromEntries(
    BEDDING_CURTAIN_CATEGORIES.map((code) => [
      code,
      BEDDING_CURTAIN_NOTICE_FIELDS,
    ])
  ),
  ...Object.fromEntries(
    FURNITURE_CATEGORIES.map((code) => [code, FURNITURE_NOTICE_FIELDS])
  ),
  "C-ELECTRONICS-TV-VIDEO": TV_VIDEO_NOTICE_FIELDS,
  ...Object.fromEntries(
    HOME_ELECTRONICS_NOTICE_CATEGORY.map((code) => [
      code,
      HOME_ELECTRONICS_NOTICE_FIELDS,
    ])
  ),
  "C-ELECTRONICS-SEASONAL": SEASONAL_ELECTRONICS_NOTICE_FIELDS,
  ...Object.fromEntries(
    OFFICE_EQUIPMENT_NOTICE_CATEGORY.map((code) => [
      code,
      OFFICE_EQUIPMENT_NOTICE_FIELDS,
    ])
  ),
  "C-ELECTRONICS-CAMERA": OPTICAL_EQUIPMENT_NOTICE_FIELDS,
  "C-ELECTRONICS-MOBILE": MOBILE_COMMUNICATION_NOTICE_FIELDS,
  "C-ELECTRONICS-SMALL": SMALL_ELECTRONICS_NOTICE_FIELDS,
  "C-ELECTRONICS-NAVIGATION": NAVIGATION_NOTICE_FIELDS,
  ...Object.fromEntries(
    AUTO_SUPPLIES_CATEGORIES.map((code) => [code, AUTO_SUPPLIES_NOTICE_FIELDS])
  ),
  "C-LIFE-MEDICAL-DEVICE": MEDICAL_DEVICE_NOTICE_FIELDS,
  ...Object.fromEntries(
    KITCHENWARE_CATEGORIES.map((code) => [code, KITCHENWARE_NOTICE_FIELDS])
  ),
  ...Object.fromEntries(
    BEAUTY_CATEGORIES.map((code) => [code, BEAUTY_NOTICE_FIELDS])
  ),
  "C-FASHION-JEWELRY": JEWELRY_WATCH_NOTICE_FIELDS,
  ...Object.fromEntries(
    AGRICULTURAL_MARINE_LIVESTOCK_CATEGORIES.map((code) => [
      code,
      AGRICULTURAL_MARINE_LIVESTOCK_NOTICE_FIELDS,
    ])
  ),
  ...Object.fromEntries(
    PROCESSED_FOOD_CATEGORIES.map((code) => [
      code,
      PROCESSED_FOOD_NOTICE_FIELDS,
    ])
  ),
  ...Object.fromEntries(
    HEALTH_FUNCTIONAL_FOOD_CATEGORIES.map((code) => [
      code,
      HEALTH_FUNCTIONAL_FOOD_NOTICE_FIELDS,
    ])
  ),
  ...Object.fromEntries(
    KIDS_CATEGORIES.map((code) => [code, KIDS_NOTICE_FIELDS])
  ),
  ...Object.fromEntries(
    INSTRUMENT_CATEGORIES.map((code) => [code, INSTRUMENT_NOTICE_FIELDS])
  ),
  ...Object.fromEntries(
    SPORTS_CATEGORIES.map((code) => [code, SPORTS_NOTICE_FIELDS])
  ),
  ...Object.fromEntries(
    BOOK_CATEGORIES.map((code) => [code, BOOK_NOTICE_FIELDS])
  ),
  ...Object.fromEntries(
    LIVING_CHEMICAL_CATEGORIES.map((code) => [
      code,
      LIVING_CHEMICAL_NOTICE_FIELDS,
    ])
  ),
  "C-LIFE-INSECTICIDE": PESTICIDE_NOTICE_FIELDS,
  "C-LIVING-LIGHTING-STAND": SMALL_ELECTRONICS_NOTICE_FIELDS,
  "C-ELECTRONICS-AUDIO": SMALL_ELECTRONICS_NOTICE_FIELDS,
  DEFAULT: DEFAULT_NOTICE_FIELDS,
};

export {
  COMMON_FIELDS,
  FIELD_VARIANTS,
  REQUIRED_FIELDS_BY_CATEGORY,
  NOTICE_FIELDS_BY_CATEGORY,
};

export default NOTICE_FIELDS_BY_CATEGORY;
