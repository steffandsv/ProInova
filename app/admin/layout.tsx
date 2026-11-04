import { readSession } from "@/lib/auth";
import AdminNav from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = readSession();

  return (
    <div className="grid wide-layout" style={{ gap: 14 }}>
      <AdminNav role={session?.role ?? ""} />
      {children}
    </div>
  );
}
