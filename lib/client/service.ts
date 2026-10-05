/**
 * ClientAnalyticsService: the single door the hooks use (brief section 27).
 * It delegates to the active adapter and adds NO business rules (lateness,
 * coverage thresholds, compliance limits...) - those belong to the backend.
 *
 * To go live: change the one `adapter` line to the Supabase adapter.
 */
import type { ClientAnalyticsAdapter } from "./adapter";
import { mockClientAdapter } from "./adapters/mock";
import type { CandidateFeedbackInput, DateRange, ISODate, NewWorkforceRequest, OnboardingSave, OutletScope } from "./types";

const adapter: ClientAnalyticsAdapter = mockClientAdapter; // DEV FIXTURE until the backend adapter exists

export const subscribeClient: ClientAnalyticsAdapter["subscribe"] = (l) => adapter.subscribe(l);

export const getSession = () => adapter.getSession();

export const getOverview = (scope: OutletScope) => adapter.getOverview(scope);
export const getAttendanceSummary = (scope: OutletScope, date: ISODate) => adapter.getAttendanceSummary(scope, date);
export const getAttendanceTrend = (scope: OutletScope, range: DateRange) => adapter.getAttendanceTrend(scope, range);
export const getWorkforceDistribution = (scope: OutletScope) => adapter.getWorkforceDistribution(scope);
export const getScheduleCoverage = (scope: OutletScope, date: ISODate) => adapter.getScheduleCoverage(scope, date);
export const getWeekSchedule = (scope: OutletScope, weekOf: ISODate) => adapter.getWeekSchedule(scope, weekOf);
export const getRecruitmentSummary = (scope: OutletScope) => adapter.getRecruitmentSummary(scope);
export const getComplianceSummary = (scope: OutletScope) => adapter.getComplianceSummary(scope);
export const getPayrollVisibility = (scope: OutletScope) => adapter.getPayrollVisibility(scope);
export const getRecentActivity = (scope: OutletScope) => adapter.getRecentActivity(scope);
export const getNotifications = (scope: OutletScope) => adapter.getNotifications(scope);
export const markNotificationRead = (id: string) => adapter.markNotificationRead(id);
export const deleteNotification = (id: string) => adapter.deleteNotification(id);
export const markAllNotificationsRead = () => adapter.markAllNotificationsRead();

export const getWorkforce = (scope: OutletScope) => adapter.getWorkforce(scope);
export const getAttendanceRecords = (scope: OutletScope, range: DateRange) => adapter.getAttendanceRecords(scope, range);
export const getCandidates = (scope: OutletScope) => adapter.getCandidates(scope);
export const getWorkforceRequests = (scope: OutletScope) => adapter.getWorkforceRequests(scope);
export const getDocuments = (scope: OutletScope) => adapter.getDocuments(scope);

export const getCandidate = (scope: OutletScope, id: string) => adapter.getCandidate(scope, id);
export const submitCandidateFeedback = (scope: OutletScope, id: string, input: CandidateFeedbackInput) => adapter.submitCandidateFeedback(scope, id, input);
export const getWorkforceRequest = (scope: OutletScope, id: string) => adapter.getWorkforceRequest(scope, id);
export const createWorkforceRequest = (scope: OutletScope, input: NewWorkforceRequest) => adapter.createWorkforceRequest(scope, input);
export const getWorkforceRequestReasons = () => adapter.getWorkforceRequestReasons();
export const getWorkforceMemberDetail = (scope: OutletScope, memberId: string) => adapter.getWorkforceMemberDetail(scope, memberId);
export const getSchedule = (scope: OutletScope, range: DateRange) => adapter.getSchedule(scope, range);

export const getOnboarding = () => adapter.getOnboarding();
export const saveOnboarding = (input: OnboardingSave) => adapter.saveOnboarding(input);
