import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ComplianceMetrics } from '@/components/compliance/ComplianceMetrics';
import { CertificationBadges } from '@/components/compliance/CertificationBadges';
import { ExplainabilityCard } from '@/components/explainability/ExplainabilityCard';
import { ConversationTimeline } from '@/components/explainability/ConversationTimeline';
import { ContractRecommendationCard } from '@/components/customer/ContractRecommendationCard';
import { ModernContractDecision } from '@/components/customer/ModernContractDecision';
import { ModernSalesRating } from '@/components/customer/ModernSalesRating';
import {
  getStatusBadgeVariant,
  getRiskBadgeVariant,
  getRiskColorClasses,
  formatDate,
} from '@/lib/dashboard-utils';
import {
  AlertTriangle,
  Download,
  FileText,
  Shield,
  Phone,
  ExternalLink,
  Clock,
  User,
  Heart,
  Building,
  CheckCircle,
  AlertCircle,
  FileCheck,
  MessageSquare,
  Eye,
} from 'lucide-react';

export function EnhancedCustomerDashboard() {
  // Customer data
  const customerProfile = {
    name: 'Klaus Schmidt',
    customerId: 'CUST-2024-0134',
    memberSince: '2019-03-15',
    satisfactionScore: 4.2,
    trustLevel: 'Hoch',
  };

  // Handle rating submission
  const handleRatingSubmit = (rating: number, feedback: string, audioUrl?: string) => {
    console.log('Rating submitted:', { rating, feedback, audioUrl });
    // TODO: Send to backend API
  };

  // Handle contract decisions
  const handleContractAccept = (reason?: string, audioUrl?: string) => {
    console.log('Contract accepted:', { reason, audioUrl });
    // TODO: Process contract acceptance
  };

  const handleContractReject = (reason: string, audioUrl?: string) => {
    console.log('Contract rejected:', { reason, audioUrl });
    // TODO: Process contract rejection
  };

  // Mock case data with explainability
  const recentCase = {
    id: 'case_1',
    riskScore: 85,
    riskLevel: 'high',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    product: 'Lebensversicherung',
    topFindings: [
      'Hoher Verkaufsdruck erkannt',
      'Unbestätigte Rendite-Behauptung',
      'Unvollständige Risikoaufklärung',
    ],
    aiReasoning: {
      confidence: 'high' as const,
      confidenceScore: 87,
      methodology: 'pattern_recognition' as const,
      evidencePoints: [
        'Zeitlicher Druck-Aufbau in Minute 12-15',
        'Rendite-Versprechungen ohne Risikohinweise',
        'Fehlende Bedenkzeit-Gewährung',
      ],
      contextFactors: [
        'Älterer Kunde (67 Jahre)',
        'Hausbesuch ohne Terminankündigung',
        'Mehrfache Ablehnungs-Übergehung',
      ],
      falsePositiveRisk: 13,
    },
  };

  // Mock transcript segments for timeline
  const transcriptSegments = [
    {
      id: 'seg_1',
      speaker: 'Verkäufer',
      startTime: 0,
      endTime: 15,
      text: 'Guten Tag! Ich bin von der Versicherungsberatung und möchte Ihnen ein exklusives Angebot machen.',
      confidence: 0.95,
      findings: [],
    },
    {
      id: 'seg_2',
      speaker: 'Kunde',
      startTime: 15,
      endTime: 23,
      text: 'Ich habe eigentlich keine Zeit und bin nicht interessiert.',
      confidence: 0.97,
      findings: [],
    },
    {
      id: 'seg_3',
      speaker: 'Verkäufer',
      startTime: 23,
      endTime: 45,
      text: 'Das verstehe ich, aber diese Gelegenheit bekommen Sie nur heute! Mit dieser Police können Sie garantiert 8% Rendite pro Jahr erzielen.',
      confidence: 0.92,
      findings: [],
    },
  ];

  // Withdrawal period data
  const withdrawalPeriod = {
    daysRemaining: 12,
    totalDays: 14,
    contractDate: '2024-01-20',
    expiryDate: '2024-02-03',
  };

  // Consumer protection authorities
  const authorities = [
    {
      name: 'BaFin',
      fullName: 'Bundesanstalt für Finanzdienstleistungsaufsicht',
      url: 'https://www.bafin.de',
      description: 'Finanzaufsichtsbehörde',
    },
    {
      name: 'Bundesnetzagentur',
      fullName: 'Bundesnetzagentur für Elektrizität, Gas, Telekommunikation',
      url: 'https://www.bundesnetzagentur.de',
      description: 'Regulierungsbehörde für Energie und Telekommunikation',
    },
    {
      name: 'Verbraucherzentrale',
      fullName: 'Verbraucherzentrale Bundesverband',
      url: 'https://www.verbraucherzentrale.de',
      description: 'Verbraucherschutz und Beratung',
    },
  ];

  // Legal documents with status
  const legalDocuments = [
    {
      title: 'Compliance-Bericht',
      type: 'Bericht',
      status: 'Verfügbar',
      description: 'Detaillierter Bericht über die Analyse',
      urgent: false,
      generated: true,
    },
    {
      title: 'Widerrufsformular',
      type: 'Formular',
      status: 'Verfügbar',
      description: 'Musterformular für den Widerruf',
      urgent: true,
      generated: true,
    },
    {
      title: 'Vertragsunterlagen',
      type: 'Vertrag',
      status: 'Erforderlich',
      description: 'Vollständige Vertragsdokumentation',
      urgent: true,
      generated: false,
    },
    {
      title: 'Gesprächsprotokoll',
      type: 'Protokoll',
      status: 'Ausstehend',
      description: 'Detailliertes Protokoll des Verkaufsgesprächs',
      urgent: false,
      generated: false,
    },
    {
      title: 'Rechtliche Einschätzung',
      type: 'Gutachten',
      status: 'Erforderlich',
      description: 'Juristische Bewertung des Falls',
      urgent: true,
      generated: false,
    },
  ];

  const getStatusBadge = (status: string, urgent: boolean = false) => {
    const variant = getStatusBadgeVariant(status);
    const statusText =
      {
        verfügbar: 'Verfügbar',
        erforderlich: 'Erforderlich',
        ausstehend: 'Ausstehend',
        completed: 'Abgeschlossen',
      }[status.toLowerCase()] || status;
    return <Badge variant={variant}>{statusText}</Badge>;
  };

  const riskColors = getRiskColorClasses(recentCase.riskLevel);

  const calculateProgress = () => {
    const elapsed = withdrawalPeriod.totalDays - withdrawalPeriod.daysRemaining;
    return (elapsed / withdrawalPeriod.totalDays) * 100;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 p-4 lg:p-6">
      {/* Demonstration Banner */}
      <div className="bg-gradient-to-r from-muted/20 to-muted/30 border border-border rounded-lg p-4 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          <strong>Demonstration Purposes Only</strong> - This is a sample dashboard showing consumer
          protection features
        </p>
      </div>

      {/* Header with Customer Info */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl xl:text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="h-6 w-6 xl:h-8 xl:w-8 flex-shrink-0" />
            <span className="truncate">Willkommen, {customerProfile.name}</span>
          </h1>
          <p className="text-base xl:text-lg text-muted-foreground mt-2">
            Kunde seit {formatDate(customerProfile.memberSince)} • ID: {customerProfile.customerId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Heart className="h-4 w-4 mr-2" />
            Zufriedenheit: {customerProfile.satisfactionScore}★
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Shield className="h-4 w-4 mr-2" />
            {customerProfile.trustLevel} Vertrauen
          </Badge>
        </div>
      </div>

      {/* Three Column Layout - Balanced Proportions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Consumer Protection */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              Verbraucherschutz
            </CardTitle>
            <CardDescription className="text-sm">
              Direkte Links zu wichtigen Behörden und Beratungsstellen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authorities.map((authority, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-base">{authority.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {authority.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  className="w-full justify-between text-sm"
                  onClick={() => window.open(authority.url, '_blank')}
                >
                  <span className="truncate pr-2">{authority.fullName}</span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                </Button>
              </div>
            ))}

            <div className="pt-3 border-t">
              <h4 className="font-semibold mb-3 text-base">Schnelle Hilfe</h4>
              <div className="space-y-2">
                <Button variant="destructive" size="default" className="w-full text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  Beschwerde einreichen
                </Button>
                <Button variant="outline" size="default" className="w-full text-sm">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  Kostenlose Beratung
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Column - Withdrawal Period Timer */}
        <Card className="border-l-4 border-l-warning h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning text-lg">
              <Clock className="h-5 w-5 flex-shrink-0" />
              Widerrufsfrist
            </CardTitle>
            <CardDescription className="text-sm">
              Verbleibende Zeit für den kostenlosen Widerruf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">
                {withdrawalPeriod.daysRemaining}
              </div>
              <p className="text-base text-muted-foreground">Tage verbleibend</p>
              <p className="text-sm text-muted-foreground mt-1">
                bis zum {new Date(withdrawalPeriod.expiryDate).toLocaleDateString('de-DE')}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Fortschritt</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Vertrag vom {new Date(withdrawalPeriod.contractDate).toLocaleDateString('de-DE')}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-semibold text-base">Ihre Optionen</h4>
              <Button variant="destructive" size="default" className="w-full text-sm">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                Widerrufsformular herunterladen
              </Button>
              <Button variant="outline" size="default" className="w-full text-sm">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                Widerruf telefonisch erklären
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💡 <strong>Tipp:</strong> Sie können den Vertrag innerhalb der Widerrufsfrist ohne
                Angabe von Gründen kostenlos widerrufen.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Legal Documents */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              Rechtsdokumente
            </CardTitle>
            <CardDescription className="text-sm">
              Status und Verfügbarkeit wichtiger Dokumente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {legalDocuments.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{doc.title}</h4>
                      {doc.urgent && (
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {doc.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                  <div className="flex-shrink-0">{getStatusBadge(doc.status, doc.urgent)}</div>
                </div>

                <div className="flex gap-2">
                  {doc.generated ? (
                    <Button variant="default" size="default" className="flex-1 text-sm">
                      <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                      Download
                    </Button>
                  ) : (
                    <Button variant="outline" size="default" className="flex-1 text-sm">
                      <FileCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                      Erstellen
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t">
              <h4 className="font-semibold mb-3 text-base">Compliance-Features</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  DSGVO-konform
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  Rechtlich geprüft
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  Auto Updates
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  Audit-Trail
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis and Decision Section */}
      <div className="space-y-6">
        <h2 className="text-xl lg:text-2xl font-bold">Ihre AI-Analyse & Entscheidung</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommendation */}
          <ContractRecommendationCard
            recommendation="reject"
            confidenceScore={85}
            reasons={{
              positive: ['Gute Beratungszeit eingehalten'],
              negative: [
                'Hoher Verkaufsdruck erkannt',
                'Unbestätigte Rendite-Behauptung',
                'Unvollständige Risikoaufklärung',
              ],
              neutral: ['Produkt grundsätzlich in Ordnung'],
            }}
            criteriaScores={{
              transparency: 65,
              fairness: 45,
              compliance: 35,
              customerBenefit: 60,
            }}
          />

          {/* Contract Decision */}
          <ModernContractDecision
            daysRemaining={withdrawalPeriod.daysRemaining}
            productType="Lebensversicherung"
            onAccept={handleContractAccept}
            onReject={handleContractReject}
          />
        </div>

        {/* Sales Rating */}
        <ModernSalesRating
          caseId={recentCase.id}
          onRatingSubmit={(ratings, feedback, audioUrl) => {
            console.log('Sales rating submitted:', { ratings, feedback, audioUrl });
          }}
        />
      </div>

      {/* Case Analysis Section */}
      {recentCase && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-2xl lg:text-3xl font-bold">Detaillierte Analyse</h2>
            <Badge
              variant={getStatusBadgeVariant(recentCase.status)}
              className="self-start lg:self-auto"
            >
              {recentCase.status === 'completed' ? 'Abgeschlossen' : recentCase.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExplainabilityCard aiReasoning={recentCase.aiReasoning} findingId="finding-1" />

            <ConversationTimeline
              segments={transcriptSegments}
              findings={recentCase.topFindings.map((finding, index) => ({
                id: `finding-${index}`,
                text: finding,
                type: 'warning' as const,
                severity: 85,
                riskLevel: 'high' as const,
                span: { start: 0, end: 10 },
                category: 'compliance',
                explanation: `Analysis found: ${finding}`,
                evidenceScore: 0.8,
                speaker: 'Verkäufer',
                evidence: `Evidence for ${finding}`,
                recommendation: `Consider addressing: ${finding}`,
                timestamp: new Date().toISOString(),
              }))}
            />
          </div>
        </div>
      )}

      {/* Compliance and Certification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComplianceMetrics />
        <CertificationBadges />
      </div>
    </div>
  );
}
