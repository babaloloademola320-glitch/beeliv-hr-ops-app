/**
 * Staff app domain types (brief section 18). These describe the CONTRACT the UI
 * consumes; the eventual backend adapter must return these shapes. Nothing
 * here encodes an operational rule (lateness, entitlement, verification
 * method, approval chain...) - those come from the backend later.
 *
 * IDs: `id` is an opaque internal identifier supplied by the backend (never
 * generated in the browser). `staffId` / `publicId` are HUMAN-READABLE display
 * IDs (BLV-STF-00127, BLV-OUT-000004) - display only, never a key.
 */

/** ISO calendar date, "YYYY-MM-DD" (no timezone). */
export type ISODate = string;
/** 24h clock time, "HH:mm". */
export type ClockTime = string;
/** ISO 8601 date-time. */
export type ISODateTime = string;

export type AccountStatus =
  | "invitation-required"
  | "invitation-expired"
  | "onboarding"
  | "active"
  | "suspended"
  | "deactivated";

export interface StaffProfile {
  id: string;
  /** Human-readable, display only. */
  staffId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  /** Label shown under the name, e.g. "Assigned staff". Backend-authored. */
  roleLabel: string;
  accountStatus: AccountStatus;
}

/**
 * One Talent app, one auth session, one person: applicant and staff are
 * ENTITLEMENTS on the same identity (a transitioned user has both). The UI
 * only uses this to choose what to show - real protection is server-side
 * (RLS / route guards) and arrives with the backend.
 */
export interface Entitlements {
  applicant: boolean;
  staff: boolean;
  client?: boolean;
  hr?: boolean;
  ops?: boolean;
}

export type AssignmentStatus = "active" | "upcoming" | "paused" | "ended";

export interface Contact {
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
}

export interface StaffAssignment {
  id: string;
  status: AssignmentStatus;
  client: { id: string; name: string };
  outlet: { id: string; publicId: string; name: string; location: string; imageUrl: string | null };
  role: string;
  department: string;
  /** Free-form tags authored by Beeliv (e.g. "Full-time"). */
  tags: string[];
  supervisor: Contact | null;
  /** Beeliv / HR contact for this assignment. */
  beelivContact: Contact | null;
  startDate: ISODate;
  endDate: ISODate | null;
  /** Outlet/work context, free text authored by Beeliv. */
  context: string | null;
}

export type ShiftStatus = "scheduled" | "updated" | "cancelled" | "completed";

/** One line of a shift's agenda (briefing, break...). Authored by the backend, never inferred. */
export interface ShiftEvent {
  time: ClockTime;
  label: string;
  detail: string | null;
  kind: "start" | "break" | "task" | "end";
}

export interface Shift {
  id: string;
  date: ISODate;
  startTime: ClockTime;
  endTime: ClockTime;
  client: string;
  outlet: string;
  location: string;
  role: string;
  /** Section / department worked, e.g. "Front of house". */
  section: string;
  status: ShiftStatus;
  notes: string | null;
  agenda: ShiftEvent[];
}

/** State machine the backend reports for today's attendance (brief sections 5 and 8). */
export type AttendanceState = "no-shift" | "upcoming" | "ready" | "checked-in" | "checked-out" | "attention";

export interface TodayAttendance {
  state: AttendanceState;
  shift: Shift | null;
  checkedInAt: ISODateTime | null;
  checkedOutAt: ISODateTime | null;
  /** Backend-authored reason when state is "attention". */
  attentionReason: string | null;
}

export interface AttendanceRecord {
  id: string;
  date: ISODate;
  shiftId: string | null;
  checkedInAt: ISODateTime | null;
  checkedOutAt: ISODateTime | null;
  /** Neutral outcome only - no lateness/absence rules in the frontend. */
  status: "recorded" | "attention" | "no-shift";
}

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  /** Label from backend configuration (types are not hard-coded). */
  type: string;
  startDate: ISODate;
  endDate: ISODate;
  reason: string | null;
  status: LeaveStatus;
  submittedAt: ISODateTime;
  decisionNote: string | null;
  attachmentName: string | null;
  /** Backend decides whether cancelling is permitted. */
  canCancel: boolean;
}

export interface LeaveRequestInput {
  type: string;
  startDate: ISODate;
  endDate: ISODate;
  reason: string;
  attachment: File | null;
}

/** Only present when the backend supplies it - the frontend never computes entitlement. */
export interface LeaveSummary {
  remaining: number;
  used: number;
  unit: string;
}

