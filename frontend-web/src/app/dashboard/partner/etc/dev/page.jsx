import { CONFIG } from "src/global-config";
import { EtcListView } from "src/sections/partner/etc/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 기능제안` };

export default async function Page() {
  return <EtcListView type="feature" />;
}
