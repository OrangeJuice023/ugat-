import "./globals.css";

export const metadata = {
  title: "UGAT — Organizational Reasoning",
  description: "See what your organization feels before it breaks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
