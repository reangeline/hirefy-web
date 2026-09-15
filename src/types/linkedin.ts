// Espelha domain.LinkedInScan do backend (spec 015).

export interface LinkedInScanCheck {
  label: string;
  passed: boolean;
  explanation: string;
}

export interface LinkedInScanSection {
  name: string;
  checks: LinkedInScanCheck[];
}

export interface LinkedInScan {
  id: string;
  user_id: string;
  score: number;
  sections: LinkedInScanSection[];
  predicted_skills: string[];
  tips: string[];
  created_at: string;
  updated_at: string;
}

// Guia de preenchimento (spec 017) — gerado a partir de POST /resumes/linkedin/optimize,
// persistido como OptimizedResume com parsed_data.type = "linkedin" no backend.
export interface LinkedInProfileExperience {
  role: string;
  company: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string[];
}

export interface LinkedInProfileLanguage {
  name: string;
  level: string;
}

export interface LinkedInOptimizedProfile {
  id: string;
  headline: string;
  about: string;
  experiences: LinkedInProfileExperience[];
  skills: string[];
  languages: LinkedInProfileLanguage[];
  suggestions: string[];
  profile_strength_score: number;
}
