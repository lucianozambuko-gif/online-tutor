import { PortalHeader } from "@/components/portal-header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="student" className="min-h-screen">
      <PortalHeader portalRoot="/student" />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
