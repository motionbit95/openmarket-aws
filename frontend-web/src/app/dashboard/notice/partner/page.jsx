import { CONFIG } from "src/global-config";
import { NoticeListView } from "src/sections/notice/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 판매자공지사항` };

export default async function Page() {
  return <NoticeListView type="seller" />;
}
