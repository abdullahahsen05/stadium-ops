import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "StadiumOps Command Center",
  description: "Stadium construction operations management — inventory, procurement, deliveries, invoices, payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #E3E8F0",
              color: "#14223B",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
