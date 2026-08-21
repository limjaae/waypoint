import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint: Command Centre",
  description: "Operational resource allocation and execution, built around a transparent scoring engine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {children}
        <Toaster theme="dark" position="bottom-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
