import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Hisaab",
  description: "Log in or create your Hisaab store account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg-app text-text-primary">
      {children}
    </div>
  );
}
