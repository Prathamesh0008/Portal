import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-amber-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="p-4 pt-20 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
