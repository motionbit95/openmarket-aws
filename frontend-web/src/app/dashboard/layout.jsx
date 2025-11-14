import { CONFIG } from "src/global-config";
import { DashboardLayout } from "src/layouts/dashboard";

import { AuthGuard } from "src/auth/guard";
import { Toaster } from "sonner";

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  if (CONFIG.auth.skip) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
