export type Section =
  | "Dashboard"
  | "Schedule"
  | "QR Scanner"
  | "Applications"
  | "Participants"
  | "Check-in"
  | "Teams"
  | "Tracks"
  | "Judging"
  | "Meals"
  | "Workshops"
  | "Referrals"
  | "Points";

export type Role = "Hacker" | "Judge" | "Mentor";
export type Status = "Draft" | "Pending" | "Accepted" | "Rejected" | "Waitlist";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  checkedIn: boolean;
  teamId: string | null;
  admin?: boolean;
  points: number;
  qr: string;
};

export type Team = {
  id: string;
  name: string;
  memberIds: string[];
  trackIds: string[];
};

export type Track = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type Attendance = {
  id: string;
  name: string;
  start: string;
  end: string;
  attendeeIds: string[];
  description?: string;
  room?: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  submitted: string;
  school?: string;
  grade?: string;
  city?: string;
  year?: string;
  experience?: string;
  question?: string;
  company?: string;
  specialty?: string;
  motivation?: string;
};

export type Transaction = {
  id: string;
  userId: string;
  type: "workshop" | "referral" | "admin";
  amount: number;
  date: string;
  reference: string;
  adminName?: string;
};

export type Score = {
  id: string;
  judgeId: string;
  teamId: string;
  trackId: string;
  score: number;
  comments: string;
};

export type Referral = {
  referrerId: string;
  referredId: string;
  date: string;
  points: number;
};

export type CustomEvent = {
  id: string;
  name: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
};
