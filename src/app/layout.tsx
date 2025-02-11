import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Jouta - Voice Journal & Time Blocking",
  description: "Convert your voice into journals and time-blocked tasks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/sf-pro-display"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-purple-700" suppressHydrationWarning>
        <div className="fixed inset-0 bg-black/10" />
        <div className="relative min-h-screen">
          <Navigation />
          <main className="pt-24 pb-8 px-4 max-w-4xl mx-auto">
            <div className="animate-fade-in">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
