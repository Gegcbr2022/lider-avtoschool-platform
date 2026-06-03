export type UserRole = "admin" | "manager" | "instructor" | "student";

export type TrainingCategory = "A" | "A1" | "B" | "C" | "CE";

export type Branch = {
  id: string;
  city: string;
  address: string;
  phone: string;
  mapQuery: string;
  workingHours?: string;
  routeUrl?: string;
};

export type ServiceCard = {
  id: string;
  title: string;
  category: TrainingCategory;
  retraining: boolean;
  duration: string;
  priceFrom: number;
  minimumAge?: string;
  condition?: string;
  summary: string;
  outcomes: string[];
};

export type LeadStatus =
  | "new"
  | "contacted"
  | "consultation"
  | "documents_pending"
  | "enrolled"
  | "training"
  | "exam_ready"
  | "passed"
  | "lost"
  | "spam";

export type LeadSource =
  | "website"
  | "popup"
  | "telegram"
  | "referral"
  | "walk-in"
  | "mobile"
  | "ai-chat"
  | "admin"
  | "category-page"
  | "documents-page"
  | "contacts-page"
  | "branch_card"
  | "category_card"
  | "service_card"
  | "hero_cta"
  | "floating_phone"
  | "sticky_mobile"
  | "footer"
  | "cta_link"
  | "documents"
  | "about";

export type PreferredContactMethod = "telegram" | "phone" | "whatsapp" | "email" | "any";

export type LeadDocument = {
  name: string;
  type?: string;
  size?: number;
  url?: string;
  status?: "uploaded" | "pending_upload" | "verified" | "rejected";
};

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  source: LeadSource;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referralCode?: string;
  telegramStartParam?: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  branchId?: string;
  branch?: string;
  category: TrainingCategory;
  preferredContactMethod?: PreferredContactMethod;
  message?: string;
  status: LeadStatus;
  assignedTo?: string;
  notes?: string;
  documents?: LeadDocument[];
  consentAccepted?: boolean;
  language?: "uk" | "ru" | "en";
  page?: string;
  device?: string;
  ipHash?: string;
  userAgent?: string;
  manager: string;
  nextAction: string;
};

export type StudentStatus = "active" | "paused" | "completed" | "passed" | "lost";

export type ExamStatus = "not_ready" | "theory_ready" | "practice_ready" | "exam_ready" | "passed" | "failed";

export type Student = {
  id: string;
  leadId?: string;
  createdAt: string;
  updatedAt?: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  branchId?: string;
  branch?: string;
  category: TrainingCategory;
  status: StudentStatus;
  trainingStartDate?: string;
  trainingEndDate?: string;
  theoryProgress: number;
  practiceProgress: number;
  examStatus: ExamStatus;
  paymentStatus: PaymentStatus;
  referrerId?: string;
  referredBy?: string;
  discount?: number;
  documentsStatus: "missing" | "pending" | "verified" | "rejected";
  managerId?: string;
  instructorId?: string;
  notes?: string;
};

export type KpiSnapshot = {
  totalLeads: number;
  leadsBySource: Record<string, number>;
  leadToStudentConversion: number;
  studentToLicenseConversion: number;
  popularCategories: Record<TrainingCategory, number>;
  leadsByCity: Record<string, number>;
  telegramLeads: number;
  popupLeads: number;
  formLeads: number;
  referralLeads: number;
  averageLeadResponseHours?: number;
};

export type BookingSlot = {
  id: string;
  branchId: string;
  instructor: string;
  vehicle: string;
  startsAt: string;
  availableSeats: number;
};

export type PaymentProvider = "liqpay" | "fondy" | "monobank";

export type PaymentStatus = "pending" | "processing" | "paid" | "failed" | "refunded";

export type Payment = {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: "UAH";
  status: PaymentStatus;
  studentName: string;
  createdAt: string;
};

export type LessonProgress = {
  courseId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  testScore: number;
};
