import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TNP Agents",
  description: "ProcessMate, SFD Generator, ScvMaker - Automatisez votre documentation technique",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-white text-gray-900 font-sans antialiased">
        <div className="flex flex-col min-h-screen">
          {/* Simple Header - Logo only */}
          <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-6 py-4">
              <Link href="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity w-fit">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TNP Agents</h1>
                  <p className="text-xs text-gray-500">Retour à l'accueil</p>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-gray-50 py-8">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <p className="text-sm text-gray-600">
                    © 2024TNP Agents. Tous droits réservés.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <Link href="/clinic" className="text-gray-600 hover:text-purple-600 transition-colors">
                      ProcessMate
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/sfd" className="text-gray-600 hover:text-blue-600 transition-colors">
                      SFD Generator
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/scv-test" className="text-gray-600 hover:text-green-600 transition-colors">
                      ScvMaker
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}