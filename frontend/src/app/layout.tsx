import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'EduSys - Ta\'lim Boshqaruv Tizimi',
  description: 'EduSys ta\'lim markazi boshqaruv platformasi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
