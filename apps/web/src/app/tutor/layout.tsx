import { TutorSidebar } from "@/components/tutor-sidebar";

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-portal="tutor" className="flex min-h-screen">
      <TutorSidebar />
      <div className="min-w-0 flex-1 px-10 py-9">{children}</div>
    </div>
  );
}
