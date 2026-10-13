import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OPD Flow | Dr. S.N. Medical College Jodhpur | Clinical Triage System',
  description:
    'Deterministic, explainable clinical triage and patient queue prioritization for outpatient departments. Aayu 2026 AI Medical Hackathon Track 01.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className="min-h-full flex flex-col antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
