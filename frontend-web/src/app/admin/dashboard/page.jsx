import { CONFIG } from "src/global-config";
import AdminDashboardView from "src/sections/admin/view/admin-dashboard-view";

// ----------------------------------------------------------------------

export const metadata = { title: `관리자 대시보드 - ${CONFIG.appName}` };

export default function Page() {
  return <AdminDashboardView />;
}
