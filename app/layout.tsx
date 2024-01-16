"use client"

import "./globals.css"
import Navbar from "./components/Navbar"
import { UserProvider } from "./UserContext"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <div className="flex flex-col items-center justify-start min-h-screen">
            <Navbar />
            {children}
          </div>
        </UserProvider>
      </body>
    </html>
  )
}
