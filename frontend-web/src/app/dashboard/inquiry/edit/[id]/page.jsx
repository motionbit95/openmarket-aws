import { CONFIG } from "src/global-config";
import { BasicForm } from "src/components/form/basic-form";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 1:1문의 수정` };

export default async function Page({ params }) {
  const { id } = await params;

  return <BasicForm id={id} />;
}
