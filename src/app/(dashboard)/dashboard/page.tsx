import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { MeCard } from "@/components/dashboard/MeCard";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      <MeCard />
    </div>
  );
}
