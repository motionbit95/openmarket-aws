import { CONFIG } from "src/global-config";

import { UserListView } from "src/sections/user/view";

// ----------------------------------------------------------------------

export const metadata = { title: `${CONFIG.appName} - 유저관리` };

export default async function Page() {
  return <UserListView />;
}
