import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Shield,
  Building,
  AlertTriangle,
  TrendingUp,
  Eye,
  Download,
  Filter,
  Calendar,
  Phone,
  Zap,
  Car,
  Target,
  Clock,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingDown,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgencyMonitoringModal } from './AgencyMonitoringModal';
import { IncidentInvestigationModal } from './IncidentInvestigationModal';
import { useState } from 'react';
import type { IndustryType } from '@/types/case';
import {
  getRiskBadgeVariant,
  getStatusBadgeVariant,
  getTrendBadgeVariant,
  getProgressVariant,
} from '@/lib/dashboard-utils';

export function EnhancedRegulatorDashboard() {
  const navigate = useNavigate();
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<{
    id: string;
    type: string;
    agency: string;
  } | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Comprehensive dashboard data
  const systemStats = {
    all: {
      totalAgencies: 45,
      totalCases: 3420,
      avgRiskScore: 38,
      criticalIncidents: 23,
      complianceRate: 89,
      avgResolutionTime: '3d 2h',
      monthlyGrowth: 12.5,
      activeViolations: 47,
      resolvedToday: 15,
      revenue: 2850000,
      casesTrend: [
        { month: 'Jan', cases: 280, violations: 45, compliance: 85 },
        { month: 'Feb', cases: 320, violations: 52, compliance: 83 },
        { month: 'Mar', cases: 290, violations: 38, compliance: 87 },
        { month: 'Apr', cases: 350, violations: 41, compliance: 88 },
        { month: 'Mai', cases: 310, violations: 35, compliance: 89 },
        { month: 'Jun', cases: 380, violations: 47, compliance: 87 },
      ],
    },
    telecommunications: {
      totalAgencies: 18,
      totalCases: 1245,
      avgRiskScore: 52,
      criticalIncidents: 11,
      complianceRate: 78,
      avgResolutionTime: '2d 14h',
      monthlyGrowth: -8.2,
      activeViolations: 23,
      resolvedToday: 7,
      revenue: 1200000,
    },
    energy: {
      totalAgencies: 15,
      totalCases: 1567,
      avgRiskScore: 61,
      criticalIncidents: 8,
      complianceRate: 71,
      avgResolutionTime: '4d 6h',
      monthlyGrowth: 15.8,
      activeViolations: 18,
      resolvedToday: 5,
      revenue: 980000,
    },
    insurance: {
      totalAgencies: 12,
      totalCases: 608,
      avgRiskScore: 45,
      criticalIncidents: 4,
      complianceRate: 92,
      avgResolutionTime: '1d 18h',
      monthlyGrowth: 7.3,
      activeViolations: 6,
      resolvedToday: 3,
      revenue: 670000,
    },
  };

  const riskDistribution = [
    { name: 'Niedrig', value: 45, color: 'hsl(var(--success))' },
    { name: 'Mittel', value: 35, color: 'hsl(var(--warning))' },
    { name: 'Hoch', value: 15, color: 'hsl(var(--destructive))' },
    { name: 'Kritisch', value: 5, color: 'hsl(var(--destructive))' },
  ];

  const industryPerformance = [
    { industry: 'Telekom', compliance: 78, violations: 23, trend: -8.2 },
    { industry: 'Energie', compliance: 71, violations: 18, trend: 15.8 },
    { industry: 'Versicherung', compliance: 92, violations: 6, trend: 7.3 },
  ];

  const realtimeMetrics = [
    { metric: 'Live Cases', value: 47, change: '+3' },
    { metric: 'Active Agents', value: 127, change: '+5' },
    { metric: 'Violations/Hour', value: 2.3, change: '-0.8' },
    { metric: 'Response Time', value: '45s', change: '-12s' },
  ];

  const currentStats = systemStats[selectedIndustry];

  const getIndustryIcon = (industry: IndustryType | 'all') => {
    switch (industry) {
      case 'telecommunications':
        return <Phone className="h-4 w-4" />;
      case 'energy':
        return <Zap className="h-4 w-4" />;
      case 'insurance':
        return <Car className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const industryLabels = {
    all: 'Alle Branchen',
    telecommunications: 'Telekommunikation',
    energy: 'Energie',
    insurance: 'Versicherung',
  };

  return (
    <div className="space-y-6">
      {/* Header with Industry Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Regulierungs-Dashboard</h1>
          <p className="text-muted-foreground">Überwachung aller Door2Door-Aktivitäten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Letzten 30 Tage
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Industry Filter Tabs */}
      <Tabs
        value={selectedIndustry}
        onValueChange={(value) => setSelectedIndustry(value as IndustryType | 'all')}
      >
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(industryLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              {getIndustryIcon(key as IndustryType | 'all')}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedIndustry} className="space-y-6">
          {/* Real-time Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {realtimeMetrics.map((metric, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.metric}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                    <Badge
                      variant={getTrendBadgeVariant(metric.change.startsWith('+') ? 'up' : 'down')}
                    >
                      {metric.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Agenturen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStats.totalAgencies}</div>
                <p className="text-xs text-muted-foreground">Aktive Partner</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fälle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStats.totalCases.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs">
                  {currentStats.monthlyGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={currentStats.monthlyGrowth > 0 ? 'text-success' : 'text-destructive'}
                  >
                    {currentStats.monthlyGrowth > 0 ? '+' : ''}
                    {currentStats.monthlyGrowth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Risiko-Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStats.avgRiskScore}/100</div>
                <Progress value={currentStats.avgRiskScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Kritische Fälle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {currentStats.criticalIncidents}
                </div>
                <p className="text-xs text-muted-foreground">Sofortige Maßnahmen</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {currentStats.complianceRate}%
                </div>
                <Progress value={currentStats.complianceRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />Ø Bearbeitungszeit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStats.avgResolutionTime}</div>
                <p className="text-xs text-muted-foreground">Durchschnitt</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Fallentwicklung & Compliance
                </CardTitle>
                <CardDescription>Monatliche Übersicht der letzten 6 Monate</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cases: { label: 'Fälle', color: 'hsl(var(--primary))' },
                    violations: { label: 'Verstöße', color: 'hsl(var(--destructive))' },
                    compliance: { label: 'Compliance %', color: 'hsl(var(--secondary))' },
                  }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={systemStats.all.casesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="cases"
                        stackId="1"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="violations"
                        stackId="2"
                        stroke="hsl(var(--destructive))"
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Risiko-Verteilung
                </CardTitle>
                <CardDescription>Aktuelle Verteilung der Risikokategorien</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    niedrig: { label: 'Niedrig', color: 'hsl(var(--success))' },
                    mittel: { label: 'Mittel', color: 'hsl(var(--warning))' },
                    hoch: { label: 'Hoch', color: 'hsl(var(--destructive))' },
                    kritisch: { label: 'Kritisch', color: 'hsl(var(--destructive))' },
                  }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Industry Performance Comparison */}
          {selectedIndustry === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Branchen-Performance Vergleich
                </CardTitle>
                <CardDescription>Compliance-Rate und Verstöße nach Branche</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    compliance: { label: 'Compliance %', color: 'hsl(var(--primary))' },
                    violations: { label: 'Verstöße', color: 'hsl(var(--destructive))' },
                  }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={industryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="industry" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="compliance" fill="hsl(var(--primary))" />
                      <Bar dataKey="violations" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Critical Actions Section */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Sofortige Maßnahmen erforderlich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium">Vodafone Nord - Unerlaubte Anbieterwechsel</p>
                    <p className="text-sm text-muted-foreground">23 Fälle in den letzten 24h</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Untersuchen
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <p className="font-medium">E.ON Süd - Grundversorger-Täuschung</p>
                    <p className="text-sm text-muted-foreground">15 Beschwerden heute</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Untersuchen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reports */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Täglicher Compliance-Bericht
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Risiko-Analyse Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enforcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Bußgeld-Verfahren einleiten
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <XCircle className="h-4 w-4 mr-2" />
                  Lizenz-Entzug prüfen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  System-Status
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Benutzer-Verwaltung
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedAgency && (
        <AgencyMonitoringModal
          open={!!selectedAgency}
          onClose={() => setSelectedAgency(null)}
          agencyName={selectedAgency}
        />
      )}

      {selectedIncident && (
        <IncidentInvestigationModal
          open={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          incidentId={selectedIncident.id}
          incidentType={selectedIncident.type}
          agencyName={selectedIncident.agency}
        />
      )}
    </div>
  );
}
