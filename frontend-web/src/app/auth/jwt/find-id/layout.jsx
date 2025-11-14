import { GuestGuard } from "src/auth/guard";

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  return <GuestGuard>{children}</GuestGuard>;
}
