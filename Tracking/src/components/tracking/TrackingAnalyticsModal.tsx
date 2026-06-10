import { EyeMovementGraph } from "./EyeMovementGraph";

type TrackingAnalyticsModalProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
};

export function TrackingAnalyticsModal({
  open,
  title,
  closeLabel,
  onClose,
}: TrackingAnalyticsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-blue/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-analytics-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border-[3px] border-blue bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-blue/20 px-6 py-4">
          <h2
            id="tracking-analytics-title"
            className="text-xl font-bold text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-blue px-4 py-2 text-sm font-semibold text-blue transition hover:bg-blue/10"
          >
            {closeLabel}
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <EyeMovementGraph />
        </div>
      </div>
    </div>
  );
}
