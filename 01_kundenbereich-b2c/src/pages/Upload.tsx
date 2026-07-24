import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { FilePreview } from '@/components/upload/FilePreview';
import { CaseCreationForm } from '@/components/upload/CaseCreationForm';
import { DemonstrationBanner, ProcessingNote } from '@/components/upload/DemonstrationBanner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { CaseFormData } from '@/types/upload';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Upload as UploadIcon, CheckCircle2, Clock } from 'lucide-react';

export default function Upload() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [caseData, setCaseData] = useState<Partial<CaseFormData>>({});
  const { files, isUploading, addFiles, removeFile, uploadFiles } = useFileUpload();

  const steps = [
    { id: 1, name: 'Dateien hochladen', description: 'Audio und Dokumente auswählen' },
    { id: 2, name: 'Fall-Details', description: 'Kunden- und Produktinformationen' },
    { id: 3, name: 'Verarbeitung', description: 'Upload und Analyse starten' },
  ];

  const handleCaseSubmit = (formData: CaseFormData) => {
    setCaseData(formData);
    setCurrentStep(3);
    handleStartProcessing();
  };

  const handleStartProcessing = async () => {
    if (files.length === 0) {
      toast({
        title: 'Keine Dateien',
        description: 'Bitte laden Sie mindestens eine Datei hoch',
        variant: 'destructive',
      });
      return;
    }

    try {
      await uploadFiles();

      // Simulate case processing
      setTimeout(() => {
        toast({
          title: 'Fall erfolgreich erstellt',
          description: 'Der neue Fall wurde erfolgreich erstellt und die Analyse wurde gestartet',
        });

        // Redirect to cases page in a real app
        navigate('/cases');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Fehler beim Upload',
        description: 'Ein Fehler ist beim Hochladen aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const canProceedToStep2 = files.length > 0;
  const allFilesUploaded = files.length > 0 && files.every((f) => f.status === 'success');

  const addDemoFile = () => {
    const mockContent = new Blob(['Demo audio content'], { type: 'audio/mp3' });
    const mockFile = new File([mockContent], 'demo_beratung_2024.mp3', {
      type: 'audio/mp3',
      lastModified: Date.now(),
    });
    addFiles([mockFile]);

    // Auto-fill form data for the demo
    const demoData: Partial<CaseFormData> = {
      customer: {
        name: 'Max Mustermann (Demo)',
        age: 45,
        location: 'Berlin',
        phone: '+49 123 456789',
      },
      seller: {
        name: 'Anna Verkäuferin',
        agencyId: 'AG-12345',
        campaign: 'Sommer-Aktion 2024',
      },
      product: {
        industry: 'telecommunications',
        category: 'Glasfaser 1000',
        value: 89.99,
        duration: 24,
      },
      consent: {
        recording: true,
        dataProcessing: true,
        demonstration: true,
      },
    };

    setCaseData(demoData);
    setCurrentStep(2); // Auto-advance to the form step

    toast({
      title: 'Demo-Fall geladen',
      description:
        'Datei und Beispieldaten wurden automatisch eingefügt. Sie können den Fall nun überprüfen und direkt hochladen.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Neuen Fall erstellen</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Laden Sie Ihre Beratungsgespräche hoch und starten Sie die Compliance-Analyse
        </p>
      </div>

      {/* Demonstration Banner */}
      <DemonstrationBanner />

      <div className="flex justify-center mt-4 mb-4">
        <Button
          variant="outline"
          onClick={addDemoFile}
          type="button"
          className="border-primary text-primary hover:bg-primary hover:text-white"
        >
          Demo-Datei einfügen (Test durchwinken)
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UploadIcon className="h-5 w-5 text-accent" />
            <span>Upload-Fortschritt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 shadow-sm ${
                    currentStep >= step.id
                      ? 'bg-accent border-accent text-accent-foreground shadow-md'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-6" />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schritt 1: Dateien hochladen</CardTitle>
              <CardDescription>
                Laden Sie Audio-Aufnahmen des Verkaufsgesprächs und relevante Vertragsdokumente hoch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileDropZone onFilesAdded={addFiles} />
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hochgeladene Dateien ({files.length})</CardTitle>
                <CardDescription>
                  Überprüfen Sie die ausgewählten Dateien vor dem Fortfahren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <FilePreview key={file.id} file={file} onRemove={removeFile} />
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {files.length} Datei(en) bereit für Upload
                  </div>
                  <Button
                    variant="homepage"
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="ml-auto"
                  >
                    Weiter zu Fall-Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Case Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schritt 2: Fall-Details eingeben</CardTitle>
              <CardDescription>
                Geben Sie die erforderlichen Informationen für die Compliance-Analyse ein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge variant="outline" className="mb-2">
                  {files.length} Datei(en) ausgewählt
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="ml-2"
                >
                  Dateien bearbeiten
                </Button>
              </div>

              <CaseCreationForm onSubmit={handleCaseSubmit} initialData={caseData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schritt 3: Upload und Verarbeitung</CardTitle>
              <CardDescription>
                Dateien werden hochgeladen und die KI-Analyse wird gestartet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-accent" />
                <span className="font-medium">
                  {isUploading ? 'Upload läuft...' : 'Bereit für Upload'}
                </span>
              </div>

              <div className="space-y-3">
                {files.map((file) => (
                  <FilePreview key={file.id} file={file} onRemove={removeFile} />
                ))}
              </div>

              {!isUploading && !allFilesUploaded && (
                <Button
                  variant="homepage"
                  onClick={handleStartProcessing}
                  className="w-full"
                  size="lg"
                >
                  Upload starten und Fall erstellen
                </Button>
              )}

              {allFilesUploaded && (
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-success">Upload erfolgreich abgeschlossen</p>
                        <p className="text-sm text-success/80">
                          Der Fall wurde erstellt und die Analyse wurde gestartet
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <ProcessingNote />
        </div>
      )}
    </div>
  );
}
