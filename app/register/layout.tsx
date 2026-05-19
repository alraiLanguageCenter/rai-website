/**
 * The /register route uses a stripped-down layout (no header/footer) so the
 * registration experience feels focused and works the same whether the visitor
 * scanned a QR code on a flyer or followed a link from the site. The full
 * Header + Chatbot UI lives under /[locale]/* and would feel out of place
 * around an application form.
 */
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
