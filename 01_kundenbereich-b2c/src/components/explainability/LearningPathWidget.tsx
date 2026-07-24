import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, PlayCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { LearningModule, SkillLevel } from '@/types/learning';

interface LearningPathWidgetProps {
  recommendedModules: LearningModule[];
  currentSkillLevel: SkillLevel;
  targetSkillLevel: SkillLevel;
  completionRate: number;
  onStartModule: (moduleId: string) => void;
}

const getSkillLevelColor = (level: SkillLevel) => {
  switch (level) {
    case 'beginner':
      return 'bg-red-500/10 text-red-700 dark:text-red-300';
    case 'intermediate':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
    case 'advanced':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
    case 'expert':
      return 'bg-green-500/10 text-green-700 dark:text-green-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getModuleTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <PlayCircle className="h-4 w-4" />;
    case 'interactive':
      return <Target className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

export function LearningPathWidget({
  recommendedModules,
  currentSkillLevel,
  targetSkillLevel,
  completionRate,
  onStartModule,
}: LearningPathWidgetProps) {
  return (
    <Card className="border-muted/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Persönlicher Lernpfad
        </CardTitle>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Aktuell:</span>
            <Badge variant="outline" className={getSkillLevelColor(currentSkillLevel)}>
              {currentSkillLevel}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline" className={getSkillLevelColor(targetSkillLevel)}>
              {targetSkillLevel}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{completionRate}% abgeschlossen</div>
        </div>

        <Progress value={completionRate} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">Empfohlene Module:</h4>
          <div className="space-y-3">
            {recommendedModules.slice(0, 3).map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-3 border border-muted rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getModuleTypeIcon(module.type)}
                    <h5 className="font-medium text-sm truncate">{module.title}</h5>
                    <Badge variant="secondary" className={getSkillLevelColor(module.level)}>
                      {module.level}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {module.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {module.completionRate}% erfolgreich
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => onStartModule(module.id)}
                  className="ml-3 flex-shrink-0"
                >
                  Starten
                </Button>
              </div>
            ))}
          </div>
        </div>

        {recommendedModules.length > 3 && (
          <Button variant="outline" className="w-full">
            Alle {recommendedModules.length} Module anzeigen
          </Button>
        )}

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-muted">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {recommendedModules.reduce((acc, m) => acc + m.duration, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Min. Lernzeit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{recommendedModules.length}</div>
            <div className="text-xs text-muted-foreground">Module verfügbar</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
