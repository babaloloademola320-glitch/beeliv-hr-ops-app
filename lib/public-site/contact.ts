/**
 * Contact form data layer: THE ONLY place the Contact page talks to a backend.
 *
 * STATUS: BACKEND NOT CONNECTED. Nothing is stored, sent or emailed yet (no
 * Supabase client, tables or Resend wiring exist; see CLAUDE.md and
 * lib/public-site/request.ts, which this mirrors). submitContact() resolves a
 * clearly-labelled "backend not connected yet" result after a short simulated
 * delay, so the whole flow (validate -> send -> confirmation) can be tested.
 *
 * TO CONNECT THE BACKEND LATER (one place, the screen does not change):
 *   1. Flip CONTACT_BACKEND_CONNECTED to true.
 *   2. Replace the body of submitContact() (`SWAP POINT`) with the real send
 *      (store the enquiry + notify Beeliv, e.g. via Resend).
 *
 * SECURITY / PRIVACY:
 *   - Nothing here logs, stores or echoes the input.
 *   - This form NEVER creates an account or signs anyone in.
 *   - Client-side rules in contact-rules.ts are UX only; the backend must
 *     re-validate every field, cap lengths, and add spam protection (rate
 *     limit / honeypot / captcha) before this goes live - it receives free
 *     text from the public.
 *   - The CV file is not uploaded anywhere (no storage wired yet); only its
 *     presence/name is tracked for the UI.
 */

export type ContactInput = {
  kind: "work" | "other";
  name: string;
  email: string;
  phone: string;
  role: string | null;
  message: string;
  /** True when a CV file was attached. The file itself is not sent (no storage yet). */
  hasCv: boolean;
};

export type ContactOk = {
  ok: true;
  backendConnected: boolean;
  notice: string;
};

export type ContactFailure = {
  ok: false;
  message: string;
};

export type ContactResult = ContactOk | ContactFailure;

export const CONTACT_BACKEND_CONNECTED: boolean = false;

export const CONTACT_NOT_CONNECTED =
  "Backend not connected yet. This message was not sent to Beeliv. This is a flow test only.";

const SIMULATED_LATENCY_MS = 900;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitContact(input: ContactInput): Promise<ContactResult> {
  void input;
  // SWAP POINT: store the enquiry + send the Resend notification here.
  await wait(SIMULATED_LATENCY_MS);
  return {
    ok: true,
    backendConnected: false,
    notice: CONTACT_NOT_CONNECTED,
  };
}
