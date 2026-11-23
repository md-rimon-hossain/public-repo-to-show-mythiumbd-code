export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="gradient-mesh min-h-screen text-foreground">
      {children}
    </div>
  );
}
