import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFlip · Portal de Inversores",
  description: "Portal premium para inversores de SmartFlip",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#0f172a] text-white min-h-screen" style={{fontFamily:"system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Noto Sans',sans-serif"}}>
        {children}
      </body>
    </html>
  );
}
