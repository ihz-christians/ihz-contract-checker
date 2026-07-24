import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  MessageCircle,
} from 'lucide-react';

interface ModernContractDecisionProps {
  daysRemaining: number;
  productType: string;
  onAccept: (reason?: string, audioUrl?: string) => void;
  onReject: (reason: string, audioUrl?: string) => void;
  recommendation?: 'accept' | 'reject' | 'caution';
}

export function ModernContractDecision({
  daysRemaining,
  productType,
  onAccept,
  onReject,
  recommendation = 'caution',
}: ModernContractDecisionProps) {
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setReason((prev) => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
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
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }

    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const startCountdown = () => {
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleFinalAccept();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      setCountdown(null);
    }
  };

  const handleFinalAccept = () => {
    onAccept(reason || undefined, audioUrl || undefined);
    resetForm();
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(reason, audioUrl || undefined);
    resetForm();
  };

  const resetForm = () => {
    setDecision(null);
    setReason('');
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlaying(false);
    setUseVoice(false);
    setCountdown(null);
    setIsTranscribing(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const getUrgencyLevel = () => {
    if (daysRemaining <= 1) return { level: 'critical', color: 'destructive' };
    if (daysRemaining <= 3) return { level: 'high', color: 'warning' };
    if (daysRemaining <= 7) return { level: 'medium', color: 'secondary' };
    return { level: 'low', color: 'outline' };
  };

  const urgency = getUrgencyLevel();
  const progressPercentage = Math.max(0, ((14 - daysRemaining) / 14) * 100);

  if (decision) {
    return (
      <Card className="card-professional border-2">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {decision === 'accept' ? (
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {decision === 'accept' ? 'Vertrag akzeptieren' : 'Vertrag widerrufen'}
          </CardTitle>
          {countdown && (
            <div className="mt-4">
              <div className="text-4xl font-bold text-primary mb-2">{countdown}</div>
              <p className="text-sm text-muted-foreground">
                Automatische Bestätigung in {countdown} Sekunden
              </p>
              <Progress value={(10 - countdown) * 10} className="mt-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {decision === 'reject' && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Grund für Widerruf (erforderlich):</strong>
              </p>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Bitte geben Sie den Grund für Ihren Widerruf an..."
                className="min-h-[100px]"
              />
            </div>
          )}

          {decision === 'accept' && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Optionaler Kommentar:</strong>
              </p>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Warum haben Sie sich für diesen Vertrag entschieden? (optional)"
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Voice Recording */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Spracheingabe</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className="flex items-center gap-2"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? 'Aufnahme stoppen' : 'Aufnehmen'}
              </Button>

              {audioUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                  className="flex items-center gap-2"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Abspielen'}
                </Button>
              )}

              {isTranscribing && (
                <Badge variant="secondary" className="animate-pulse">
                  Transkribiert...
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Abbrechen
            </Button>

            {decision === 'accept' ? (
              countdown ? (
                <Button variant="outline" onClick={cancelCountdown} className="flex-1">
                  Countdown stoppen
                </Button>
              ) : (
                <Button onClick={startCountdown} className="flex-1">
                  Bestätigen (10s Countdown)
                </Button>
              )
            ) : (
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
                disabled={!reason.trim()}
              >
                Widerruf einreichen
              </Button>
            )}
          </div>

          {decision === 'reject' && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
              <strong>Ihr Widerrufsrecht:</strong> Sie haben das Recht, binnen vierzehn Tagen ohne
              Angabe von Gründen diesen Vertrag zu widerrufen.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-professional border-2">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Badge variant={urgency.color as any} className="text-sm">
            {daysRemaining} {daysRemaining === 1 ? 'Tag' : 'Tage'} verbleibend
          </Badge>
        </div>
        <CardTitle className="text-2xl">Vertragsentscheidung</CardTitle>
        <p className="text-muted-foreground">{productType}</p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Widerrufsfrist</span>
            <span>{Math.round(progressPercentage)}% abgelaufen</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        {daysRemaining <= 3 && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="font-semibold text-warning">
                Dringende Entscheidung erforderlich
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ihre Widerrufsfrist läuft bald ab. Bitte treffen Sie zeitnah eine Entscheidung.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setDecision('accept')}
            size="lg"
            className="h-16 text-lg interactive-element group"
          >
            <CheckCircle className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            Vertrag akzeptieren
          </Button>

          <Button
            onClick={() => setDecision('reject')}
            variant="destructive"
            size="lg"
            className="h-16 text-lg interactive-element group"
          >
            <XCircle className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            Vertrag widerrufen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
