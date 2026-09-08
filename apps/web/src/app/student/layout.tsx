import { StudentSidebar } from "@/components/student-sidebar";
import { PortalShell } from "@/components/portal-shell";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="student">
      <PortalShell sidebar={<StudentSidebar />}>{children}</PortalShell>
    </div>
  );
}
