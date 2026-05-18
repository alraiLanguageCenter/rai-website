// Root passthrough: <html>/<body>/lang/dir come from app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
