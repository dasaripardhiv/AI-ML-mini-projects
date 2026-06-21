import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata: Metadata = {
  title: 'FIFA Predictor Arena | AI Football Match Predictor',
  description: 'Predict football match outcomes using virtual Fan Tokens, earn rewards, unlock achievements, climb leaderboards, and engage with AI-powered match insights.',
  keywords: 'fifa, football prediction, soccer, fan tokens, ai predictions, sports leaderboard, gamified sports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <meta name="theme-color" content="#030510" />
      </head>
      <body className="antialiased min-h-screen bg-[#030510]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
