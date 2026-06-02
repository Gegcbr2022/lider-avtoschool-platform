export type UserRole = "admin" | "manager" | "student";

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
  summary: string;
  outcomes: string[];
};

export type LeadStatus = "new" | "contacted" | "consultation" | "contract" | "paid" | "learning" | "completed";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  city: string;
  category: TrainingCategory;
  status: LeadStatus;
  source: "website" | "telegram" | "referral" | "walk-in" | "mobile";
  createdAt: string;
  manager: string;
  nextAction: string;
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
