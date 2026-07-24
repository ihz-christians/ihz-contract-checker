import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseFormData } from '@/types/upload';
import { IndustrySelector } from './IndustrySelector';
import { User, Building, Package, Shield } from 'lucide-react';

interface CaseCreationFormProps {
  onSubmit: (data: CaseFormData) => void;
  initialData?: Partial<CaseFormData>;
}

export function CaseCreationForm({ onSubmit, initialData }: CaseCreationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CaseFormData>({
    defaultValues: initialData,
  });

  const watchedIndustry = watch('product.industry');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Kundeninformationen</CardTitle>
              <CardDescription>Grundlegende Informationen zum Kunden</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer.name">Name *</Label>
              <Input
                id="customer.name"
                {...register('customer.name', { required: 'Name ist erforderlich' })}
                placeholder="Max Mustermann"
              />
              {errors.customer?.name && (
                <p className="text-sm text-destructive mt-1">{errors.customer.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer.age">Alter *</Label>
              <Input
                id="customer.age"
                type="number"
                {...register('customer.age', {
                  required: 'Alter ist erforderlich',
                  min: { value: 18, message: 'Mindestens 18 Jahre' },
                  max: { value: 120, message: 'Maximaler Wert: 120 Jahre' },
                })}
                placeholder="35"
              />
              {errors.customer?.age && (
                <p className="text-sm text-destructive mt-1">{errors.customer.age.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer.location">Standort *</Label>
              <Input
                id="customer.location"
                {...register('customer.location', { required: 'Standort ist erforderlich' })}
                placeholder="Berlin, Deutschland"
              />
              {errors.customer?.location && (
                <p className="text-sm text-destructive mt-1">{errors.customer.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer.phone">Telefonnummer</Label>
              <Input
                id="customer.phone"
                {...register('customer.phone')}
                placeholder="+49 30 12345678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Verkäufer & Agentur</CardTitle>
              <CardDescription>Informationen zum Verkaufspersonal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seller.name">Verkäufername *</Label>
              <Input
                id="seller.name"
                {...register('seller.name', { required: 'Verkäufername ist erforderlich' })}
                placeholder="Anna Schmidt"
              />
              {errors.seller?.name && (
                <p className="text-sm text-destructive mt-1">{errors.seller.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="seller.agencyId">Agentur-ID *</Label>
              <Input
                id="seller.agencyId"
                {...register('seller.agencyId', { required: 'Agentur-ID ist erforderlich' })}
                placeholder="AG-2024-001"
              />
              {errors.seller?.agencyId && (
                <p className="text-sm text-destructive mt-1">{errors.seller.agencyId.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="seller.campaign">Kampagne *</Label>
              <Select onValueChange={(value) => setValue('seller.campaign', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kampagne auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summer-2024">Sommer Aktion 2024</SelectItem>
                  <SelectItem value="new-customer">Neukunden-Kampagne</SelectItem>
                  <SelectItem value="retention">Kundenbindung Premium</SelectItem>
                  <SelectItem value="regional-north">Regional Nord</SelectItem>
                </SelectContent>
              </Select>
              {errors.seller?.campaign && (
                <p className="text-sm text-destructive mt-1">{errors.seller.campaign.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Produktinformationen</CardTitle>
              <CardDescription>Details zum verkauften Produkt oder Service</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndustrySelector
            value={watchedIndustry}
            onChange={(value) => setValue('product.industry', value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product.value">Vertragswert (€) *</Label>
              <Input
                id="product.value"
                type="number"
                {...register('product.value', {
                  required: 'Vertragswert ist erforderlich',
                  min: { value: 1, message: 'Wert muss größer als 0 sein' },
                })}
                placeholder="1500"
              />
              {errors.product?.value && (
                <p className="text-sm text-destructive mt-1">{errors.product.value.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="product.duration">Laufzeit (Monate) *</Label>
              <Input
                id="product.duration"
                type="number"
                {...register('product.duration', {
                  required: 'Laufzeit ist erforderlich',
                  min: { value: 1, message: 'Mindestens 1 Monat' },
                  max: { value: 120, message: 'Maximal 120 Monate' },
                })}
                placeholder="24"
              />
              {errors.product?.duration && (
                <p className="text-sm text-destructive mt-1">{errors.product.duration.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Consent */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Rechtliche Einverständniserklärungen</CardTitle>
              <CardDescription>Erforderliche Zustimmungen für die Verarbeitung</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent.recording"
                {...register('consent.recording', { required: true })}
              />
              <Label htmlFor="consent.recording" className="text-sm">
                Einverständnis zur Aufzeichnung des Verkaufsgesprächs liegt vor *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent.dataProcessing"
                {...register('consent.dataProcessing', { required: true })}
              />
              <Label htmlFor="consent.dataProcessing" className="text-sm">
                DSGVO-konforme Einverständniserklärung zur Datenverarbeitung *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent.demonstration"
                {...register('consent.demonstration', { required: true })}
              />
              <Label htmlFor="consent.demonstration" className="text-sm">
                Bestätigung: Nur zu Demonstrationszwecken *
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" variant="homepage" className="w-full" size="lg">
        Fall erstellen und Analyse starten
      </Button>
    </form>
  );
}
