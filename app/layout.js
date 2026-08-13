import "./globals.css";

export const metadata = {
  title: "Enterprise Model Router",
  description: "Policy-controlled, cost-aware model routing on Vercel AI Gateway.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

