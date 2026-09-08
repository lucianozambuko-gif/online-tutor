import { Card } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { SubscriptionSettingsCard } from "@/components/subscription-settings-card";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DangerZone } from "@/components/danger-zone";

export default function StudentSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your subscription, appearance, and account.</p>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Appearance</h2>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Subscription</h2>
        <div className="mt-4">
          <SubscriptionSettingsCard />
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-ink-900">Password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <h2 className="font-display text-lg font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <div className="mt-4">
          <DangerZone />
        </div>
      </Card>
    </div>
  );
}
