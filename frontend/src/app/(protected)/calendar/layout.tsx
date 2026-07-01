import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "BasicScheduler Demo",
    description: "A lightweight React calendar component",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}