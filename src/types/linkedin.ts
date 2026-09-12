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
