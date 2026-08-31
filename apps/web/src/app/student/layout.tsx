export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-portal="student">{children}</div>;
}
