import { TutorSidebar } from "@/components/tutor-sidebar";
import { PortalShell } from "@/components/portal-shell";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="tutor">
      <PortalShell sidebar={<TutorSidebar />}>{children}</PortalShell>
    </div>
  );
}
