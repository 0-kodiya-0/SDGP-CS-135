import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/custom/footer/Footer";
import Navbar from "@/components/custom/navbar/Navbar";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Fusion space",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ThemeProvider attribute="class">
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
