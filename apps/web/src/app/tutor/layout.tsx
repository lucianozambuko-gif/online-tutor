import { PortalHeader } from "@/components/portal-header";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="tutor" className="min-h-screen">
      <PortalHeader portalRoot="/tutor" />
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
