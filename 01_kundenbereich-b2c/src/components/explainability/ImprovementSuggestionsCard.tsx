import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ArrowRight, Lightbulb, BookOpen, Copy } from 'lucide-react';
import { ImprovementSuggestion } from '@/types/explainability';
import { useToast } from '@/hooks/use-toast';

interface ImprovementSuggestionsCardProps {
  suggestions: ImprovementSuggestion[];
  onViewLearningModule: (moduleId: string) => void;
}

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'hard':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
};

export function ImprovementSuggestionsCard({
  suggestions,
  onViewLearningModule,
}: ImprovementSuggestionsCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Kopiert',
      description: 'Text wurde in die Zwischenablage kopiert',
    });
  };

  return (
    <Card className="border-muted/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          Verbesserungsvorschläge
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPriorityVariant(suggestion.priority)}>
                    {suggestion.priority}
                  </Badge>
                  <span className={`text-sm ${getDifficultyColor(suggestion.difficulty)}`}>
                    {suggestion.difficulty}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{suggestion.explanation}</p>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-destructive">Problematisch:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion.currentPhrase)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                  "{suggestion.currentPhrase}"
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-success">Besser:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(suggestion.suggestedPhrase)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-2 bg-success/10 border border-success/20 rounded text-sm">
                  "{suggestion.suggestedPhrase}"
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium">Erwarteter Effekt:</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{suggestion.estimatedImpact}</p>
            </div>

            {suggestion.relatedLearningModules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestion.relatedLearningModules.map((moduleId) => (
                  <Button
                    key={moduleId}
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLearningModule(moduleId)}
                    className="text-xs"
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Lernmodul
                  </Button>
                ))}
              </div>
            )}

            {index < suggestions.length - 1 && <Separator />}
          </div>
        ))}

        {suggestions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p>Keine Verbesserungsvorschläge erforderlich</p>
            <p className="text-sm">Das Gespräch entspricht den Standards</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
