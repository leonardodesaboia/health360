import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Health360 · Demonstração", template: "%s · Health360" },
  description:
    "Protótipo de acompanhamento preventivo com dados sintéticos. Sem validação clínica.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
