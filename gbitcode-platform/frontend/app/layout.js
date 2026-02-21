import "./globals.css";
import { Providers } from "@/components/Providers"; // Ajuste o caminho se necessário

export const metadata = {
  title: "Gbitcode Platform",
  description: "Onde o seu código ganha vida",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="antialiased">
        {/* O Providers envolve tudo para que useSession() funcione em qualquer página */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}