import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

// No `template`: tab titles stay the bare page name ("Dashboard", "Players"). The league is
// already named in the sidebar and the favicon, so repeating it in every tab only crowds them.
export const metadata: Metadata = { title: { default: "Sleeper Fantasy", template: "%s" }, description: "A live Sleeper fantasy football league dashboard." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("dark", dmSans.variable, "font-sans")} style={{ colorScheme: "dark" }}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
