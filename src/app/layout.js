import { Inter } from "next/font/google";
import LayoutWrapper from "@/components/LayoutWrapper";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { FilePreviewProvider } from "@/components/files/FilePreviewProvider";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Aman Foundation - Impact Portal",
  description:
    "High-end editorial dashboard system designed for clarity, prestige, and actionable data.",
  applicationName: "Aman Portal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aman Portal",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#006857",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex bg-surface text-on-surface">
        <ToastProvider>
          <AuthProvider>
            <PwaProvider>
              <FilePreviewProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </FilePreviewProvider>
            </PwaProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

