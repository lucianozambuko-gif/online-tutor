import { StudentSidebar } from "@/components/student-sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="student" className="flex min-h-screen">
      <StudentSidebar />
      <div className="min-w-0 flex-1 px-10 py-9">{children}</div>
    </div>
  );
}
