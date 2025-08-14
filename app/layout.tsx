
export const metadata = { title: "SmartFlip · Portal de Inversores", description: "Descarga de documentos SmartFlip" };
import "./globals.css"; import Link from "next/link";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>
    <nav style={{display:"flex",gap:"1rem",padding:"12px 16px",borderBottom:"1px solid #eee"}}>
      <Link href="/dashboard">Dashboard</Link><Link href="/admin">Admin</Link><Link href="/login">Login</Link>
    </nav>
    <main style={{maxWidth:900,margin:"0 auto",padding:"24px"}}>{children}</main>
  </body></html>);
}
