export type CaseStatus =
  | 'draft'
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'action_required'
  | 'archived';

export type ProcessingStage = 'asr' | 'diarization' | 'emotion' | 'sentiment' | 'fact_check';

export type FindingType = 'risk' | 'sentiment' | 'emotion' | 'factCheck' | 'warning';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IndustryType = 'telecommunications' | 'energy' | 'insurance';

export type ProductCategory =
  | 'mobile_contracts'
  | 'internet_broadband'
  | 'landline'
  | 'electricity'
  | 'gas'
  | 'green_energy'
  | 'life_insurance'
  | 'car_insurance'
  | 'property_insurance'
  | 'health_insurance';

export type ComplianceFramework =
  | 'TMG_TKG' // Telecommunications: Telekommunikationsgesetz/Telemediengesetz
  | 'EnWG' // Energy: Energiewirtschaftsgesetz
  | 'VVG_IDD' // Insurance: Versicherungsvertragsgesetz/Insurance Distribution Directive
  | 'UWG' // Universal: Gesetz gegen unlauteren Wettbewerb
  | 'GDPR'; // Universal: Datenschutz-Grundverordnung

export type Door2DoorIncidentType =
  | 'unauthorized_switch' // Unerlaubter Anbieterwechsel
  | 'misleading_pricing' // Irreführende Preisangaben
  | 'cold_calling' // Unerlaubte Kaltakquise
  | 'fake_utility_worker' // Täuschung als Stadtwerke-Mitarbeiter
  | 'pressure_tactics' // Hochdruck-Verkaufstaktiken
  | 'contract_manipulation' // Vertragsmanipulation
  | 'identity_theft' // Identitätsmissbrauch
  | 'cancellation_blocking'; // Widerrufsrecht-Verhinderung

export interface Case {
  id: string;
  customerId: string;
  customerName: string;
  agencyId: string;
  salespersonId: string;
  salespersonName: string;
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  riskScore: number;
  riskLevel: RiskSeverity;
  labels: string[];
  processingStages: Record<ProcessingStage, boolean>;
  hasAudio: boolean;
  hasContract: boolean;
  language: string;
  campaign?: string;
  product?: string;
  // Door2Door specific fields
  industry: IndustryType;
  productCategory: ProductCategory;
  complianceFramework: ComplianceFramework[];
  isDoor2Door: boolean;
  salesChannel: 'door_to_door' | 'phone' | 'online' | 'office';
  customerAge?: number;
  contractValue?: number;
  salesLocation?: string;
}

export interface Finding {
  id: string;
  type: FindingType;
  severity: number;
  riskLevel: RiskSeverity;
  span: {
    start: number;
    end: number;
  };
  speaker: string;
  text: string;
  evidence: string;
  recommendation: string;
  timestamp: string;
  // Enhanced explainability fields
  aiReasoning?: {
    confidence: number;
    methodology: string;
    evidencePoints: string[];
  };
  relatedLearningModules?: string[];
  improvementSuggestions?: string[];
  explainabilityId?: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker: string;
  confidence: number;
  findings: Finding[];
}

export interface Transcript {
  caseId: string;
  language: string;
  duration: number;
  segments: TranscriptSegment[];
}

export interface ConsentInfo {
  type: 'verbal' | 'written' | 'other';
  capturedAt: string;
  verified: boolean;
  evidence?: string;
}

export interface CaseDetail extends Case {
  consent: ConsentInfo;
  transcript?: Transcript;
  findings: Finding[];
  artifacts: {
    audioUrl?: string;
    contractUrl?: string;
    transcriptUrl?: string;
  };
}
