import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Industry, IndustryConfig } from '@/types/upload';
import { Phone, Zap, Shield, CreditCard, Heart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndustrySelectorProps {
  value?: string;
  onChange: (industry: Industry) => void;
}

const industries: Record<Industry, IndustryConfig> = {
  telecommunications: {
    name: 'Telekommunikation',
    icon: 'Phone',
    categories: ['Mobilfunk', 'Internet', 'Festnetz', 'TV & Streaming'],
    complianceChecks: ['TKG-Konformität', 'Widerrufsrecht', 'Preistransparenz'],
  },
  energy: {
    name: 'Energie',
    icon: 'Zap',
    categories: ['Strom', 'Gas', 'Ökostrom', 'Kombitarife'],
    complianceChecks: ['EnWG-Compliance', 'Grundversorgung', 'Preisgarantien'],
  },
  insurance: {
    name: 'Versicherung',
    icon: 'Shield',
    categories: ['Krankenversicherung', 'Lebensversicherung', 'Sachversicherung'],
    complianceChecks: ['VAG-Konformität', 'Beratungsprotokoll', 'Bedenkzeit'],
  },
  finance: {
    name: 'Finanzdienstleistungen',
    icon: 'CreditCard',
    categories: ['Kredite', 'Girokonten', 'Anlagen', 'Baufinanzierung'],
    complianceChecks: ['MiFID II', 'Kreditprüfung', 'Risikoaufklärung'],
  },
  healthcare: {
    name: 'Gesundheit',
    icon: 'Heart',
    categories: ['Zusatzversicherung', 'Pflegeversicherung', 'Gesundheitsdienste'],
    complianceChecks: ['SGB V-Konformität', 'Datenschutz', 'Aufklärungspflicht'],
  },
};

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Phone':
      return Phone;
    case 'Zap':
      return Zap;
    case 'Shield':
      return Shield;
    case 'CreditCard':
      return CreditCard;
    case 'Heart':
      return Heart;
    default:
      return Phone;
  }
};

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Branche *</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(industries).map(([key, config]) => {
          const Icon = getIcon(config.icon);
          const isSelected = value === key;

          return (
            <Card
              key={key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-primary/50'
              )}
              onClick={() => onChange(key as Industry)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={cn('p-2 rounded-lg', isSelected ? 'bg-primary/20' : 'bg-muted')}>
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          'font-medium text-sm',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {config.name}
                      </h3>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>

                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {config.categories.slice(0, 2).map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                        {config.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{config.categories.length - 2}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {config.complianceChecks.length} Compliance-Prüfungen
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {value && (
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-3">
            <div className="text-sm">
              <p className="font-medium text-accent mb-1">Ausgewählte Compliance-Prüfungen:</p>
              <div className="flex flex-wrap gap-1">
                {industries[value as Industry].complianceChecks.map((check) => (
                  <Badge key={check} variant="outline" className="text-xs">
                    {check}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
