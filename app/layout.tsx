import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verdex",
  description: "AI-powered stock forecasting and analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-ux="technical"
      className={`dark ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* No-flash: apply the saved display mode before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('ux-mode');if(m==='simple'||m==='technical')document.documentElement.dataset.ux=m;}catch(e){}`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
