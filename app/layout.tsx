import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Finebase Labs · Customer Portal",
  description: "Manage your Finebase Labs products, purchases, refunds and support.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
