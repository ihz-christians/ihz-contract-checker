import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Brain, ChevronDown, Lightbulb, BookOpen, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { AIReasoning, ExplanationType } from '@/types/explainability';

interface ExplainabilityCardProps {
  findingId: string;
  aiReasoning: AIReasoning;
  onViewLearning?: () => void;
  compact?: boolean;
}

const getMethodologyIcon = (methodology: ExplanationType) => {
  switch (methodology) {
    case 'pattern_recognition':
      return <Brain className="h-4 w-4" />;
    case 'regulatory_breach':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
};

const getConfidenceBadgeVariant = (confidence: string) => {
  switch (confidence) {
    case 'very_high':
      return 'success';
    case 'high':
      return 'default';
    case 'medium':
      return 'warning';
    case 'low':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function ExplainabilityCard({
  findingId,
  aiReasoning,
  onViewLearning,
  compact = false,
}: ExplainabilityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-muted/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getMethodologyIcon(aiReasoning.methodology)}
            KI-Analyse Erklärung
          </CardTitle>
          <Badge variant={getConfidenceBadgeVariant(aiReasoning.confidence)}>
            {aiReasoning.confidence} ({aiReasoning.confidenceScore}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sicherheit der Analyse</span>
            <span className="font-medium">{aiReasoning.confidenceScore}%</span>
          </div>
          <Progress value={aiReasoning.confidenceScore} className="h-2" />
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto text-sm">
              Warum hat die KI das erkannt?
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Erkannte Muster:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {aiReasoning.evidencePoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="block w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {aiReasoning.contextFactors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Kontext-Faktoren:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {aiReasoning.contextFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="block w-1.5 h-1.5 bg-accent rounded-full mt-1.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiReasoning.alternativeInterpretations && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Alternative Deutungen:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {aiReasoning.alternativeInterpretations.map((alt, index) => (
                    <li key={index}>• {alt}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiReasoning.falsePositiveRisk > 20 && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 rounded text-sm">
                <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                <span className="text-warning-foreground">
                  Fehlalarm-Risiko: {aiReasoning.falsePositiveRisk}%
                </span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {onViewLearning && (
          <Button variant="outline" size="sm" className="w-full" onClick={onViewLearning}>
            <BookOpen className="h-4 w-4 mr-2" />
            Lernmodule anzeigen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
