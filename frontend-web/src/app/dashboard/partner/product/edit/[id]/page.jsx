import { CONFIG } from "src/global-config";
import { ProductCreateView } from "src/sections/partner/product/view";

export const metadata = { title: `${CONFIG.appName} - 상품 수정` };

export default async function Page({ params }) {
  const { id } = params;

  return <ProductCreateView productId={id} />;
}
