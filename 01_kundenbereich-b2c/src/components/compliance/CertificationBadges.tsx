import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, CheckCircle, ExternalLink } from 'lucide-react';

export function CertificationBadges() {
  const certifications = [
    {
      name: 'Direktvertrieb Deutschland e.V.',
      type: 'Mitgliedschaft',
      status: 'Aktiv',
      description: 'Ethischer Verhaltenskodex im Direktvertrieb',
      verified: true,
      url: 'https://direktvertrieb.de',
    },
    {
      name: 'ISO 27001',
      type: 'Datenschutz',
      status: 'Zertifiziert',
      description: 'Informationssicherheits-Management',
      verified: true,
      url: null,
    },
    {
      name: 'ISO 9001',
      type: 'Qualität',
      status: 'Zertifiziert',
      description: 'Qualitätsmanagementsystem',
      verified: true,
      url: null,
    },
    {
      name: 'BaFin Registrierung',
      type: 'Finanzaufsicht',
      status: 'Registriert',
      description: 'Bundesanstalt für Finanzdienstleistungsaufsicht',
      verified: true,
      url: 'https://bafin.de',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktiv':
      case 'Zertifiziert':
      case 'Registriert':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-accent" />
          <div>
            <CardTitle>Zertifizierungen & Mitgliedschaften</CardTitle>
            <CardDescription>Offizielle Anerkennungen und Compliance-Status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {certifications.map((cert) => (
            <div
              key={cert.name}
              className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/20"
            >
              <div className="flex-shrink-0 mt-1">
                {cert.verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Shield className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium truncate">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">{cert.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(cert.status)} className="text-xs">
                      {cert.status}
                    </Badge>
                    {cert.url && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground cursor-pointer" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {cert.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Vollständige Compliance-Abdeckung
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Alle relevanten Branchen-Standards und behördlichen Anforderungen erfüllt
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
