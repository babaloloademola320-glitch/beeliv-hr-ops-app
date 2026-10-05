"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/public/kit";
import { T, stagger } from "@/components/public/primitives";
import { login } from "@/lib/public-site/auth";
import { AUTH_ROUTES, LOGIN_COPY } from "@/lib/public-site/auth-content";
import { validateEmail, validateLoginPassword } from "@/lib/public-site/auth-rules";
import { PreloaderScreen } from "@/components/applicant/Preloader";
import { AuthBody, AuthFrame } from "./AuthFrame";
import { MailIcon } from "./AuthIcons";
import {
  AuthField,
  CheckField,
  FlowNotice,
  FormAlert,
  PasswordField,
  SubmitButton,
  useFieldRefs,
} from "./fields";
import { AuthFoot, AuthHeading } from "./parts";

type Field = "email" | "password";
const ORDER: readonly Field[] = ["email", "password"];

/**
 * `skeleton`: the route's loading frame (same layout, no motion; see loading.tsx).
 * `jobId`: set when login was reached from a job's "Apply Now" (/login?job=id);
 * the vacancy is preserved through authentication (login continues to that
 * job's apply flow, and "Sign up" keeps the job attached).
 */
export function LoginForm({
  skeleton = false,
  jobId = null,
}: {
  skeleton?: boolean;
  jobId?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>({});
  const [shake, setShake] = useState<Record<Field, number>>({ email: 0, password: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // Arrival preloader (covers the navigation into the dashboard).
  const [arriving, setArriving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { register, focusFirstInvalid } = useFieldRefs<Field>();

  const check: Record<Field, (v: string) => string | null> = {
    email: validateEmail,
    password: validateLoginPassword,
  };

  // Reward early, punish late: an error clears as soon as the value is valid,
  // and only appears on blur once there is something to judge (or after a submit).
  const onChange = (name: Field, value: string) => {
    if (name === "email") setEmail(value);
    else setPassword(value);
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check[name](value) }));
  };
  const onBlur = (name: Field, value: string) => {
    if (submitted || value) setErrors((e) => ({ ...e, [name]: check[name](value) }));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setSubmitted(true);
    setFailure(null);
    setNotice(null);

    const next = { email: check.email(email), password: check.password(password) };
    setErrors(next);
    if (next.email || next.password) {
      setShake((s) => ({
        email: next.email ? s.email + 1 : s.email,
        password: next.password ? s.password + 1 : s.password,
      }));
      focusFirstInvalid(ORDER, next);
      return;
    }

    setPending(true);
    setArriving(true);
    const res = await login({ email: email.trim(), password, remember });
    if (res.ok) {
      // No real Supabase auth is wired yet (project-lead direction,
      // 2026-09-28: login is a frontend-only pass-through for now - do not
      // gate /applicant/** on any session/auth check). Plain, unconditional
      // navigation into the dashboard once the form itself succeeds; stay in
      // the pending state while it opens. `from=login` tells the dashboard
      // which arrival preloader to show (it reads and strips the param).
      router.push(
        jobId
          ? `/applicant/apply?job=${encodeURIComponent(jobId)}&from=login`
          : "/applicant?from=login",
      );
      return;
    }
    setPending(false);
    setArriving(false);
    setFailure(res.message);
  }

  return (
    <>
    {arriving ? <PreloaderScreen kind={jobId ? "login-job" : "login"} vars={{}} /> : null}
    <AuthFrame screen="login" skeleton={skeleton}>
      <AuthBody onSubmit={onSubmit} ariaBusy={pending}>
        <AuthHeading
          lead={LOGIN_COPY.headLead}
          accent={LOGIN_COPY.headAccent}
          sub={LOGIN_COPY.sub}
        />

        <Reveal when="mount" y={16} delay={stagger(3, 0.1)}>
          <AuthField
            id="li-e"
            label={LOGIN_COPY.emailLabel}
            icon={<MailIcon />}
            type="email"
            name="email"
            placeholder={LOGIN_COPY.emailPlaceholder}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            error={errors.email}
            shakeKey={shake.email}
            ref={register("email")}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={(e) => onBlur("email", e.target.value)}
          />
        </Reveal>

        <Reveal when="mount" y={16} delay={stagger(4, 0.1)}>
          <PasswordField
            id="li-p"
            label={LOGIN_COPY.passwordLabel}
            name="password"
            placeholder={LOGIN_COPY.passwordPlaceholder}
            autoComplete="current-password"
            value={password}
            error={errors.password}
            shakeKey={shake.password}
            ref={register("password")}
            onChange={(e) => onChange("password", e.target.value)}
            onBlur={(e) => onBlur("password", e.target.value)}
          />
        </Reveal>

        <Reveal
          when="mount"
          y={16}
          delay={stagger(5, 0.1)}
          className="-mt-1 flex items-center justify-between"
        >
          <CheckField id="li-r" checked={remember} onChange={setRemember}>
            {LOGIN_COPY.remember}
          </CheckField>
          <Link href={AUTH_ROUTES.forgot} className="py-2.5 text-sm font-medium">
            <T>{LOGIN_COPY.forgot}</T>
          </Link>
        </Reveal>

        <Reveal when="mount" y={16} delay={stagger(6, 0.1)}>
          <SubmitButton
            label={LOGIN_COPY.submit}
            pendingLabel={LOGIN_COPY.submitting}
            pending={pending}
          />
        </Reveal>

        <FormAlert>{failure}</FormAlert>
        <FlowNotice>{notice}</FlowNotice>

        <AuthFoot
          lead={LOGIN_COPY.newPrompt}
          href={
            jobId
              ? `${AUTH_ROUTES.signup}?job=${encodeURIComponent(jobId)}`
              : AUTH_ROUTES.signup
          }
          label={LOGIN_COPY.newLink}
          delay={stagger(7, 0.1)}
        />
      </AuthBody>
    </AuthFrame>
    </>
  );
}
