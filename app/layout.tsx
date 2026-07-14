import type {
  Metadata,
} from "next";
import type {
  ReactNode,
} from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Niraj Analytics",
    template: "%s | Niraj Analytics",
  },

  description:
    "Private analytics, content management, and publishing platform for nirajchaurasiya.com.",

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}