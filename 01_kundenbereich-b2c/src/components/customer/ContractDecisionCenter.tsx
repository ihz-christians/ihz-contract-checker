import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mic,
  MicOff,
  FileText,
  AlertTriangle,
  Shield,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractDecisionCenterProps {
  daysRemaining: number;
  productType: string;
  onAccept: (reason?: string, audioUrl?: string) => void;
  onReject: (reason: string, audioUrl?: string) => void;
}

export function ContractDecisionCenter({
  daysRemaining,
  productType,
  onAccept,
  onReject,
}: ContractDecisionCenterProps) {
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [useVoice, setUseVoice] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showCountdown, setShowCountdown] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setReason(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      if (useVoice && recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
    }
  };

  const startCountdown = () => {
    setShowCountdown(true);
    setCountdown(10);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setShowCountdown(false);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAccept = () => {
    startCountdown();
    setTimeout(() => {
      onAccept(reason || undefined, audioUrl || undefined);
      resetForm();
      setIsAcceptOpen(false);
    }, 10000);
  };

  const handleReject = () => {
    if (reason.trim()) {
      onReject(reason, audioUrl || undefined);
      resetForm();
      setIsRejectOpen(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setAudioUrl(null);
    setUseVoice(false);
    setIsRecording(false);
    setIsTranscribing(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setShowCountdown(false);
  };

  const getUrgencyColor = () => {
    if (daysRemaining <= 3) return 'text-destructive';
    if (daysRemaining <= 7) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getUrgencyBg = () => {
    if (daysRemaining <= 3) return 'bg-destructive/10 border-destructive/20';
    if (daysRemaining <= 7) return 'bg-warning/10 border-warning/20';
    return 'bg-muted/50 border-border';
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-4 bg-gradient-to-br from-background to-muted/20',
        getUrgencyBg()
      )}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center">
          <div className="p-2 rounded-full bg-gradient-to-r from-premium/20 to-gold/20 border border-premium/30">
            <Scale className="h-5 w-5 text-premium" />
          </div>
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-premium to-gold bg-clip-text text-transparent">
          Vertragsentscheidung
        </h3>
        <p className="text-sm text-muted-foreground">
          Treffen Sie Ihre endgültige Entscheidung bezüglich des Vertrages
        </p>
      </div>

      {/* Contract Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-gradient-to-r from-gold/5 via-premium/5 to-success/5 rounded-lg border border-premium/20">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Produkt</p>
          <p className="font-medium text-premium text-sm truncate">{productType}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Unterlagen</p>
          <Button
            variant="link"
            className="font-medium p-0 h-auto text-gold hover:text-gold-dark text-xs"
          >
            zum Angebot
          </Button>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Widerrufsfrist</p>
          <p className={cn('font-medium text-sm', getUrgencyColor())}>{daysRemaining} Tage</p>
        </div>
      </div>

      {/* Warning */}
      {daysRemaining <= 3 && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive text-sm">
              Dringende Entscheidung erforderlich
            </p>
            <p className="text-xs text-muted-foreground">
              Ihre Widerrufsfrist läuft in {daysRemaining} Tagen ab. Treffen Sie bald eine
              Entscheidung, um Ihre Rechte zu wahren.
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Accept Contract */}
        <Dialog open={isAcceptOpen} onOpenChange={setIsAcceptOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="h-auto py-3 flex-col gap-2 bg-gradient-to-br from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground shadow-md hover:shadow-success/25 hover:scale-[1.02] transition-all duration-200 text-center"
              onClick={() => setIsAcceptOpen(true)}
            >
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-center space-y-0.5">
                <div className="font-semibold text-sm">Vertrag akzeptieren</div>
                <div className="text-xs opacity-90">Bestätigung der Vereinbarung</div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Vertrag akzeptieren
              </DialogTitle>
              <DialogDescription>
                Sie bestätigen die Annahme des Vertrages. Diese Entscheidung ist rechtlich bindend.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Optional Reason */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Begründung (optional):</h4>
                  <Button
                    variant={useVoice ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseVoice(!useVoice)}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Sprache
                  </Button>
                </div>

                {useVoice && (
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? 'destructive' : 'outline'}
                      size="sm"
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isRecording ? 'Stop' : 'Aufnahme'}
                    </Button>
                    {isTranscribing && <Badge variant="secondary">Transkribierung...</Badge>}
                  </div>
                )}

                <Textarea
                  placeholder="Warum akzeptieren Sie den Vertrag? (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Countdown Warning */}
              {showCountdown && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="font-medium">Bestätigung in {countdown} Sekunden</span>
                  </div>
                  <Progress value={(10 - countdown) * 10} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Die Vertragsannahme wird automatisch bestätigt.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAccept} className="flex-1" disabled={showCountdown}>
                  {showCountdown ? 'Wird bestätigt...' : 'Akzeptieren'}
                </Button>
                <Button variant="outline" onClick={() => setIsAcceptOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reject Contract */}
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              className="h-auto py-3 flex-col gap-2 bg-gradient-to-br from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-foreground shadow-md hover:shadow-warning/25 hover:scale-[1.02] transition-all duration-200 text-center"
              onClick={() => setIsRejectOpen(true)}
            >
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-center space-y-0.5">
                <div className="font-semibold text-sm">Vertrag widerrufen</div>
                <div className="text-xs opacity-90">Kostenloser Widerruf</div>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Vertrag widerrufen
              </DialogTitle>
              <DialogDescription>
                Sie widerrufen den Vertrag innerhalb der gesetzlichen Frist. Bitte geben Sie einen
                Grund an.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Required Reason */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Widerrufsgrund*:</h4>
                  <Button
                    variant={useVoice ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseVoice(!useVoice)}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Sprache
                  </Button>
                </div>

                {useVoice && (
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? 'destructive' : 'outline'}
                      size="sm"
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isRecording ? 'Stop' : 'Aufnahme'}
                    </Button>
                    {isTranscribing && <Badge variant="secondary">Transkribierung...</Badge>}
                  </div>
                )}

                <Textarea
                  placeholder="Bitte geben Sie Ihren Widerrufsgrund an..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* Legal Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Ihr Recht auf Widerruf</p>
                    <p className="text-muted-foreground">
                      Sie können den Vertrag innerhalb von 14 Tagen ohne Angabe von Gründen
                      widerrufen. Die Begründung dient der internen Qualitätsverbesserung.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1"
                  disabled={!reason.trim()}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Widerruf einreichen
                </Button>
                <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
