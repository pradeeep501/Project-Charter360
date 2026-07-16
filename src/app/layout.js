import './globals.css';

export const metadata = {
  title: 'Project Charter Builder',
  description: 'RACI-style project charters with AI generation and Outlook export.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
