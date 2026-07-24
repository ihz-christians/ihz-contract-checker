import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
} from 'lucide-react';

export default function CaseDetail() {
  const { caseId } = useParams();

  // Mock case data
  const caseData = {
    id: caseId,
    customerName: 'Max Mustermann',
    riskScore: 85,
    riskLevel: 'high',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    product: 'Lebensversicherung',
    findings: [
      {
        id: '1',
        type: 'risk',
        severity: 85,
        text: 'Hoher Verkaufsdruck erkannt',
        evidence: 'Mehrfache Unterbrechungen des Kunden während wichtiger Fragen',
        recommendation: 'Verkäuferschulung zu ethischen Verkaufstechniken empfohlen',
      },
      {
        id: '2',
        type: 'factCheck',
        severity: 70,
        text: 'Unbestätigte Behauptung über Rendite',
        evidence: 'Verkäufer behauptete 8% garantierte Rendite, Vertrag zeigt nur 3%',
        recommendation: 'Korrekte Informationen nachliefern und dokumentieren',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fall #{caseData.id}</h1>
          <p className="text-muted-foreground">
            {caseData.customerName} • {caseData.product}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive">Hoches Risiko</Badge>
          <Badge variant="outline">Abgeschlossen</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risiko-Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{caseData.riskScore}/100</div>
            <Progress value={caseData.riskScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{caseData.findings.length}</div>
            <p className="text-xs text-muted-foreground">Erkannte Probleme</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bearbeitungszeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4h 15m</div>
            <p className="text-xs text-muted-foreground">Upload bis Abschluss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="font-medium">Analysiert</span>
            </div>
            <p className="text-xs text-muted-foreground">Vor 2 Stunden</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="findings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="transcript">Transkript</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-4">
          {caseData.findings.map((finding) => (
            <Card key={finding.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    {finding.text}
                  </CardTitle>
                  <Badge variant="destructive">Schweregrad: {finding.severity}/100</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Nachweis:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {finding.evidence}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Empfehlung:</h4>
                  <p className="text-sm text-accent-foreground bg-accent p-3 rounded-md">
                    {finding.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Gesprächstranskript</CardTitle>
              <CardDescription>Automatisch generiert mit Sprecher-Identifikation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline">Verkäufer</Badge>
                  <p className="text-sm">
                    Guten Tag Herr Mustermann, ich freue mich, dass Sie sich Zeit für unser Gespräch
                    nehmen. Ich möchte Ihnen heute eine einmalige Gelegenheit vorstellen...
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary">Kunde</Badge>
                  <p className="text-sm">
                    Ja, hallo. Ich bin noch nicht sicher, ob ich heute wirklich...
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline">Verkäufer</Badge>
                  <p className="text-sm bg-destructive/10 p-2 rounded border-l-4 border-destructive">
                    <strong>⚠️ Problematisch:</strong> Das verstehe ich, aber diese Gelegenheit gibt
                    es nur heute. Mit unserer Lebensversicherung können Sie{' '}
                    <strong>garantiert 8% Rendite</strong> erwarten...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Verarbeitungs-Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Upload abgeschlossen</p>
                    <p className="text-sm text-muted-foreground">15.01.2024, 10:30</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Audio-Transkription</p>
                    <p className="text-sm text-muted-foreground">15.01.2024, 11:15</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Sprecher-Erkennung</p>
                    <p className="text-sm text-muted-foreground">15.01.2024, 12:30</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Sentiment-Analyse</p>
                    <p className="text-sm text-muted-foreground">15.01.2024, 13:45</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium">Faktenchecks abgeschlossen</p>
                    <p className="text-sm text-muted-foreground">15.01.2024, 14:45</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Audio-Aufnahme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Dauer: 45:32 Min • Größe: 23.4 MB</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Vertragsdokument
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">PDF • 12 Seiten • 2.1 MB</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Herunterladen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
