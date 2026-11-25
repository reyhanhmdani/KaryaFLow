import React from "react";
import { requireUser } from "@/lib/auth";
import { formatIndonesianDate } from "@/lib/format";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const serverDate = formatIndonesianDate();

  return (
    <div className="min-h-[100dvh] bg-[#F6F4EE] flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <TopBar serverDate={serverDate} />
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 max-w-[1360px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
