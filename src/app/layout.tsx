import type { Metadata } from "next";
import { Bricolage_Grotesque, Onest, JetBrains_Mono } from "next/font/google";
import "./leaflet.css";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KaryaFlow — Modern Employee Portal & HR Workspace",
  description: "Smart Attendance, Leave, Payroll & Performance Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${onest.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#F6F4EE] text-[#1B1C1E] font-sans selection:bg-[#F7C331]/40 selection:text-[#1B1C1E]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
