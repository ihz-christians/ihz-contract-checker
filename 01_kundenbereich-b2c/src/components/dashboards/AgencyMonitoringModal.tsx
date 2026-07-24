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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  Phone,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Zap,
  Shield,
} from 'lucide-react';
import type { IndustryType } from '@/types/case';
import { getRiskBadgeVariant, getStatusBadgeVariant } from '@/lib/dashboard-utils';

interface AgencyMonitoringModalProps {
  open: boolean;
  onClose: () => void;
  agencyName: string;
}

// Helper function to determine industry from agency name
const getAgencyIndustry = (agencyName: string): IndustryType => {
  if (
    agencyName.includes('Vodafone') ||
    agencyName.includes('Telekom') ||
    agencyName.includes('O2') ||
    agencyName.includes('1&1') ||
    agencyName.includes('Mobilcom')
  ) {
    return 'telecommunications';
  }
  if (
    agencyName.includes('E.ON') ||
    agencyName.includes('RWE') ||
    agencyName.includes('Vattenfall') ||
    agencyName.includes('EnBW') ||
    agencyName.includes('Stadtwerke') ||
    agencyName.includes('Energie')
  ) {
    return 'energy';
  }
  return 'insurance';
};

export function AgencyMonitoringModal({ open, onClose, agencyName }: AgencyMonitoringModalProps) {
  const industry = getAgencyIndustry(agencyName);

  // Industry-specific agency details
  const getAgencyDetails = () => {
    const baseDetails = {
      name: agencyName,
      established: '2019',
      totalAgents: 23,
      complianceScore:
        agencyName.includes('Vodafone') ||
        agencyName.includes('E.ON') ||
        agencyName.includes('O2') ||
        agencyName.includes('Vattenfall')
          ? 42
          : agencyName.includes('Telekom') || agencyName.includes('RWE')
            ? 55
            : 87,
    };

    switch (industry) {
      case 'telecommunications':
        return {
          ...baseDetails,
          license: 'TKG-2021-7832',
          monthlyVolume: '1.2M Verträge',
          regulation: 'TKG/TMG Compliance',
        };
      case 'energy':
        return {
          ...baseDetails,
          license: 'EnWG-2020-4591',
          monthlyVolume: '€3.8M Umsatz',
          regulation: 'EnWG Compliance',
        };
      default: // insurance
        return {
          ...baseDetails,
          license: 'VVL-2019-4532',
          monthlyVolume: '€2.4M Prämien',
          regulation: 'VVG/IDD Compliance',
        };
    }
  };

  const agencyDetails = getAgencyDetails();

  const complianceMetrics = [
    {
      metric: 'Beratungsprotokoll-Vollständigkeit',
      current: agencyName === 'Schnell Verkauf Ltd' ? 67 : 89,
      target: 95,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'down' : 'up',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'high' : 'low',
    },
    {
      metric: 'Kundenzufriedenheit (NPS)',
      current: agencyName === 'Schnell Verkauf Ltd' ? 32 : 78,
      target: 70,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'down' : 'up',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'critical' : 'low',
    },
    {
      metric: 'Stornoquote (90 Tage)',
      current: agencyName === 'Schnell Verkauf Ltd' ? 28 : 12,
      target: 15,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'up' : 'down',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'critical' : 'low',
    },
    {
      metric: 'Durchschnittliche Beratungszeit',
      current: agencyName === 'Schnell Verkauf Ltd' ? 18 : 42,
      target: 35,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'down' : 'up',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'high' : 'low',
    },
    {
      metric: 'MiFID II Compliance',
      current: agencyName === 'Schnell Verkauf Ltd' ? 71 : 94,
      target: 90,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'down' : 'up',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'high' : 'low',
    },
    {
      metric: 'IDD Dokumentation',
      current: agencyName === 'Schnell Verkauf Ltd' ? 63 : 91,
      target: 95,
      trend: agencyName === 'Schnell Verkauf Ltd' ? 'down' : 'up',
      risk: agencyName === 'Schnell Verkauf Ltd' ? 'high' : 'low',
    },
  ];

  const recentCases = [
    {
      id: 'CASE-7832',
      customer: 'Müller, H.',
      product: 'Lebensversicherung Premium',
      agent: 'Berger, M.',
      date: '2024-01-20',
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 85 : 23,
      issues:
        agencyName === 'Schnell Verkauf Ltd'
          ? ['Hochdruck-Taktik', 'Unvollständige Risikoaufklärung', 'Überhöhte Provision']
          : ['Keine kritischen Auffälligkeiten'],
      status: agencyName === 'Schnell Verkauf Ltd' ? 'flagged' : 'compliant',
    },
    {
      id: 'CASE-7831',
      customer: 'Schmidt, A.',
      product: 'KFZ-Versicherung Komfort',
      agent: 'Weber, T.',
      date: '2024-01-20',
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 72 : 18,
      issues:
        agencyName === 'Schnell Verkauf Ltd'
          ? ['Falsche Deckungssummen-Beratung', 'Churning-Verdacht']
          : ['Ordnungsgemäße Beratung'],
      status: agencyName === 'Schnell Verkauf Ltd' ? 'review' : 'compliant',
    },
    {
      id: 'CASE-7830',
      customer: 'Wagner, P.',
      product: 'Berufsunfähigkeitsversicherung',
      agent: 'Fischer, L.',
      date: '2024-01-19',
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 91 : 31,
      issues:
        agencyName === 'Schnell Verkauf Ltd'
          ? [
              'Gesundheitsfragen unvollständig',
              'Twisting-Verdacht',
              'Fehlende Wartezeit-Aufklärung',
            ]
          : ['Geringfügige Dokumentationslücken'],
      status: agencyName === 'Schnell Verkauf Ltd' ? 'critical' : 'review',
    },
  ];

  const agents = [
    {
      name: 'Berger, M.',
      license: 'IHK-V-2020-1123',
      cases: 47,
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 78 : 23,
      complaints: agencyName === 'Schnell Verkauf Ltd' ? 8 : 1,
      revenue: '€89.2k',
      status: agencyName === 'Schnell Verkauf Ltd' ? 'warning' : 'good',
    },
    {
      name: 'Weber, T.',
      license: 'IHK-V-2019-0887',
      cases: 52,
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 65 : 19,
      complaints: agencyName === 'Schnell Verkauf Ltd' ? 5 : 0,
      revenue: '€76.8k',
      status: agencyName === 'Schnell Verkauf Ltd' ? 'warning' : 'good',
    },
    {
      name: 'Fischer, L.',
      license: 'IHK-V-2021-1456',
      cases: 39,
      riskScore: agencyName === 'Schnell Verkauf Ltd' ? 84 : 28,
      complaints: agencyName === 'Schnell Verkauf Ltd' ? 7 : 2,
      revenue: '€94.1k',
      status: agencyName === 'Schnell Verkauf Ltd' ? 'critical' : 'review',
    },
  ];

  const alerts =
    agencyName === 'Schnell Verkauf Ltd'
      ? [
          {
            type: 'critical',
            message: 'Überdurchschnittlich hohe Stornoquote bei Lebensversicherungen (34%)',
            timestamp: '2024-01-20 14:30',
          },
          {
            type: 'warning',
            message: 'Auffällig kurze Beratungszeiten bei komplexen Produkten',
            timestamp: '2024-01-20 11:15',
          },
          {
            type: 'critical',
            message: '3 Kundenbeschwerden wegen Hochdruck-Verkauf in 48h',
            timestamp: '2024-01-19 16:45',
          },
        ]
      : [
          {
            type: 'info',
            message: 'Compliance-Score über Branchendurchschnitt',
            timestamp: '2024-01-20 09:00',
          },
        ];

  const getRiskBadge = (risk: string) => {
    const variant = getRiskBadgeVariant(risk);
    const label =
      risk === 'low'
        ? 'Niedrig'
        : risk === 'medium'
          ? 'Mittel'
          : risk === 'high'
            ? 'Hoch'
            : risk === 'critical'
              ? 'Kritisch'
              : risk;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status);
    const icon =
      status === 'compliant' || status === 'good' ? (
        <CheckCircle className="w-3 h-3 mr-1" />
      ) : status === 'review' ? (
        <Clock className="w-3 h-3 mr-1" />
      ) : status === 'flagged' || status === 'warning' ? (
        <AlertTriangle className="w-3 h-3 mr-1" />
      ) : status === 'critical' ? (
        <AlertCircle className="w-3 h-3 mr-1" />
      ) : null;

    const label =
      status === 'compliant'
        ? 'Konform'
        : status === 'review'
          ? 'Prüfung'
          : status === 'flagged'
            ? 'Markiert'
            : status === 'critical'
              ? 'Kritisch'
              : status === 'good'
                ? 'Gut'
                : status === 'warning'
                  ? 'Warnung'
                  : status;

    return (
      <Badge variant={variant}>
        {icon}
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl sm:max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto bg-background border z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Agentur-Überwachung: {agencyName}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Compliance- und Risiko-Analyse • Lizenz: {agencyDetails.license}
          </DialogDescription>
        </DialogHeader>

        {/* Agency Overview Cards */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Berater</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agencyDetails.totalAgents}</div>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monatsvolumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agencyDetails.monthlyVolume}</div>
              <p className="text-xs text-muted-foreground">Januar 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compliance-Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${agencyDetails.complianceScore < 50 ? 'text-destructive' : agencyDetails.complianceScore < 80 ? 'text-warning' : 'text-success'}`}
              >
                {agencyDetails.complianceScore}/100
              </div>
              <p className="text-xs text-muted-foreground">Aktuell</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gegründet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agencyDetails.established}</div>
              <p className="text-xs text-muted-foreground">Marktpräsenz</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Letzte Prüfung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Q3/23</div>
              <p className="text-xs text-muted-foreground">BaFin</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pt-1">
                {getStatusBadge(
                  agencyDetails.complianceScore < 50
                    ? 'critical'
                    : agencyDetails.complianceScore < 80
                      ? 'review'
                      : 'compliant'
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="metrics">Compliance-Metriken</TabsTrigger>
            <TabsTrigger value="cases">Aktuelle Fälle</TabsTrigger>
            <TabsTrigger value="agents">Berater-Übersicht</TabsTrigger>
            <TabsTrigger value="industry">
              {industry === 'telecommunications' ? (
                <>
                  <Smartphone className="w-4 h-4 mr-1" />
                  Telekom
                </>
              ) : industry === 'energy' ? (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Energie
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-1" />
                  Versicherung
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts">Live-Alerts</TabsTrigger>
            <TabsTrigger value="history">Verlauf</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance-Kennzahlen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceMetrics.map((metric) => (
                    <div
                      key={metric.metric}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{metric.metric}</span>
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          )}
                          {getRiskBadge(metric.risk)}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress
                              value={(metric.current / metric.target) * 100}
                              className="h-2"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {metric.current}% / {metric.target}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Verkaufsfälle (letzte 3 Tage)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fall-ID</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Produkt</TableHead>
                      <TableHead>Berater</TableHead>
                      <TableHead>Risiko-Score</TableHead>
                      <TableHead>Auffälligkeiten</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCases.map((case_) => (
                      <TableRow key={case_.id}>
                        <TableCell className="font-medium">{case_.id}</TableCell>
                        <TableCell>{case_.customer}</TableCell>
                        <TableCell>{case_.product}</TableCell>
                        <TableCell>{case_.agent}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${case_.riskScore > 80 ? 'text-destructive' : case_.riskScore > 60 ? 'text-warning' : 'text-success'}`}
                          >
                            {case_.riskScore}/100
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {case_.issues.map((issue, idx) => (
                              <div key={idx} className="text-xs">
                                {issue}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(case_.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="industry" className="space-y-4">
            {industry === 'telecommunications' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5" />
                      Telekommunikations-spezifische Metriken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Churn-Rate (Monatlich)</span>
                      <span className="text-sm font-medium text-destructive">18.7%</span>
                    </div>
                    <Progress value={18.7} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">BNetzA Beschwerden</span>
                      <span className="text-sm font-medium">23 (30 Tage)</span>
                    </div>
                    <Progress value={76.7} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Unerlaubte Wechsel</span>
                      <span className="text-sm font-medium text-destructive">7 Fälle</span>
                    </div>
                    <Progress value={23.3} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Door2Door Probleme (Telekom)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium text-destructive">Köder-Angebote</div>
                        <div className="text-muted-foreground">
                          Unrealistische Preise bei Haustürgeschäften
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-destructive">Fake-Techniker</div>
                        <div className="text-muted-foreground">
                          Ausgabe als offizielle Telekom-Mitarbeiter
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-warning">Cold Calling</div>
                        <div className="text-muted-foreground">
                          Unerlaubte Anrufe trotz Robinson-Liste
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {industry === 'energy' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Energie-spezifische Metriken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Widerruf-Quote (14 Tage)</span>
                      <span className="text-sm font-medium text-destructive">34.2%</span>
                    </div>
                    <Progress value={34.2} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grundversorger-Täuschung</span>
                      <span className="text-sm font-medium text-destructive">12 Fälle</span>
                    </div>
                    <Progress value={80} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Preisgarantie-Verstöße</span>
                      <span className="text-sm font-medium">8 Fälle</span>
                    </div>
                    <Progress value={53.3} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Door2Door Probleme (Energie)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium text-destructive">Stadtwerke-Täuschung</div>
                        <div className="text-muted-foreground">
                          "Wir sind von Ihren Stadtwerken"
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-destructive">Falsche Ersparnisse</div>
                        <div className="text-muted-foreground">
                          Übertriebene Preisvorteile versprochen
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-warning">Nachts-/Wochenend-Akquise</div>
                        <div className="text-muted-foreground">Unerlaubte Besuchszeiten</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {industry === 'insurance' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Versicherungs-spezifische Metriken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stornoquote (90 Tage)</span>
                      <span className="text-sm font-medium">12.3%</span>
                    </div>
                    <Progress value={12.3} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">IDD Compliance</span>
                      <span className="text-sm font-medium text-success">94.1%</span>
                    </div>
                    <Progress value={94.1} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Beratungsprotokoll-Vollständigkeit</span>
                      <span className="text-sm font-medium text-success">91.7%</span>
                    </div>
                    <Progress value={91.7} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Door2Door Probleme (Versicherung)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium text-warning">Spontane Abschlüsse</div>
                        <div className="text-muted-foreground">Ohne ausreichende Bedenkzeit</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-warning">Churning</div>
                        <div className="text-muted-foreground">
                          Unnötige Vertragswechsel für Provision
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-success">Ordnungsgemäße Beratung</div>
                        <div className="text-muted-foreground">
                          Meist korrekte Bedarfsermittlung
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Berater-Performance & Risiko-Bewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Berater</TableHead>
                      <TableHead>Lizenz</TableHead>
                      <TableHead>Fälle (30T)</TableHead>
                      <TableHead>Risiko-Score</TableHead>
                      <TableHead>Beschwerden</TableHead>
                      <TableHead>Umsatz</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.name}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {agent.license}
                        </TableCell>
                        <TableCell>{agent.cases}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${agent.riskScore > 80 ? 'text-destructive' : agent.riskScore > 60 ? 'text-warning' : 'text-success'}`}
                          >
                            {agent.riskScore}/100
                          </span>
                        </TableCell>
                        <TableCell>{agent.complaints}</TableCell>
                        <TableCell>{agent.revenue}</TableCell>
                        <TableCell>{getStatusBadge(agent.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live-Überwachung & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'critical'
                          ? 'border-l-destructive bg-destructive/5'
                          : alert.type === 'warning'
                            ? 'border-l-warning bg-warning/5'
                            : 'border-l-primary bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {alert.type === 'critical' ? (
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                          ) : alert.type === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Analysieren
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance-Verlauf (12 Monate)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">Q4/23</div>
                      <div className="text-sm text-muted-foreground">Score: 89</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">Q3/23</div>
                      <div className="text-sm text-muted-foreground">Score: 76</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">Q2/23</div>
                      <div className="text-sm text-muted-foreground">Score: 68</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">Q1/23</div>
                      <div className="text-sm text-muted-foreground">Score: 52</div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Verbesserungsmaßnahmen</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Zusätzliche Schulungen zu MiFID II Compliance</li>
                      <li>• Implementierung digitaler Beratungsprotokolle</li>
                      <li>• Monatliche Qualitätskontrolle eingeführt</li>
                      <li>• Kundenzufriedenheits-Monitoring aktiviert</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button>Weitere Maßnahmen einleiten</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
