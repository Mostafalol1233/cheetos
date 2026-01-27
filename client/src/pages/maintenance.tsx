import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

interface MaintenancePageProps {
  reason?: string;
  onRetry?: () => void;
}

export default function MaintenancePage({ reason, onRetry }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEO
        title="Maintenance | Diaa Store"
        description="We are currently performing maintenance. Please try again shortly."
        image="https://files.catbox.moe/brmkrj.png"
        url={window.location.href}
      />

      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-card/40 backdrop-blur p-8 text-center space-y-4">
        <div className="flex justify-center">
          <img
            src="https://files.catbox.moe/brmkrj.png"
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-foreground">Website Under Maintenance</h1>
        <p className="text-muted-foreground">
          We’re upgrading the service. Please come back in a few minutes.
        </p>

        {reason ? (
          <p className="text-sm text-muted-foreground">{reason}</p>
        ) : null}

        <div className="pt-2">
          <Button onClick={onRetry} className="btn-gaming">
            Retry
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this keeps happening, the backend or database may be temporarily unavailable.
        </p>
      </div>
    </div>
  );
}
