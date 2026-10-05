"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/public/kit";
import { stagger } from "@/components/public/primitives";
import { requestPasswordReset } from "@/lib/public-site/auth";
import { AUTH_ROUTES, FORGOT_COPY } from "@/lib/public-site/auth-content";
import { normaliseEmail, validateEmail } from "@/lib/public-site/auth-rules";
import { AuthBody, AuthFrame } from "./AuthFrame";
import { KeyIcon, MailIcon } from "./AuthIcons";
import { AuthField, FormAlert, SubmitButton, useFieldRefs } from "./fields";
import { AuthFoot, AuthHeading, IconTile } from "./parts";

/** `skeleton`: the route's loading frame (same layout, no motion; see loading.tsx). */
export function ForgotForm({ skeleton = false }: { skeleton?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { register, focusFirstInvalid } = useFieldRefs<"email">();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setSubmitted(true);
    setFailure(null);

    const problem = validateEmail(email);
    setError(problem);
    if (problem) {
      setShake((n) => n + 1);
      focusFirstInvalid(["email"], { email: problem });
      return;
    }

    setPending(true);
    const clean = normaliseEmail(email);
    const res = await requestPasswordReset({ email: clean });
    if (res.ok) {
      // Stay in the loading state while the next screen opens. The address is
      // carried in the URL so /forgot-password/sent can show it.
      router.push(`${AUTH_ROUTES.sent}?email=${encodeURIComponent(clean)}`);
      return;
    }
    setPending(false);
    setFailure(res.message);
  }

  return (
    <AuthFrame screen="forgot" skeleton={skeleton}>
      <AuthBody logo={false} onSubmit={onSubmit} ariaBusy={pending}>
        <IconTile>
          <KeyIcon />
        </IconTile>
        <AuthHeading
          lead={FORGOT_COPY.headLead}
          accent={FORGOT_COPY.headAccent}
          sub={FORGOT_COPY.sub}
          delay={0.22}
        />

        <Reveal when="mount" y={16} delay={stagger(4, 0.1)}>
          <AuthField
            id="fp-e"
            label={FORGOT_COPY.emailLabel}
            icon={<MailIcon />}
            type="email"
            name="email"
            placeholder={FORGOT_COPY.emailPlaceholder}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            error={error}
            shakeKey={shake}
            ref={register("email")}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(validateEmail(e.target.value));
            }}
            onBlur={(e) => {
              if (submitted || e.target.value) setError(validateEmail(e.target.value));
            }}
          />
        </Reveal>

        <Reveal when="mount" y={16} delay={stagger(5, 0.1)}>
          <SubmitButton
            label={FORGOT_COPY.submit}
            pendingLabel={FORGOT_COPY.submitting}
            pending={pending}
          />
        </Reveal>

        <FormAlert>{failure}</FormAlert>

        <AuthFoot
          lead={FORGOT_COPY.rememberedPrompt}
          href={AUTH_ROUTES.login}
          label={FORGOT_COPY.rememberedLink}
          delay={stagger(6, 0.1)}
        />
      </AuthBody>
    </AuthFrame>
  );
}
