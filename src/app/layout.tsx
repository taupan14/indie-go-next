import "./globals.css";
import { ThemeProvider } from "next-themes";
import { getLocale } from "@/i18n";
import Header from "@/components/Header";
import NavigationProgress from "@/components/NavigationProgress";
import Footer from "@/components/Footer";
import FooterGate from "@/components/FooterGate";

export const metadata = {
  title: "Indie GO",
  description: "Ruang diskusi komunitas",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavigationProgress />
          <Header />
          <div className="flex-1">{children}</div>
          <FooterGate>
            <Footer />
          </FooterGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
