import { CONFIG } from "src/global-config";
import { ProductCreateView } from "src/sections/partner/product/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 상품등록` };

export default async function Page() {
  return <ProductCreateView />;
}
