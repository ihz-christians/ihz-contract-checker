import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  User,
  Clock,
  Phone,
  FileText,
  PlayCircle,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Shield,
  Eye,
  Download,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { IndustryType } from '@/types/case';
import { getRiskBadgeVariant, getStatusBadgeVariant } from '@/lib/dashboard-utils';

interface IncidentInvestigationModalProps {
  open: boolean;
  onClose: () => void;
  incidentId: string;
  incidentType: string;
  agencyName: string;
}

// Helper function to determine industry and incident details
const getIncidentIndustry = (agencyName: string): IndustryType => {
  if (
    agencyName.includes('Vodafone') ||
    agencyName.includes('Telekom') ||
    agencyName.includes('O2')
  ) {
    return 'telecommunications';
  }
  if (
    agencyName.includes('E.ON') ||
    agencyName.includes('RWE') ||
    agencyName.includes('Vattenfall')
  ) {
    return 'energy';
  }
  return 'insurance';
};

export function IncidentInvestigationModal({
  open,
  onClose,
  incidentId,
  incidentType,
  agencyName,
}: IncidentInvestigationModalProps) {
  const industry = getIncidentIndustry(agencyName);

  // Industry-specific incident details
  const getIncidentDetails = () => {
    const baseDetails = {
      id: incidentId,
      type: incidentType,
      agency: agencyName,
      severity: 'critical' as const,
      reportedAt: '2024-01-15T09:30:00Z',
      status: 'active_investigation' as const,
      deadline: '2024-01-22T17:00:00Z',
      priority: 'high' as const,
    };

    switch (industry) {
      case 'telecommunications':
        return {
          ...baseDetails,
          reportedBy: 'Kunde Maria Schmidt',
          investigator: 'Dr. Thomas Weber (BNetzA)',
          authority: 'BNetzA',
        };
      case 'energy':
        return {
          ...baseDetails,
          reportedBy: 'Kunde Klaus Müller',
          investigator: 'Dr. Anna Fischer (BNetzA)',
          authority: 'BNetzA',
        };
      default: // insurance
        return {
          ...baseDetails,
          reportedBy: 'Kunde Hermann Müller',
          investigator: 'Dr. Sarah Weber (BaFin)',
          authority: 'BaFin',
        };
    }
  };

  const incidentDetails = getIncidentDetails();

  const caseDetails = {
    caseId: 'CASE-7842',
    customer: {
      name: 'Hermann Müller',
      age: 45,
      occupation: 'Ingenieur',
      address: 'München, Bayern',
      phone: '+49 89 123456789',
      email: 'h.mueller@email.de',
    },
    agent: {
      name: 'Marcus Berger',
      license: 'IHK-V-2020-1123',
      experience: '4 Jahre',
      previousIncidents: 3,
      revenue2023: '€127.4k',
    },
    product: {
      name: 'Premium Lebensversicherung Plus',
      type: 'Kapitallebensversicherung',
      sum: '€150.000',
      premium: '€280/Monat',
      commission: '€4.200 (15%)',
      riskClass: 'Hoch',
    },
    timeline: {
      contactDate: '2024-01-10',
      consultationDate: '2024-01-12',
      contractSigned: '2024-01-12',
      complaintDate: '2024-01-15',
      investigationStart: '2024-01-15',
    },
  };

  const evidence = [
    {
      type: 'audio',
      title: 'Beratungsgespräch Aufzeichnung',
      duration: '47:23 min',
      timestamp: '2024-01-12 14:30',
      riskScore: 89,
      keyFindings: [
        'Hochdruck-Taktik: "Sie müssen heute entscheiden"',
        'Unvollständige Risiko-Aufklärung bei Kapitalmarkt-Risiken',
        'Falsche Aussagen über Garantie-Leistungen',
      ],
      status: 'analyzed',
    },
    {
      type: 'document',
      title: 'Beratungsprotokoll',
      pages: 3,
      timestamp: '2024-01-12 16:45',
      riskScore: 76,
      keyFindings: [
        'Unvollständige Dokumentation der Risiko-Präferenz',
        'Fehlende Aufklärung über Alternativen',
        'Nachträgliche Änderungen ohne Kundensignatur',
      ],
      status: 'reviewed',
    },
    {
      type: 'email',
      title: 'E-Mail Nachfass-Kommunikation',
      count: 7,
      timestamp: '2024-01-12 - 2024-01-15',
      riskScore: 82,
      keyFindings: [
        'Wiederholte Drängen zur Vertragsunterzeichnung',
        'Irreführende Informationen über Widerrufsrecht',
        'Drohung mit "Verschlechterung der Konditionen"',
      ],
      status: 'under_review',
    },
    {
      type: 'complaint',
      title: 'Kundenbeschwerdebrief',
      timestamp: '2024-01-15 09:30',
      keyFindings: [
        'Kunde fühlte sich unter Druck gesetzt',
        'Wichtige Risiken wurden nicht erklärt',
        'Berater hat hohe Kosten verschwiegen',
        'Widerruf wurde erschwert',
      ],
      status: 'new',
    },
  ];

  const violations = [
    {
      regulation: 'IDD Art. 20 (Beratungspflichten)',
      severity: 'critical',
      description: 'Unzureichende Bedarfs- und Geeignetheitsprüfung',
      evidence: 'Beratungsprotokoll, Aufzeichnung Min. 12:30-15:45',
      penalty: 'Bis zu €50.000 Bußgeld',
    },
    {
      regulation: 'VVG § 6 (Informationspflichten)',
      severity: 'high',
      description: 'Unvollständige Aufklärung über Kosten und Risiken',
      evidence: 'E-Mail-Kommunikation, Aufzeichnung Min. 23:10-28:00',
      penalty: 'Bis zu €25.000 Bußgeld',
    },
    {
      regulation: 'UWG § 4a (Unlautere Handlungen)',
      severity: 'high',
      description: 'Aggressive Verkaufstaktiken und Hochdruck-Methoden',
      evidence: 'Aufzeichnung Min. 5:20-8:15, 41:00-44:30',
      penalty: 'Zivilrechtliche Ansprüche',
    },
  ];

  const timeline = [
    {
      date: '2024-01-15 09:30',
      event: 'Beschwerde eingegangen',
      actor: 'Hermann Müller',
      status: 'completed',
    },
    {
      date: '2024-01-15 11:00',
      event: 'Vorfall klassifiziert',
      actor: 'System/AI',
      status: 'completed',
    },
    {
      date: '2024-01-15 14:15',
      event: 'Ermittlungsverfahren eingeleitet',
      actor: 'Dr. Sarah Weber',
      status: 'completed',
    },
    {
      date: '2024-01-16 10:00',
      event: 'Beweismaterial angefordert',
      actor: 'BaFin',
      status: 'completed',
    },
    {
      date: '2024-01-17 15:30',
      event: 'Gespräch mit Agentur-Leitung',
      actor: 'Dr. Sarah Weber',
      status: 'in_progress',
    },
    {
      date: '2024-01-19 09:00',
      event: 'Anhörung Marcus Berger',
      actor: 'BaFin',
      status: 'scheduled',
    },
    {
      date: '2024-01-22 17:00',
      event: 'Vorläufiger Bericht fällig',
      actor: 'Dr. Sarah Weber',
      status: 'pending',
    },
  ];

  const getSeverityBadge = (severity: string) => {
    const variant = getRiskBadgeVariant(severity);
    const label =
      severity === 'low'
        ? 'Niedrig'
        : severity === 'medium'
          ? 'Mittel'
          : severity === 'high'
            ? 'Hoch'
            : severity === 'critical'
              ? 'Kritisch'
              : severity;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status);
    const label =
      status === 'completed'
        ? 'Abgeschlossen'
        : status === 'in_progress'
          ? 'In Bearbeitung'
          : status === 'scheduled'
            ? 'Geplant'
            : status === 'pending'
              ? 'Ausstehend'
              : status === 'analyzed'
                ? 'Analysiert'
                : status === 'reviewed'
                  ? 'Geprüft'
                  : status === 'under_review'
                    ? 'In Prüfung'
                    : status === 'new'
                      ? 'Neu'
                      : status;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl sm:max-w-6xl lg:max-w-7xl max-h-[95vh] overflow-y-auto bg-background border z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Vorfall-Untersuchung: {incidentId}
          </DialogTitle>
          <DialogDescription>
            {incidentType} • {agencyName} • Ermittler: {incidentDetails.investigator}
          </DialogDescription>
        </DialogHeader>

        {/* Investigation Status Bar */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Schweregrad</CardTitle>
            </CardHeader>
            <CardContent>{getSeverityBadge(incidentDetails.severity)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>{getStatusBadge(incidentDetails.status)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Priorität</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="destructive">Hoch</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Frist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-destructive">3 Tage verbleibend</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fortschritt</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={60} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">60%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="evidence">Beweismaterial</TabsTrigger>
            <TabsTrigger value="violations">Verstöße</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="actions">Maßnahmen</TabsTrigger>
            <TabsTrigger value="report">Bericht</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Kunde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>{caseDetails.customer.name}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {caseDetails.customer.age} Jahre, {caseDetails.customer.occupation}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3" />
                    {caseDetails.customer.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" />
                    {caseDetails.customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-3 h-3" />
                    {caseDetails.customer.email}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Berater
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>{caseDetails.agent.name}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lizenz: {caseDetails.agent.license}
                  </div>
                  <div className="text-sm">Erfahrung: {caseDetails.agent.experience}</div>
                  <div className="text-sm">
                    Vorherige Vorfälle:{' '}
                    <span className="text-destructive font-medium">
                      {caseDetails.agent.previousIncidents}
                    </span>
                  </div>
                  <div className="text-sm">Umsatz 2023: {caseDetails.agent.revenue2023}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Produkt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>{caseDetails.product.name}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">{caseDetails.product.type}</div>
                  <div className="text-sm">Versicherungssumme: {caseDetails.product.sum}</div>
                  <div className="text-sm">Monatsbeitrag: {caseDetails.product.premium}</div>
                  <div className="text-sm">
                    Provision: <span className="font-medium">{caseDetails.product.commission}</span>
                  </div>
                  <Badge variant="destructive">{caseDetails.product.riskClass} Risiko</Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vorfall-Chronologie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Erstkontakt</div>
                    <div className="text-muted-foreground">{caseDetails.timeline.contactDate}</div>
                  </div>
                  <div>
                    <div className="font-medium">Beratungstermin</div>
                    <div className="text-muted-foreground">
                      {caseDetails.timeline.consultationDate}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Vertragsabschluss</div>
                    <div className="text-muted-foreground">
                      {caseDetails.timeline.contractSigned}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-destructive">Beschwerde</div>
                    <div className="text-muted-foreground">
                      {caseDetails.timeline.complaintDate}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Ermittlung</div>
                    <div className="text-muted-foreground">
                      {caseDetails.timeline.investigationStart}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            {evidence.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {item.type === 'audio' && <PlayCircle className="w-4 h-4" />}
                      {item.type === 'document' && <FileText className="w-4 h-4" />}
                      {item.type === 'email' && <Mail className="w-4 h-4" />}
                      {item.type === 'complaint' && <AlertTriangle className="w-4 h-4" />}
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.riskScore > 80
                            ? 'destructive'
                            : item.riskScore > 60
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        Risiko: {item.riskScore}/100
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Details</h4>
                      <div className="text-sm space-y-1">
                        <div>Zeitstempel: {item.timestamp}</div>
                        {item.duration && <div>Dauer: {item.duration}</div>}
                        {item.pages && <div>Seiten: {item.pages}</div>}
                        {item.count && <div>Anzahl: {item.count}</div>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Kritische Befunde</h4>
                      <ul className="text-sm space-y-1">
                        {item.keyFindings.map((finding, findingIdx) => (
                          <li key={findingIdx} className="text-destructive">
                            • {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      Anzeigen
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 mr-1" />
                      Herunterladen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="violations" className="space-y-4">
            {violations.map((violation, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{violation.regulation}</CardTitle>
                    {getSeverityBadge(violation.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">Verstoß</h4>
                      <p className="text-sm text-muted-foreground">{violation.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Beweismaterial</h4>
                      <p className="text-sm text-muted-foreground">{violation.evidence}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Mögliche Sanktion</h4>
                      <p className="text-sm text-destructive font-medium">{violation.penalty}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ermittlungs-Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 border-l-2 border-l-muted-foreground/20"
                    >
                      <div className="flex items-center gap-2 min-w-32">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('de-DE')}{' '}
                          {new Date(event.date).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.event}</div>
                        <div className="text-xs text-muted-foreground">{event.actor}</div>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empfohlene Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Sofortige Maßnahmen</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Verkaufsstopp für Marcus Berger (temporär)</li>
                    <li>• Überprüfung aller Fälle der letzten 6 Monate</li>
                    <li>• Kundenkontakt zur Schadensbegrenzung</li>
                  </ul>
                </div>

                <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                  <h4 className="font-medium text-warning mb-2">Mittelfristige Maßnahmen</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Compliance-Schulung für gesamte Agentur</li>
                    <li>• Überarbeitung der Verkaufsprozesse</li>
                    <li>• Implementierung zusätzlicher Kontrollen</li>
                  </ul>
                </div>

                <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">Rechtliche Schritte</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Bußgeldverfahren einleiten (€50.000 - €75.000)</li>
                    <li>• Lizenzprüfung für Marcus Berger</li>
                    <li>• Verschärfte Aufsicht für 12 Monate</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ermittlungsbericht (Entwurf)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Detaillierte Zusammenfassung der Ermittlungsergebnisse..."
                  className="min-h-[200px]"
                  defaultValue={`ERMITTLUNGSBERICHT - ${incidentId}

ZUSAMMENFASSUNG:
Der vorliegende Fall zeigt schwerwiegende Verstöße gegen die Beratungspflichten gemäß IDD. Der Berater Marcus Berger hat durch aggressive Verkaufstaktiken und unvollständige Risikoaufklärung die Compliance-Standards verletzt.

FESTSTELLUNGEN:
1. Hochdruck-Verkaufstaktiken wurden dokumentiert
2. Unvollständige Bedarfsanalyse durchgeführt
3. Wesentliche Produktrisiken wurden verschwiegen
4. Kosten wurden nicht transparent dargestellt

EMPFEHLUNGEN:
- Bußgeld in Höhe von €50.000
- Verschärfte Aufsicht für 12 Monate
- Compliance-Schulung verpflichtend
- Überprüfung aller Verträge der letzten 6 Monate`}
                />
                <div className="flex gap-2 mt-4">
                  <Button variant="outline">Entwurf speichern</Button>
                  <Button>Bericht finalisieren</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button variant="destructive">Sanktionen verhängen</Button>
          <Button>Ermittlung abschließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
