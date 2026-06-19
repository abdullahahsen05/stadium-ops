import { AppProvider } from "@/lib/app-context";
import { ClientDataProvider } from "@/lib/client-data/client-context";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ClientDataProvider>
        <div className="flex h-screen overflow-hidden text-[#14223B]">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6 pb-14">
              {children}
            </main>
          </div>
        </div>
      </ClientDataProvider>
    </AppProvider>
  );
}
