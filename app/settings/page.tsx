import BillingPanel from "@/app/settings/BillingPanel";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-white/60">Role-ready auth and env configuration.</p>

        <BillingPanel />
      </div>
    </div>
  );
}
