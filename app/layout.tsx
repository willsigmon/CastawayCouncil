import "./globals.css";
import type { Metadata } from "next";
import { Header } from "./_components/Header";
import { SeasonProvider } from "./_components/SeasonContext";
import { PhaseIndicator } from "./_components/PhaseIndicator";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { ToastProvider } from "./_components/Toast";
import { SkipToContent } from "./_components/SkipToContent";

export const metadata: Metadata = {
  title: "Castaway Council",
  description: "Real-time slow-burn social survival RPG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#FF6B6B" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <SeasonProvider>
              <SkipToContent />
              <Header />
              <PhaseIndicator />
              <main id="main-content">{children}</main>
            </SeasonProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
