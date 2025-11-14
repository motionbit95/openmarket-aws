import { CONFIG } from "src/global-config";
import AdminDashboardView from "src/sections/admin/view/admin-dashboard-view";
import PartnerDashboardPage from "./partner/page";

// ----------------------------------------------------------------------

const isPartnerMode = process.env.NEXT_PUBLIC_BUILD_MODE === "partner";

export const metadata = {
  title: isPartnerMode ? `파트너 대시보드 - ${CONFIG.appName}` : `관리자 대시보드 - ${CONFIG.appName}`
};

export default function Page() {
  return isPartnerMode ? <PartnerDashboardPage /> : <AdminDashboardView />;
}
