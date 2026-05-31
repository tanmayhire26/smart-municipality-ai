export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CITIZEN' | 'NAGARSEVAK' | 'CHIEF_OFFICER' | 'WORKER' | 'COLLECTOR';
  wardNumber?: number;
  phone?: string;
  address?: string;
  rating?: number;
  voterId?: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude?: number;
  longitude?: number;
  status: string;
  citizenId: string;
  citizenName: string;
  wardNumber: number;
  unitNumber?: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  coId?: string;
  eta?: string;
  aiConfidence?: number;
  aiSeverity?: string;
  aiSummary?: string;
  aiSuggestedAction?: string;
  nagarsevakId?: string;
  nagarsevakName?: string;
  nagarsevakRating?: number;
  photos?: string[];
  videos?: string[];
  documents?: {
    type: string;
    url: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  complaintId: string;
  status: string;
  actionTaken: string;
  performedBy: string;
  performedByName: string;
  notes?: string;
  photos?: string[];
  documents?: any[];
  createdAt: string;
}

export interface Ward {
  id: number;
  name: string;
  nagarsevakName?: string;
  population?: number;
  description?: string;
}

export interface Metrics {
  total: number;
  active: number;
  resolved: number;
  escalated: number;
}

export interface BackendStatuses {
  user: string;
  complaint: string;
  upload: string;
}
