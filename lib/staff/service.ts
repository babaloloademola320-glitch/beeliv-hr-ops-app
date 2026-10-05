/**
 * Staff domain service: the single door the hooks and UI actions use. It
 * delegates to the active adapter and adds NO business rules (lateness,
 * entitlement, approval...) - those belong to the backend.
 *
 * To go live: change the one `adapter` line to the Supabase adapter.
 */
import type { StaffAdapter } from "./adapter";
import { mockStaffAdapter } from "./adapters/mock";
import type { DateRange, LeaveRequestInput } from "./types";

const adapter: StaffAdapter = mockStaffAdapter; // DEV FIXTURE until the backend adapter exists

export const subscribeStaff: StaffAdapter["subscribe"] = (l) => adapter.subscribe(l);

// Reads
export const getStaffHome = () => adapter.getStaffHome();
export const getEntitlements = () => adapter.getEntitlements();
export const getStaffProfile = () => adapter.getStaffProfile();
export const getNavCounts = () => adapter.getNavCounts();
export const getCurrentAssignment = () => adapter.getCurrentAssignment();
export const getAssignmentHistory = () => adapter.getAssignmentHistory();
export const getSchedule = (range: DateRange) => adapter.getSchedule(range);
export const getTodayAttendance = () => adapter.getTodayAttendance();
export const getAttendanceHistory = () => adapter.getAttendanceHistory();
export const getLeaveRequests = () => adapter.getLeaveRequests();
export const getStaffDocuments = () => adapter.getStaffDocuments();
export const getSOPs = () => adapter.getSOPs();
export const getTraining = () => adapter.getTraining();
export const getStaffRecords = () => adapter.getStaffRecords();
export const getAnnouncements = () => adapter.getAnnouncements();
export const getNotifications = () => adapter.getNotifications();

// Actions
export const checkIn = () => adapter.checkIn();
export const checkOut = () => adapter.checkOut();
export const requestLeave = (input: LeaveRequestInput) => adapter.requestLeave(input);
export const cancelLeaveRequest = (id: string) => adapter.cancelLeaveRequest(id);
export const uploadStaffDocument = (documentId: string, file: File) => adapter.uploadStaffDocument(documentId, file);
export const replaceStaffDocument = (documentId: string, file: File) => adapter.replaceStaffDocument(documentId, file);
export const acknowledgeAgreement = (agreementId: string) => adapter.acknowledgeAgreement(agreementId);
export const startTraining = (assignmentId: string) => adapter.startTraining(assignmentId);
export const completeTraining = (assignmentId: string) => adapter.completeTraining(assignmentId);
export const acknowledgeSOP = (assignmentId: string) => adapter.acknowledgeSOP(assignmentId);
export const completeSOP = (assignmentId: string) => adapter.completeSOP(assignmentId);
export const saveSOPProgress = (assignmentId: string, sectionIndex: number) => adapter.saveSOPProgress(assignmentId, sectionIndex);
export const markNotificationRead = (id: string) => adapter.markNotificationRead(id);
export const deleteNotification = (id: string) => adapter.deleteNotification(id);
export const acknowledgeStaffRecord = (id: string) => adapter.acknowledgeStaffRecord(id);
export const updateStaffContact = (patch: { preferredName: string | null; phone: string | null }) => adapter.updateStaffContact(patch);
