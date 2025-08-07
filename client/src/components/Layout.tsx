import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64" style={{ margin: 0, padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
