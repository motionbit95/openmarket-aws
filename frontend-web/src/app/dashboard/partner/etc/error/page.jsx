import { CONFIG } from "src/global-config";
import { EtcListView } from "src/sections/partner/etc/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 오류제보` };

export default async function Page() {
  return <EtcListView type="error" />;
}
