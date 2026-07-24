import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceMetrics } from '@/components/compliance/ComplianceMetrics';
import { CertificationBadges } from '@/components/compliance/CertificationBadges';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  Calendar,
  Target,
  Clock,
  Award,
  TrendingDown,
  CheckCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EnhancedManagerDashboard() {
  const navigate = useNavigate();

  // Enhanced manager statistics
  const teamStats = {
    totalSalespeople: 8,
    totalCases: 156,
    avgRiskScore: 42,
    highRiskCases: 18,
    completionRate: 94,
    avgProcessingTime: '2h 45m',
    monthlyGrowth: 15.2,
    teamPerformance: 87,
    qualityScore: 91,
    customerSatisfaction: 4.7,
  };

  // Performance trend data
  const performanceTrend = [
    { month: 'Jan', cases: 120, avgRisk: 45, completion: 89 },
    { month: 'Feb', cases: 135, avgRisk: 43, completion: 91 },
    { month: 'Mar', cases: 128, avgRisk: 41, completion: 92 },
    { month: 'Apr', cases: 142, avgRisk: 38, completion: 94 },
    { month: 'Mai', cases: 150, avgRisk: 42, completion: 93 },
    { month: 'Jun', cases: 156, avgRisk: 42, completion: 94 },
  ];

  // Enhanced leaderboard with more metrics
  const leaderboard = [
    {
      name: 'Anna Verkäuferin',
      cases: 23,
      avgRisk: 35,
      improvement: '+12%',
      trend: 'up',
      quality: 95,
      satisfaction: 4.8,
      compliance: 98,
    },
    {
      name: 'Peter Sales',
      cases: 19,
      avgRisk: 41,
      improvement: '+8%',
      trend: 'up',
      quality: 88,
      satisfaction: 4.6,
      compliance: 94,
    },
    {
      name: 'Lisa Beratung',
      cases: 21,
      avgRisk: 48,
      improvement: '-3%',
      trend: 'down',
      quality: 82,
      satisfaction: 4.2,
      compliance: 89,
    },
    {
      name: 'Max Direkt',
      cases: 17,
      avgRisk: 39,
      improvement: '+15%',
      trend: 'up',
      quality: 92,
      satisfaction: 4.7,
      compliance: 96,
    },
    {
      name: 'Sarah Support',
      cases: 25,
      avgRisk: 44,
      improvement: '+6%',
      trend: 'up',
      quality: 90,
      satisfaction: 4.5,
      compliance: 93,
    },
  ];

  // Risk categories breakdown
  const riskBreakdown = [
    { category: 'Niedrig (0-30)', count: 98, percentage: 63 },
    { category: 'Mittel (31-60)', count: 42, percentage: 27 },
    { category: 'Hoch (61-80)', count: 13, percentage: 8 },
    { category: 'Kritisch (81+)', count: 3, percentage: 2 },
  ];

  // Action items with priority
  const actionItems = [
    {
      priority: 'high',
      task: "Review Lisa Beratung's cases - Performance decline",
      deadline: '2 Tage',
      type: 'coaching',
    },
    {
      priority: 'high',
      task: '3 kritische Fälle benötigen sofortige Bearbeitung',
      deadline: 'Heute',
      type: 'urgent',
    },
    {
      priority: 'medium',
      task: 'Quartals-Schulung für das Team planen',
      deadline: '1 Woche',
      type: 'training',
    },
    {
      priority: 'medium',
      task: 'Performance-Reviews für Juni durchführen',
      deadline: '3 Tage',
      type: 'review',
    },
    {
      priority: 'low',
      task: 'Neue KPIs für Q3 definieren',
      deadline: '2 Wochen',
      type: 'planning',
    },
  ];

  const getBadgeVariant = (trend: string) => {
    return trend === 'up' ? 'default' : 'destructive';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'low':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-muted-foreground">Team-Performance und Compliance-Übersicht</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Juni 2024
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => navigate('/reports/manager')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Compliance Metrics for Investors */}
      <ComplianceMetrics />

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalSalespeople}</div>
            <p className="text-xs text-muted-foreground">Verkäufer aktiv</p>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fälle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalCases}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+{teamStats.monthlyGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />Ø Risiko
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.avgRiskScore}</div>
            <Progress value={teamStats.avgRiskScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Abschlussrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{teamStats.completionRate}%</div>
            <Progress value={teamStats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Qualität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{teamStats.qualityScore}%</div>
            <p className="text-xs text-muted-foreground">
              Kundenzufriedenheit: {teamStats.customerSatisfaction}★
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Performance Trend
            </CardTitle>
            <CardDescription>Monatliche Entwicklung der letzten 6 Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                cases: { label: 'Fälle', color: 'hsl(var(--primary))' },
                avgRisk: { label: 'Ø Risiko', color: 'hsl(var(--destructive))' },
                completion: { label: 'Abschlussrate %', color: 'hsl(var(--secondary))' },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceTrend}>
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
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
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
            <CardDescription>Aktuelle Fälle nach Risikokategorien</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-primary/20"></div>
                    <span className="text-sm">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <span className="text-sm font-medium w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Team Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Team Leaderboard & Performance
          </CardTitle>
          <CardDescription>Detaillierte Performance-Metriken pro Verkäufer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((person, index) => (
              <div
                key={person.name}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.cases} Fälle • Risiko: {person.avgRisk}/100 • Compliance:{' '}
                        {person.compliance}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">Qualität</p>
                      <p className="text-lg font-bold text-primary">{person.quality}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Zufriedenheit</p>
                      <p className="text-lg font-bold text-success">{person.satisfaction}★</p>
                    </div>
                    <Badge variant={getBadgeVariant(person.trend)}>{person.improvement}</Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Prioritäre Aufgaben
            </CardTitle>
            <CardDescription>Anstehende Management-Aufgaben</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.task}</p>
                      <p className="text-xs opacity-70 mt-1">
                        Fällig: {item.deadline} • Typ: {item.type}
                      </p>
                    </div>
                    <Badge
                      variant={item.priority === 'high' ? 'destructive' : 'outline'}
                      className="ml-2"
                    >
                      {item.priority === 'high'
                        ? 'Hoch'
                        : item.priority === 'medium'
                          ? 'Mittel'
                          : 'Niedrig'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Team Reports & Analytics
            </CardTitle>
            <CardDescription>Berichte und Datenexporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Team Performance Report (PDF)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Individual KPI Dashboard (Excel)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Compliance Übersicht (CSV)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Trend-Analyse Q2 2024
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Coaching Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications and Compliance Status */}
      <CertificationBadges />
    </div>
  );
}
