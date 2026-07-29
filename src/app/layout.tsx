import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "Dashboard de seguimiento de valor ganado: indicadores por actividad y consolidados del proyecto.",
  title: "Seguimiento de Valor Ganado",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
