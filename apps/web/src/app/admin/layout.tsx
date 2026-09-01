import { PortalHeader } from "@/components/portal-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="admin" className="min-h-screen">
      <PortalHeader portalRoot="/admin" />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
