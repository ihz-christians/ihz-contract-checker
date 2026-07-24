import { RiskSeverity, FindingType } from './case';
import { LearningModuleCategory } from './learning';

export type AIConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export type ExplanationType =
  | 'pattern_recognition'
  | 'keyword_analysis'
  | 'sentiment_shift'
  | 'context_violation'
  | 'regulatory_breach'
  | 'customer_protection'
  | 'compliance_check';

export interface AIReasoning {
  confidence: AIConfidenceLevel;
  confidenceScore: number; // 0-100
  methodology: ExplanationType;
  evidencePoints: string[];
  contextFactors: string[];
  alternativeInterpretations?: string[];
  falsePositiveRisk: number; // 0-100
}

export interface ConversationContext {
  segmentId: string;
  precedingContext: string[];
  followingContext: string[];
  emotionalState: string;
  conversationPhase: 'opening' | 'discovery' | 'presentation' | 'objection' | 'closing';
  customerSignals: string[];
  salespersonTactics: string[];
}

export interface ImprovementSuggestion {
  id: string;
  category: LearningModuleCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  currentPhrase: string;
  suggestedPhrase: string;
  explanation: string;
  relatedLearningModules: string[];
  estimatedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExplainabilityData {
  findingId: string;
  aiReasoning: AIReasoning;
  conversationContext: ConversationContext;
  improvementSuggestions: ImprovementSuggestion[];
  relatedCases: string[];
  complianceExplanation: string;
  customerImpactAnalysis: string;
  managerInsights: string[];
  regulatorNotes: string[];
}

export interface FeedbackData {
  userId: string;
  findingId: string;
  explanationHelpful: boolean;
  suggestionsRelevant: boolean;
  confidenceInAnalysis: number; // 1-5
  additionalComments?: string;
  timestamp: string;
}
