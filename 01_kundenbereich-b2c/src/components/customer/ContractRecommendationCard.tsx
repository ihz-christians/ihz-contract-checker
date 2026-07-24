import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Shield, Scale } from 'lucide-react';

interface ContractRecommendationCardProps {
  recommendation: 'accept' | 'reject' | 'caution';
  confidenceScore: number;
  reasons: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  criteriaScores: {
    transparency: number;
    fairness: number;
    compliance: number;
    customerBenefit: number;
  };
}

export function ContractRecommendationCard({
  recommendation,
  confidenceScore,
  reasons,
  criteriaScores,
}: ContractRecommendationCardProps) {
  const getRecommendationConfig = () => {
    switch (recommendation) {
      case 'accept':
        return {
          icon: CheckCircle,
          title: 'Empfehlung: Vertrag akzeptieren',
          color: 'text-success',
          bgColor: 'bg-success/5',
          borderColor: 'border-success/20',
        };
      case 'reject':
        return {
          icon: XCircle,
          title: 'Empfehlung: Vertrag ablehnen',
          color: 'text-destructive',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20',
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          title: 'Vorsicht geboten',
          color: 'text-warning',
          bgColor: 'bg-warning/5',
          borderColor: 'border-warning/20',
        };
    }
  };

  const config = getRecommendationConfig();
  const Icon = config.icon;

  const criteriaIcons = {
    transparency: Scale,
    fairness: Shield,
    compliance: CheckCircle,
    customerBenefit: TrendingUp,
  };

  const criteriaLabels = {
    transparency: 'Transparenz',
    fairness: 'Fairness',
    compliance: 'Compliance',
    customerBenefit: 'Kundenvorteil',
  };

  return (
    <Card className={`card-professional ${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{config.title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">KI-Vertrauen:</span>
              <Badge
                variant={
                  confidenceScore >= 80
                    ? 'default'
                    : confidenceScore >= 60
                      ? 'secondary'
                      : 'outline'
                }
              >
                {confidenceScore}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Analyse-Sicherheit</span>
            <span className="font-medium">{confidenceScore}%</span>
          </div>
          <Progress value={confidenceScore} className="h-2" />
        </div>

        {/* Criteria Scores */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Bewertungskriterien
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(criteriaScores).map(([key, score]) => {
              const IconComponent = criteriaIcons[key as keyof typeof criteriaIcons];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {criteriaLabels[key as keyof typeof criteriaLabels]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={score} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium w-8">{score}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reasons */}
        <div className="space-y-4">
          {reasons.positive.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-success flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Positive Aspekte
              </h4>
              <ul className="space-y-1">
                {reasons.positive.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasons.negative.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Kritische Punkte
              </h4>
              <ul className="space-y-1">
                {reasons.negative.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasons.neutral.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Weitere Überlegungen
              </h4>
              <ul className="space-y-1">
                {reasons.neutral.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
