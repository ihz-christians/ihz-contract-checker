import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ExplainabilityCard } from '@/components/explainability/ExplainabilityCard';
import { LearningPathWidget } from '@/components/explainability/LearningPathWidget';
import { ImprovementSuggestionsCard } from '@/components/explainability/ImprovementSuggestionsCard';
import { ConversationTimeline } from '@/components/explainability/ConversationTimeline';
import {
  getRiskBadgeVariant,
  getStatusBadgeVariant,
  getTrendBadgeVariant,
  getRiskColorClasses,
  formatDate,
  formatNumber,
} from '@/lib/dashboard-utils';
import {
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  BookOpen,
  Target,
  Award,
  Brain,
  TrendingDown,
  Play,
  MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EnhancedSalespersonDashboard() {
  const navigate = useNavigate();

  // Enhanced stats with learning insights
  const stats = {
    totalCases: 23,
    pendingCases: 2,
    avgRiskScore: 38,
    thisMonthUploads: 15,
    averageProcessingTime: '1h 45m',
    improvementTrend: '+12%',
    learningProgress: 68,
    currentSkillLevel: 'intermediate',
  };

  // Recent cases with explainability
  const recentCases = [
    {
      id: 'case_23',
      customerName: 'Marina Weber',
      status: 'completed',
      riskScore: 42,
      riskLevel: 'medium',
      uploadedAt: '2024-01-20T09:15:00Z',
      topFindings: ['Zeitdruck erkannt', 'Produktkomplexität hoch'],
      aiReasoning: {
        confidence: 'high' as const,
        confidenceScore: 89,
        methodology: 'pattern_recognition' as const,
        evidencePoints: [
          'Verkaufsgespräch länger als üblich',
          'Mehrfache Rückfragen des Kunden',
          'Komplexe Produktstrukturen erwähnt',
        ],
        contextFactors: ['Erstes Kundengespräch', 'Produkt: Kombi-Versicherung', 'Abendtermin'],
        falsePositiveRisk: 11,
      },
    },
    {
      id: 'case_22',
      customerName: 'Thomas Schmidt',
      status: 'completed',
      riskScore: 15,
      riskLevel: 'low',
      uploadedAt: '2024-01-19T14:30:00Z',
      topFindings: ['Sehr gute Beratungsqualität', 'Vollständige Dokumentation'],
      aiReasoning: {
        confidence: 'very_high' as const,
        confidenceScore: 95,
        methodology: 'compliance_check' as const,
        evidencePoints: [
          'Vollständige Risikoaufklärung',
          'Angemessene Bedenkzeit gewährt',
          'Dokumentation vollständig',
        ],
        contextFactors: ['Stammkunde', 'Standardprodukt', 'Terminserie abgeschlossen'],
        falsePositiveRisk: 3,
      },
    },
  ];

  // Learning recommendations based on recent performance
  const learningRecommendations = [
    {
      id: 'mod_1',
      title: 'Verkaufsdruck vermeiden',
      description: 'Techniken für entspannte Gesprächsführung',
      category: 'sales_techniques' as const,
      type: 'interactive' as const,
      level: 'intermediate' as const,
      duration: 45,
      tags: ['pressure', 'communication'],
      url: '/learning/mod_1',
      learningObjectives: ['Entspannte Gesprächsführung', 'Kundenorientierung'],
      completionRate: 0,
      estimatedImpact: 'Reduziert Risiko-Score um 15-20%',
    },
  ];

  // Improvement suggestions from recent cases
  const improvementSuggestions = [
    {
      id: 'sugg_1',
      category: 'communication_skills' as const,
      priority: 'high' as const,
      currentPhrase: 'Sie müssen sich heute entscheiden',
      suggestedPhrase: 'Sie haben gerne Zeit zum Überlegen - rufen Sie mich bei Fragen an',
      explanation: 'Vermeidet Zeitdruck und zeigt Kundenorientierung',
      relatedLearningModules: ['mod_1'],
      estimatedImpact: 'Reduziert Risiko-Score um 20%',
      difficulty: 'easy' as const,
    },
  ];

  const getRiskColor = (level: string) => {
    const colors = getRiskColorClasses(level);
    return colors.text;
  };

  const getStatusBadge = (status: string) => {
    const variant = getStatusBadgeVariant(status);
    const labels = {
      completed: 'Abgeschlossen',
      processing: 'In Bearbeitung',
      pending: 'Ausstehend',
    };
    return <Badge variant={variant}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Performance Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verkäufer Dashboard</h1>
          <p className="text-muted-foreground">Ihre Performance-Übersicht und Lernempfehlungen</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={getTrendBadgeVariant(stats.improvementTrend.startsWith('+') ? 'up' : 'down')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            {stats.improvementTrend} diese Woche
          </Badge>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="w-4 h-4 mr-2" />
            Neuen Fall hochladen
          </Button>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamt-Fälle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">Letzten 30 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ø Risiko-Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.avgRiskScore}/100</div>
            <p className="text-xs text-muted-foreground">Sehr gut! ↗</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCases}</div>
            <p className="text-xs text-muted-foreground">Ausstehend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bearbeitungszeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProcessingTime}</div>
            <p className="text-xs text-muted-foreground">Durchschnitt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lernfortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.learningProgress}%</div>
            <p className="text-xs text-muted-foreground">Module abgeschlossen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skill-Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">{stats.currentSkillLevel}</div>
            <p className="text-xs text-muted-foreground">Aktuelles Niveau</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases with AI Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Letzte Fälle
            </CardTitle>
            <CardDescription>Ihre kürzlich abgeschlossenen Beratungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCases.map((case_) => (
              <div key={case_.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{case_.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(case_.uploadedAt)} • {case_.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {case_.riskScore && (
                      <span className={`font-bold ${getRiskColor(case_.riskLevel)}`}>
                        {case_.riskScore}/100
                      </span>
                    )}
                    {getStatusBadge(case_.status)}
                  </div>
                </div>

                {case_.riskScore && (
                  <div className="space-y-2">
                    <Progress value={case_.riskScore} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      <strong>Erkannt:</strong> {case_.topFindings.join(', ')}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/cases/${case_.id}`)}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI-Erklärung
                  </Button>
                  {case_.riskScore > 50 && (
                    <Button variant="outline" size="sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Lernen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Explainability for Latest Case */}
        <ExplainabilityCard
          findingId={recentCases[0].id}
          aiReasoning={recentCases[0].aiReasoning}
          compact={true}
          onViewLearning={() => console.log('Open learning module')}
        />
      </div>

      {/* Learning & Improvement Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Learning Path */}
        <LearningPathWidget
          recommendedModules={learningRecommendations}
          currentSkillLevel={'intermediate' as const}
          targetSkillLevel="advanced"
          completionRate={stats.learningProgress}
          onStartModule={(moduleId) => console.log('Start module:', moduleId)}
        />

        {/* Improvement Suggestions */}
        <ImprovementSuggestionsCard
          suggestions={improvementSuggestions}
          onViewLearningModule={(moduleId) => console.log('View module:', moduleId)}
        />
      </div>

      {/* Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ihre Performance-Entwicklung
          </CardTitle>
          <CardDescription>Risiko-Score Entwicklung der letzten 4 Wochen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { week: 'Woche 1', score: 52, cases: 6 },
              { week: 'Woche 2', score: 47, cases: 5 },
              { week: 'Woche 3', score: 41, cases: 7 },
              { week: 'Woche 4', score: 38, cases: 5 },
            ].map((week, index) => (
              <div key={week.week} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{week.week}</div>
                <div className="flex-1">
                  <Progress value={week.score} className="h-3" />
                </div>
                <div className="w-16 text-sm font-bold text-right">{week.score}/100</div>
                <div className="w-16 text-xs text-muted-foreground text-right">
                  {week.cases} Fälle
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 bg-success/10 rounded-lg border-l-4 border-success">
              <p className="text-sm text-success font-medium">
                ⭐ Ausgezeichnete Verbesserung: -14 Punkte in 4 Wochen!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sie haben Ihr Beratungsrisiko um 27% reduziert.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Neuen Fall erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Laden Sie eine neue Aufnahme zur Analyse hoch
            </p>
            <Button className="w-full" onClick={() => navigate('/upload')}>
              <Upload className="w-4 h-4 mr-2" />
              Aufnahme hochladen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Weiterlernen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verbessern Sie Ihre Beratungsqualität mit gezielten Modulen
            </p>
            <Button variant="outline" className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Lernmodule öffnen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Performance-Ziele
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Setzen Sie sich neue Ziele und verfolgen Sie Ihren Fortschritt
            </p>
            <Button variant="outline" className="w-full">
              <Target className="w-4 h-4 mr-2" />
              Ziele verwalten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
