import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import Link from "next/link";
import React from "react";
import { TaskProvider } from "./contexts/TaskContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#fff", color: "#000" }}>
        <AuthProvider>
          <TaskProvider>
            <div style={{ margin: "0 auto", padding: 10 }}>
              {/* Navbar */}
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2>
                  <Link href="/">MyApp</Link>
                </h2>
                <nav style={{ display: "flex", gap: 10 }}>
                  <Link href="/register">Register</Link>
                  <Link href="/login">Login</Link>
                </nav>
              </header>

              {/* Page content */}
              <main>{children}</main>
            </div>
          </TaskProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
