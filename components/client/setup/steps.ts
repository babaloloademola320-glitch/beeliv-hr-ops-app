/** Setup stepper labels (new-client onboarding). Order = index in the stepper. */
export const SETUP_STEPS = ["Welcome", "Your details", "Outlets & access", "Notifications", "Agreements", "All set"] as const;

export const SETUP_DESCRIPTIONS = [
  "A quick tour before you start. Setup takes a few minutes.",
  "Confirm who you are so your Beeliv team can reach you.",
  "See what your account can and can't see. Beeliv sets this for you.",
  "Choose what you'd like to be told about.",
  "Please read and acknowledge before you continue.",
  "Your Beeliv Client account is ready.",
] as const;

export const LAST_STEP = SETUP_STEPS.length - 1;

/** Which onboarding checklist item a step completes (steps 0 and 5 complete none). */
export const STEP_ITEM = { 1: "details", 2: "access", 3: "notifications", 4: "agreements" } as const;

export const SETUP_HREF = "/client/setup";
export const setupStepHref = (step: number) => `${SETUP_HREF}?step=${step}`;
