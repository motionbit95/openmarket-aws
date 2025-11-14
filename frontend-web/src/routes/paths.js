// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
};

// ----------------------------------------------------------------------

export const paths = {
  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      sellerInfo: `${ROOTS.AUTH}/jwt/seller-info`,
      signupComplete: `${ROOTS.AUTH}/jwt/sign-up-complete`,
      findId: `${ROOTS.AUTH}/jwt/find-id`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
    },
  },
  // ADMIN
  admin: {
    root: ROOTS.ADMIN,
    dashboard: `${ROOTS.ADMIN}/dashboard`,
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      customer: `${ROOTS.DASHBOARD}/user/customer`,
      seller: `${ROOTS.DASHBOARD}/user/seller`,
    },
    settlement: {
      root: `${ROOTS.DASHBOARD}/settlement`,
      list: `${ROOTS.DASHBOARD}/settlement/list`,
      complete: `${ROOTS.DASHBOARD}/settlement/complete`,
    },
    orders: `${ROOTS.DASHBOARD}/orders`,
    sales: `${ROOTS.DASHBOARD}/sales`,
    banner: {
      root: `${ROOTS.DASHBOARD}/banner`,
      advertiser: `${ROOTS.DASHBOARD}/banner/advertiser`,
      partner: `${ROOTS.DASHBOARD}/banner/partner`,
      new: `${ROOTS.DASHBOARD}/banner/new`,
      edit: `${ROOTS.DASHBOARD}/banner/edit`,
    },
    coupon: {
      root: `${ROOTS.DASHBOARD}/coupon`,
      customer: `${ROOTS.DASHBOARD}/coupon/customer`,
      partner: `${ROOTS.DASHBOARD}/coupon/partner`,
      new: `${ROOTS.DASHBOARD}/coupon/new`,
      edit: `${ROOTS.DASHBOARD}/coupon/edit`,
    },
    inquiry: {
      root: `${ROOTS.DASHBOARD}/inquiry`,
      guide: `${ROOTS.DASHBOARD}/inquiry/guide`,
      faq: `${ROOTS.DASHBOARD}/inquiry/faq`,
      new: `${ROOTS.DASHBOARD}/inquiry/new`,
      edit: `${ROOTS.DASHBOARD}/inquiry/edit`,
    },
    notice: {
      root: `${ROOTS.DASHBOARD}/notice`,
      customer: `${ROOTS.DASHBOARD}/notice/customer`,
      partner: `${ROOTS.DASHBOARD}/notice/partner`,
      new: `${ROOTS.DASHBOARD}/notice/new`,
      edit: `${ROOTS.DASHBOARD}/notice/edit`,
    },
    policy: `${ROOTS.DASHBOARD}/policy`,
    etc: {
      root: `${ROOTS.DASHBOARD}/etc`,
      error: `${ROOTS.DASHBOARD}/etc/error`,
      dev: `${ROOTS.DASHBOARD}/etc/dev`,
      new: `${ROOTS.DASHBOARD}/etc/new`,
      edit: `${ROOTS.DASHBOARD}/etc/edit`,
    },
    // PARTNER
    partner: {
      root: `${ROOTS.DASHBOARD}/partner`,
      product: {
        root: `${ROOTS.DASHBOARD}/partner/product`,
        list: `${ROOTS.DASHBOARD}/partner/product/list`,
        create: `${ROOTS.DASHBOARD}/partner/product/create`,
        details: (id) => `${ROOTS.DASHBOARD}/partner/product/${id}`,
        edit: (id) => `${ROOTS.DASHBOARD}/partner/product/edit/${id}`,
      },
      market: {
        root: `${ROOTS.DASHBOARD}/partner/market`,
        info: `${ROOTS.DASHBOARD}/partner/market/info`,
        banner: `${ROOTS.DASHBOARD}/partner/market/banner`,
      },
      sale: {
        root: `${ROOTS.DASHBOARD}/partner/sale`,
        order: `${ROOTS.DASHBOARD}/partner/sale/order`,
        delivery: `${ROOTS.DASHBOARD}/partner/sale/delivery`,
        cancel: `${ROOTS.DASHBOARD}/partner/sale/cancel`,
        return: `${ROOTS.DASHBOARD}/partner/sale/return`,
      },
      settlement: {
        root: `${ROOTS.DASHBOARD}/partner/settlement`,
        list: `${ROOTS.DASHBOARD}/partner/settlement/list`,
        product: `${ROOTS.DASHBOARD}/partner/settlement/product`,
      },
      coupon: `${ROOTS.DASHBOARD}/partner/coupon`,
      review: `${ROOTS.DASHBOARD}/partner/review`,
      inquiry: {
        root: `${ROOTS.DASHBOARD}/partner/inquiry`,
        customer: `${ROOTS.DASHBOARD}/partner/inquiry/customer`,
        center: `${ROOTS.DASHBOARD}/partner/inquiry/center`,
      },
      notice: `${ROOTS.DASHBOARD}/partner/notice`,
      policy: {
        root: `${ROOTS.DASHBOARD}/partner/policy`,
        terms: `${ROOTS.DASHBOARD}/partner/policy/terms`,
        privacy: `${ROOTS.DASHBOARD}/partner/policy/privacy`,
        category: `${ROOTS.DASHBOARD}/partner/policy/category`,
      },
      etc: {
        root: `${ROOTS.DASHBOARD}/partner/etc`,
        error: `${ROOTS.DASHBOARD}/partner/etc/error`,
        dev: `${ROOTS.DASHBOARD}/partner/etc/dev`,
        new: `${ROOTS.DASHBOARD}/partner/etc/new`,
      },
    },
  },
};
