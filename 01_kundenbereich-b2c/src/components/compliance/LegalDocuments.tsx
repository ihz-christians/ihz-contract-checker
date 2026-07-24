import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export function LegalDocuments() {
  const documents = [
    {
      title: 'Widerrufsformular',
      type: 'Rechtsdokument',
      status: 'Verfügbar',
      description: 'Automatisch generiertes, rechtkonformes Widerrufsformular',
      icon: <FileText className="h-4 w-4" />,
      urgent: false,
      generated: true,
    },
    {
      title: 'Gesprächsprotokoll',
      type: 'Dokumentation',
      status: 'Erstellt',
      description: 'Door2Door Verkaufsgespräch vom 15.12.2024',
      icon: <FileText className="h-4 w-4" />,
      urgent: false,
      generated: true,
    },
    {
      title: 'Compliance-Checkliste',
      type: 'Prüfdokument',
      status: 'Erforderlich',
      description: 'Branchenspezifische Prüfliste vor Vertragsabschluss',
      icon: <CheckCircle className="h-4 w-4" />,
      urgent: true,
      generated: false,
    },
    {
      title: 'Beratungsprotokoll',
      type: 'Pflichtdokument',
      status: 'Ausstehend',
      description: 'Versicherungsberatung - BaFin Anforderung',
      icon: <Clock className="h-4 w-4" />,
      urgent: true,
      generated: false,
    },
  ];

  const getStatusBadge = (status: string, urgent: boolean) => {
    if (urgent) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }

    switch (status) {
      case 'Verfügbar':
      case 'Erstellt':
        return (
          <Badge variant="default" className="bg-success text-success-foreground text-xs">
            {status}
          </Badge>
        );
      case 'Erforderlich':
      case 'Ausstehend':
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Rechtsdokumente & Protokolle</span>
        </CardTitle>
        <CardDescription>Automatische Dokumentation und rechtskonforme Formulare</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.title}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
          >
            <div className="flex items-start space-x-3">
              <div className={`mt-1 ${doc.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                {doc.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{doc.title}</span>
                  {getStatusBadge(doc.status, doc.urgent)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{doc.type}</p>
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {doc.generated ? (
                <Button size="sm" variant="outline" className="h-8">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              ) : (
                <Button size="sm" variant="homepage" className="h-8">
                  <FileText className="h-3 w-3 mr-1" />
                  Erstellen
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>✓ Automatische Rechtsprüfung</span>
            <span>✓ DSGVO-konforme Speicherung</span>
            <span>✓ Audit-Ready Dokumentation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
