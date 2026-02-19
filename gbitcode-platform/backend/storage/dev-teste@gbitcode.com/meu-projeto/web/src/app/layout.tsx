import './globals.css';

export const metadata = {
  title: 'Web3Gbit Forge App',
  description: 'Gerado pelo Web3Gbit-Forge CLI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{margin: 0}}>{children}</body>
    </html>
  );
}