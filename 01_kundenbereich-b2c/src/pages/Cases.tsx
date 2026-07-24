import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Case, RiskSeverity } from '@/types/case';

// Enhanced Door2Door mock data
const mockCases: Case[] = [
  {
    id: 'case_1',
    customerId: 'cust_1',
    customerName: 'Max Mustermann',
    agencyId: 'agency_1',
    salespersonId: 'sales_1',
    salespersonName: 'Anna Verkäuferin',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:45:00Z',
    status: 'completed',
    riskScore: 85,
    riskLevel: 'high',
    labels: ['Versicherung', 'Beratung'],
    processingStages: {
      asr: true,
      diarization: true,
      emotion: true,
      sentiment: true,
      fact_check: true,
    },
    hasAudio: true,
    hasContract: true,
    language: 'de',
    campaign: 'Q1 2024',
    product: 'Lebensversicherung',
    // Door2Door specific fields
    industry: 'insurance',
    productCategory: 'life_insurance',
    complianceFramework: ['VVG_IDD', 'UWG'],
    isDoor2Door: true,
    salesChannel: 'door_to_door',
    customerAge: 45,
    contractValue: 150000,
    salesLocation: 'München, Bayern',
  },
  {
    id: 'case_2',
    customerId: 'cust_2',
    customerName: 'Maria Schmidt',
    agencyId: 'agency_1',
    salespersonId: 'sales_1',
    salespersonName: 'Anna Verkäuferin',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T16:20:00Z',
    status: 'completed',
    riskScore: 45,
    riskLevel: 'medium',
    labels: ['Energie', 'Beratung'],
    processingStages: {
      asr: true,
      diarization: true,
      emotion: true,
      sentiment: true,
      fact_check: true,
    },
    hasAudio: true,
    hasContract: true,
    language: 'de',
    campaign: 'Q1 2024',
    product: 'Stromtarif',
    // Door2Door specific fields
    industry: 'energy',
    productCategory: 'electricity',
    complianceFramework: ['EnWG', 'UWG'],
    isDoor2Door: true,
    salesChannel: 'door_to_door',
    customerAge: 38,
    contractValue: 1200,
    salesLocation: 'Hamburg, Deutschland',
  },
  {
    id: 'case_3',
    customerId: 'cust_3',
    customerName: 'Klaus Weber',
    agencyId: 'agency_2',
    salespersonId: 'sales_2',
    salespersonName: 'Thomas Berger',
    createdAt: '2024-01-13T11:45:00Z',
    updatedAt: '2024-01-13T15:30:00Z',
    status: 'completed',
    riskScore: 72,
    riskLevel: 'high',
    labels: ['Telekommunikation', 'Door2Door'],
    processingStages: {
      asr: true,
      diarization: true,
      emotion: true,
      sentiment: true,
      fact_check: true,
    },
    hasAudio: true,
    hasContract: true,
    language: 'de',
    campaign: 'Vodafone Door2Door Q1',
    product: 'Mobilfunk + Internet',
    // Door2Door specific fields
    industry: 'telecommunications',
    productCategory: 'mobile_contracts',
    complianceFramework: ['TMG_TKG', 'UWG'],
    isDoor2Door: true,
    salesChannel: 'door_to_door',
    customerAge: 52,
    contractValue: 600,
    salesLocation: 'Berlin, Deutschland',
  },
];

function getRiskBadgeVariant(level: RiskSeverity) {
  switch (level) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'default';
    case 'high':
      return 'destructive';
    case 'critical':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getRiskLabel(level: RiskSeverity) {
  switch (level) {
    case 'low':
      return 'Niedrig';
    case 'medium':
      return 'Mittel';
    case 'high':
      return 'Hoch';
    case 'critical':
      return 'Kritisch';
    default:
      return level;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Entwurf';
    case 'uploaded':
      return 'Hochgeladen';
    case 'queued':
      return 'In Warteschlange';
    case 'processing':
      return 'Wird verarbeitet';
    case 'completed':
      return 'Abgeschlossen';
    case 'action_required':
      return 'Aktion erforderlich';
    case 'archived':
      return 'Archiviert';
    default:
      return status;
  }
}

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState('');
  const { state } = useAuth();
  const navigate = useNavigate();

  // Filter cases based on user role
  const filteredCases = mockCases
    .filter((caseItem) => {
      if (state.user?.role === 'customer') {
        return caseItem.customerId === state.user.customerId;
      }
      if (state.user?.role === 'salesperson') {
        return caseItem.salespersonId === state.user.id;
      }
      if (state.user?.role === 'manager') {
        return caseItem.agencyId === state.user.agencyId;
      }
      // Regulator sees all cases
      return true;
    })
    .filter(
      (caseItem) =>
        caseItem.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.product?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fälle</h1>
          <p className="text-muted-foreground">
            Übersicht über alle {state.user?.role === 'customer' ? 'Ihre' : ''} Analysen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Fälle durchsuchen..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCases.map((caseItem) => (
          <Card key={caseItem.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{caseItem.customerName}</CardTitle>
                  <CardDescription>
                    {caseItem.product} • {new Date(caseItem.createdAt).toLocaleDateString('de-DE')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRiskBadgeVariant(caseItem.riskLevel)}>
                    Risiko: {getRiskLabel(caseItem.riskLevel)}
                  </Badge>
                  <Badge variant="outline">{getStatusLabel(caseItem.status)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Risiko-Score: {caseItem.riskScore}/100</span>
                  {state.user?.role !== 'customer' && (
                    <span>Verkäufer: {caseItem.salespersonName}</span>
                  )}
                  <span>
                    {caseItem.industry === 'telecommunications'
                      ? '📱'
                      : caseItem.industry === 'energy'
                        ? '⚡'
                        : '🛡️'}
                    {caseItem.industry === 'telecommunications'
                      ? 'Telekom'
                      : caseItem.industry === 'energy'
                        ? 'Energie'
                        : 'Versicherung'}
                  </span>
                  {caseItem.isDoor2Door && <span>🚪 Door2Door</span>}
                  <span>Kampagne: {caseItem.campaign}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details anzeigen
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Keine Fälle gefunden</p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
