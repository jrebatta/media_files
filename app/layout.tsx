import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galería Personal",
  description: "Galería simple de fotos y videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