export type DocumentGroup = "identity" | "employment" | "payroll" | "certificates" | "agreements" | "other";
export type DocumentStatus = "required" | "uploaded" | "under-review" | "verified" | "update-required" | "expired";

export interface StaffDocument {
  id: string;
  name: string;
  group: DocumentGroup;
  status: DocumentStatus;
  dueDate: ISODate | null;
  fileName: string | null;
  updatedAt: ISODateTime | null;
  /** Set when Beeliv asked for this document ("Respond to request"). */
  requestNote: string | null;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  description: string;
  version: string;
  department: string | null;
  requiresAcknowledgement: boolean;
  /** Ordered reading sections. Optional: when absent the UI shows `description` as a single section. */
  sections?: SOPSection[];
}

export interface SOPSection {
  id: string;
  title: string;
  body: string;
}

export type LearningStatus = "assigned" | "in-progress" | "completed";

export interface SOPAssignment {
  id: string;
  sop: SOP;
  assignedAt: ISODate;
  dueDate: ISODate | null;
  required: boolean;
  /** 0-100. */
  progress: number;
  status: LearningStatus;
  acknowledged: boolean;
  /** Saved reading position (0-based section index), so reopening resumes. Backend-supplied. */
  currentSection?: number;
  /** Indexes of sections already read. `progress` is derived from this by the backend. */
  completedSections?: number[];
  /** ISO date-time the SOP was completed, when it was. */
  completedAt?: ISODateTime | null;
}

export interface Training {
  id: string;
  title: string;
  type: "course" | "video" | "document" | "practical";
  category: string;
  description: string;
  durationMinutes: number | null;
}

export interface TrainingAssignment {
  id: string;
  training: Training;
  assignedAt: ISODate;
  dueDate: ISODate | null;
  required: boolean;
  progress: number;
  status: LearningStatus;
}

export interface StaffRecord {
  id: string;
  date: ISODate;
  /** Label authored by Beeliv; the frontend defines no stages or penalties. */
  type: string;
  status: "open" | "acknowledged" | "closed";
  summary: string;
  requiresAcknowledgement: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  source: "beeliv" | "outlet" | "workforce";
  publishedAt: ISODateTime;
  imageUrl: string | null;
}

export type NotificationEvent =
  | "shift-updated"
  | "sop-assigned"
  | "training-assigned"
  | "leave-updated"
  | "document-requested"
  | "assignment-changed"
  | "announcement";

/** Same event shape is intended to serve every Beeliv app (brief section 17). */
export interface Notification {
  id: string;
  event: NotificationEvent;
  title: string;
  message: string;
  destination: { href: string; label: string };
  read: boolean;
  createdAt: ISODateTime;
}

export interface Agreement {
  id: string;
  title: string;
  version: string;
  summary: string;
  required: boolean;
}

export interface AgreementAcceptance {
  agreementId: string;
  version: string;
  acceptedAt: ISODateTime;
}

export type RequiredActionKind = "document" | "document-request" | "sop" | "training" | "assignment-update" | "onboarding";

export interface RequiredAction {
  id: string;
  kind: RequiredActionKind;
  title: string;
  detail: string;
  dueDate: ISODate | null;
  href: string;
  actionLabel: string;
}

export interface OnboardingItem {
  id: string;
  kind: "agreement" | "profile" | "document";
  label: string;
  done: boolean;
  /** Present for kind "agreement". */
  agreement: Agreement | null;
  href: string | null;
}

export interface LearningItem {
  id: string;
  kind: "sop" | "training";
  title: string;
  progress: number;
  dueDate: ISODate | null;
  status: LearningStatus;
  href: string;
}

/** Pending-work counts for sidebar badges, keyed by nav href. Backend-supplied. */
export type NavCounts = Record<string, number>;

/** Everything Home needs in one round trip. */
export interface StaffHome {
  profile: StaffProfile;
  assignment: StaffAssignment | null;
  today: TodayAttendance;
  todaysShifts: Shift[];
  requiredActions: RequiredAction[];
  upcoming: Shift[];
  recentAttendance: AttendanceRecord[];
  leave: LeaveRequest[];
  leaveSummary: LeaveSummary | null;
  learning: LearningItem[];
  learningSummary: { completed: number; total: number } | null;
  announcements: Announcement[];
  /** Non-null while account status is "onboarding". */
  onboarding: OnboardingItem[] | null;
}

export type DateRange = { from: ISODate; to: ISODate };

export type LoadStatus = "loading" | "ready" | "empty" | "error";
export interface Loadable<T> {
  data: T | null;
  status: LoadStatus;
  retry: () => void;
}
