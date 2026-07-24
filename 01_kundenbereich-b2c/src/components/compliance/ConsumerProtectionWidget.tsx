import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Phone, AlertCircle, CheckCircle } from 'lucide-react';

export function ConsumerProtectionWidget() {
  const protectionStatus = {
    level: 'Vollschutz aktiv',
    color: 'success' as const,
    icon: <CheckCircle className="h-4 w-4" />,
  };

  const quickActions = [
    {
      title: 'BaFin-Beschwerde',
      description: 'Direkte Weiterleitung zur Finanzaufsicht',
      icon: <ExternalLink className="h-4 w-4" />,
      variant: 'outline' as const,
      urgent: false,
    },
    {
      title: 'Bundesnetzagentur',
      description: 'Energie & Telekom Beschwerden',
      icon: <ExternalLink className="h-4 w-4" />,
      variant: 'outline' as const,
      urgent: false,
    },
    {
      title: 'Widerruf einreichen',
      description: '14-Tage Widerrufsrecht ausüben',
      icon: <FileText className="h-4 w-4" />,
      variant: 'default' as const,
      urgent: true,
    },
    {
      title: 'Verbraucherzentrale',
      description: 'Kostenlose Beratung vereinbaren',
      icon: <Phone className="h-4 w-4" />,
      variant: 'outline' as const,
      urgent: false,
    },
  ];

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Verbraucherschutz</CardTitle>
            <CardDescription>Ihre Rechte & Beschwerdemöglichkeiten</CardDescription>
          </div>
          <Badge variant="default" className="bg-success text-success-foreground">
            {protectionStatus.icon}
            <span className="ml-1">{protectionStatus.level}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className={`justify-start h-auto p-3 ${action.urgent ? 'border-warning bg-warning/5' : ''}`}
              onClick={() => console.log(`Navigate to ${action.title}`)}
            >
              <div className="flex items-start space-x-3">
                {action.icon}
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                {action.urgent && <AlertCircle className="h-4 w-4 text-warning ml-auto" />}
              </div>
            </Button>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            ✓ Automatische Rechtsprüfung aktiv
            <br />
            ✓ 14-Tage Widerrufsrecht sichergestellt
            <br />✓ Direkter Zugang zu allen Beschwerdestellen
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
