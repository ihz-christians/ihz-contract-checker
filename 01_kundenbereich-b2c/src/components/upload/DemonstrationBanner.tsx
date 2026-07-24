import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DemonstrationBanner() {
  return (
    <Alert className="border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertDescription className="text-warning-foreground">
        <strong>Nur zu Demonstrationszwecken:</strong> Diese Upload-Funktion dient ausschließlich
        der Demonstration der KI-basierten Compliance-Analyse. Hochgeladene Dateien werden nicht
        dauerhaft gespeichert und nur für Testzwecke verwendet.
      </AlertDescription>
    </Alert>
  );
}

export function ProcessingNote() {
  return (
    <Alert className="border-accent bg-accent/10 mt-4">
      <Info className="h-4 w-4 text-accent" />
      <AlertDescription className="text-accent-foreground">
        <strong>Hinweis:</strong> In der realen Anwendung würden hier echte Audio-Analysen und
        Compliance-Prüfungen durchgeführt. Die Ergebnisse basieren auf Mock-Daten zu
        Demonstrationszwecken.
      </AlertDescription>
    </Alert>
  );
}
