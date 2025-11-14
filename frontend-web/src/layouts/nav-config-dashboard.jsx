import React from "react";
import { paths } from "src/routes/paths";

import { CONFIG } from "src/global-config";

import { Label } from "src/components/label";
import { SvgColor } from "src/components/svg-color";

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon("ic-job"),
  blog: icon("ic-blog"),
  chat: icon("ic-chat"),
  mail: icon("ic-mail"),
  user: icon("ic-user"),
  file: icon("ic-file"),
  lock: icon("ic-lock"),
  tour: icon("ic-tour"),
  order: icon("ic-order"),
  label: icon("ic-label"),
  blank: icon("ic-blank"),
  kanban: icon("ic-kanban"),
  folder: icon("ic-folder"),
  course: icon("ic-course"),
  banking: icon("ic-banking"),
  booking: icon("ic-booking"),
  invoice: icon("ic-invoice"),
  product: icon("ic-product"),
  calendar: icon("ic-calendar"),
  disabled: icon("ic-disabled"),
  external: icon("ic-external"),
  menuItem: icon("ic-menu-item"),
  ecommerce: icon("ic-ecommerce"),
  analytics: icon("ic-analytics"),
  dashboard: icon("ic-dashboard"),
  parameter: icon("ic-parameter"),
};

// ----------------------------------------------------------------------

function buildNavWithFallback(navItems) {
  return navItems.map((item) => {
    if (!item.path && item.children?.length > 0) {
      return {
        ...item,
        path: item.children[0].path, // fallback to first child's path
      };
    }
    return item;
  });
}

export const navData = [
  {
    items: buildNavWithFallback([
      { title: "대시보드", path: paths.dashboard.root, icon: ICONS.analytics },
      {
        title: "이용자관리",
        clickable: false,
        path: paths.dashboard.user.customer,
        icon: ICONS.user,
        children: [
          { title: "유저관리", path: paths.dashboard.user.customer },
          { title: "판매자관리", path: paths.dashboard.user.seller },
        ],
      },
      // {
      //   title: "주문관리",
      //   path: paths.dashboard.orders,
      //   icon: ICONS.order,
      // },
      // {
      //   title: "매출관리",
      //   path: paths.dashboard.sales,
      //   icon: ICONS.analytics,
      // },
      {
        title: "정산관리",
        clickable: false,
        path: paths.dashboard.settlement.root,
        icon: ICONS.invoice,
      },
      {
        title: "배너관리",
        clickable: false,
        path: paths.dashboard.banner.advertiser,
        icon: ICONS.kanban,
        children: [
          { title: "광고주배너등록", path: paths.dashboard.banner.advertiser },
          { title: "판매자배너등록", path: paths.dashboard.banner.partner },
        ],
      },
      {
        title: "쿠폰관리",
        clickable: false,
        path: paths.dashboard.coupon.customer,
        icon: ICONS.label,
        children: [
          { title: "관리자발급쿠폰", path: paths.dashboard.coupon.customer },
          { title: "판매자발급쿠폰", path: paths.dashboard.coupon.partner },
        ],
      },
      {
        title: "고객센터",
        clickable: false,
        path: paths.dashboard.inquiry.root,
        icon: ICONS.chat,
        children: [
          { title: "1:1문의", path: paths.dashboard.inquiry.root },
          { title: "이용자가이드", path: paths.dashboard.inquiry.guide },
          { title: "FAQ", path: paths.dashboard.inquiry.faq },
        ],
      },
      {
        title: "공지사항",
        clickable: false,
        path: paths.dashboard.notice.customer,
        icon: ICONS.mail,
        children: [
          { title: "유저공지사항", path: paths.dashboard.notice.customer },
          { title: "판매자공지사항", path: paths.dashboard.notice.partner },
        ],
      },
      { title: "이용약관", path: paths.dashboard.policy, icon: ICONS.blog },
      {
        title: "제보/제안",
        clickable: false,
        path: paths.dashboard.etc.error,
        icon: ICONS.file,
        children: [
          { title: "오류제보", path: paths.dashboard.etc.error },
          { title: "기능제안", path: paths.dashboard.etc.dev },
        ],
      },
    ]),
  },
];

export const partnerNavData = [
  {
    items: buildNavWithFallback([
      {
        title: "대시보드",
        path: paths.dashboard.partner.root,
        icon: ICONS.analytics,
      },
      {
        title: "상품관리",
        clickable: false,
        path: paths.dashboard.partner.product.list,
        icon: ICONS.file,
        children: [
          { title: "상품목록", path: paths.dashboard.partner.product.list },
          {
            title: "상품등록",
            path: paths.dashboard.partner.product.create,
          },
        ],
      },
      {
        title: "마켓관리",
        clickable: false,
        path: paths.dashboard.partner.market.info,
        icon: ICONS.file,
        children: [
          { title: "마켓정보관리", path: paths.dashboard.partner.market.info },
          {
            title: "배너관리",
            path: paths.dashboard.partner.market.banner,
          },
        ],
      },
      {
        title: "판매관리",
        clickable: false,
        path: paths.dashboard.partner.sale.order,
        icon: ICONS.chat,
        children: [
          { title: "주문내역", path: paths.dashboard.partner.sale.order },
          { title: "배송관리", path: paths.dashboard.partner.sale.delivery },
          { title: "취소관리", path: paths.dashboard.partner.sale.cancel },
          { title: "반품관리", path: paths.dashboard.partner.sale.return },
        ],
      },
      {
        title: "정산관리",
        clickable: false,
        path: paths.dashboard.partner.settlement.list,
        icon: ICONS.file,
        children: [
          { title: "정산내역", path: paths.dashboard.partner.settlement.list },
          {
            title: "상품별정산내역",
            path: paths.dashboard.partner.settlement.product,
          },
        ],
      },
      {
        title: "리뷰관리",
        path: paths.dashboard.partner.review,
        icon: ICONS.analytics,
      },
      {
        title: "쿠폰관리",
        path: paths.dashboard.partner.coupon,
        icon: ICONS.analytics,
      },
      {
        title: "문의관리",
        clickable: false,
        path: paths.dashboard.partner.inquiry.customer,
        icon: ICONS.file,
        children: [
          { title: "고객문의", path: paths.dashboard.partner.inquiry.customer },
          {
            title: "센터문의",
            path: paths.dashboard.partner.inquiry.center,
          },
        ],
      },
      {
        title: "공지사항",
        path: paths.dashboard.partner.notice,
        icon: ICONS.analytics,
      },
      {
        title: "약관확인",
        clickable: false,
        path: paths.dashboard.partner.policy.terms,
        icon: ICONS.file,
        children: [
          { title: "이용약관", path: paths.dashboard.partner.policy.terms },
          {
            title: "개인정보 처리방침",
            path: paths.dashboard.partner.policy.privacy,
          },
          {
            title: "카테고리 수수료 약정서",
            path: paths.dashboard.partner.policy.category,
          },
        ],
      },
      {
        title: "기타",
        clickable: false,
        path: paths.dashboard.partner.etc.error,
        icon: ICONS.file,
        children: [
          { title: "오류제보", path: paths.dashboard.partner.etc.error },
          { title: "기능제안", path: paths.dashboard.partner.etc.dev },
        ],
      },
    ]),
  },
];
