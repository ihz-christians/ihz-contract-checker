import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export function ComplianceMetrics() {
  const metrics = [
    {
      title: 'Compliance-Rate',
      value: '97.3%',
      change: '+2.1%',
      description: 'Erfüllung regulatorischer Vorgaben',
      trend: 'up',
      color: 'success',
    },
    {
      title: 'Risk-Mitigation ROI',
      value: '€847K',
      change: '+15.3%',
      description: 'Kostenersparnis durch Compliance',
      trend: 'up',
      color: 'success',
    },
    {
      title: 'Customer Trust Score',
      value: '94.2',
      change: '+3.7',
      description: 'Vertrauensindex durch Schutzmaßnahmen',
      trend: 'up',
      color: 'success',
    },
    {
      title: 'Regulatory Costs',
      value: '€12.4K',
      change: '-8.2%',
      description: 'Präventive Compliance-Kosten',
      trend: 'down',
      color: 'success',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span
                className={`flex items-center ${metric.trend === 'up' ? 'text-success' : 'text-muted-foreground'}`}
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                {metric.change}
              </span>
              <span>vs. Vormonat</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
