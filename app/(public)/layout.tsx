export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout without app shell/sidebar for customer-facing pages
  return <>{children}</>;
}

