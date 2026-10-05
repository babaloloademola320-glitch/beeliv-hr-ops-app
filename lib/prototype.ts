/**
 * Prototype-only UI (state switchers, "simulate" buttons, flow-test notices)
 * is shown while developing and hidden in production builds, so real users
 * never see it. Flip here if a deployed preview needs the controls.
 */
export const SHOW_PROTOTYPE_CONTROLS: boolean = process.env.NODE_ENV !== "production";
