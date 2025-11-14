import React from "react";

import { CONFIG } from "src/global-config";
import { MyPageView } from "src/sections/partner/mypage/page";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 마켓 정보관리` };

export default async function Page() {
  return <MyPageView title="마켓정보관리" />;
}
