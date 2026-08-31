export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-portal="admin">{children}</div>;
}
