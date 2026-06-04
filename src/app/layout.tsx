import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mount Litera Zee School | Portal",
  description: "Mount Litera Zee School - Nurturing Potential, Unleashing Brilliance. Access your student, teacher, or principal portal.",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
