export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  preview?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  duration?: number;
  language?: string;
  quality?: 'high' | 'medium' | 'low';
  format?: string;
}

export interface CaseFormData {
  customer: {
    name: string;
    age: number;
    location: string;
    phone?: string;
  };
  seller: {
    name: string;
    agencyId: string;
    campaign: string;
  };
  product: {
    industry: string;
    category: string;
    value: number;
    duration: number;
  };
  consent: {
    recording: boolean;
    dataProcessing: boolean;
    demonstration: boolean;
  };
}

export interface UploadContext {
  files: UploadFile[];
  formData: Partial<CaseFormData>;
  currentStep: number;
  isUploading: boolean;
  riskScore?: number;
}

export type Industry = 'telecommunications' | 'energy' | 'insurance' | 'finance' | 'healthcare';

export interface IndustryConfig {
  name: string;
  icon: string;
  categories: string[];
  complianceChecks: string[];
}
