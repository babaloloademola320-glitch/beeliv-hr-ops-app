/**
 * Request Talent data layer: THE ONLY place the "what do you need" form talks
 * to a backend.
 *
 * STATUS: BACKEND NOT CONNECTED. Nothing is stored, sent or emailed yet (no
 * Supabase client, tables or Resend wiring exist; see CLAUDE.md). submitRequest()
 * resolves a clearly-labelled "backend not connected yet" result after a short
 * simulated delay so the whole flow (validation -> sending -> "Request
 * received") can be tested end to end. The received screen shows a visible
 * flow-test note for as long as REQUEST_BACKEND_CONNECTED is false.
 *
 * TO CONNECT THE BACKEND LATER (one place, the screens do not change):
 *   1. Flip REQUEST_BACKEND_CONNECTED to true.
 *   2. Replace the body of submitRequest() (`SWAP POINT`) with the real insert
 *      (the wireframe note: "Creates a 'New lead' in the Beeliv management app,
 *      built later") plus the Resend notification, and map the outcome onto
 *      RequestResult. Return the human reference (e.g. BLV-0231) as `reference`
 *      so the received screen shows it instead of the bracketed placeholder.
 *
 * SECURITY / PRIVACY:
 *   - Nothing here logs, stores or echoes the input (no console, no storage).
 *   - This request NEVER creates an account or signs anyone in. Business
 *     (client) accounts are provisioned by Beeliv (rbac.md section 0), not by
 *     this form.
 *   - The client-side rules in request-rules.ts are UX only. The backend must
 *     re-validate every field, cap lengths, and add spam protection (rate limit
 *     / honeypot / captcha) before this goes live. It receives free text from
 *     the public, so treat it as untrusted input.
 */

export type NeedId = "recruitment" | "training" | "systems" | "audit" | "unsure";

/** The payload the backend receives: trimmed, typed, only for the selected needs. */
export type RequestInput = {
  business: {
    name: string;
    outlet: string | null;
    location: string;
  };
  needs: NeedId[];
  /** Present only when "Build my team" is selected. */
  recruitment: {
    roles: string;
    headcount: number;
    location: string;
    /** ISO date (yyyy-mm-dd), or null when left blank. */
    targetStartDate: string | null;
  } | null;
  /** Present only when "Train my team" is selected. */
  training: {
    teamSize: number;
    topics: string;
  } | null;
  /** Free text for the needs with no drawn field list (systems / audit / not sure). */
  details: string | null;
  contact: {
    name: string;
    jobTitle: string | null;
    email: string;
    phone: string;
    bestTimeToCall: string | null;
  };
};

export type RequestOk = {
  ok: true;
  /** Always false until the real backend is connected. */
  backendConnected: boolean;
  /** Human reference for the received screen (e.g. "BLV-0231"); null until real. */
  reference: string | null;
  /** Human-readable note for the flow-test banner. */
  notice: string;
};

export type RequestFailure = {
  ok: false;
  code: "network" | "rate-limited" | "unknown";
  message: string;
};

export type RequestResult = RequestOk | RequestFailure;

/** Single switch for "is a real backend behind submitRequest()". */
export const REQUEST_BACKEND_CONNECTED: boolean = false;

export const REQUEST_NOT_CONNECTED =
  "Backend not connected yet. This request was not sent to Beeliv. This is a flow test only.";

const SIMULATED_LATENCY_MS = 900;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitRequest(input: RequestInput): Promise<RequestResult> {
  void input;
  // SWAP POINT: insert the lead + send the Resend notification here.
  await wait(SIMULATED_LATENCY_MS);
  return {
    ok: true,
    backendConnected: false,
    reference: null,
    notice: REQUEST_NOT_CONNECTED,
  };
}
