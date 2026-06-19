import { AppProvider } from "@/lib/app-context";
import { ClientDataProvider } from "@/lib/client-data/client-context";
import { GlobalFormsProvider } from "@/lib/global-forms-context";
import { GlobalForms } from "./global-forms";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ClientDataProvider>
        <GlobalFormsProvider>
          <div className="flex h-screen overflow-hidden text-[#14223B]">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6 pb-14">
                {children}
              </main>
            </div>
          </div>
          <GlobalForms />
        </GlobalFormsProvider>
      </ClientDataProvider>
    </AppProvider>
  );
}
