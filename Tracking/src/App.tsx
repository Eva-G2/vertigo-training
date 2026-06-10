import { EyeTrackingProvider } from "@/state";
import { DiagnosticPage } from "@/pages/DiagnosticPage";

export default function App() {
  return (
    <EyeTrackingProvider>
      <DiagnosticPage />
    </EyeTrackingProvider>
  );
}
