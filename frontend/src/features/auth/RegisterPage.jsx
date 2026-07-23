/**
 * RegisterPage.jsx — Candidate self-registration
 *
 * Only candidates can self-register. HR/Interviewer accounts are created
 * by an HR user from their dashboard (Phase 2).
 *
 * Design mirrors LoginPage for visual consistency.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sparkles, Loader2, Mail, Lock, User, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { authApi } from './authApi';
import { useAuthStore } from './authStore';
import { useToast } from '@/shared/components/Toast';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must include uppercase, lowercase, and a number',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch('password', '');

  const onSubmit = async ({ name, email, password }) => {
    try {
      const { data: { user } } = await authApi.registerCandidate({ name, email, password });
      setUser(user);
      navigate('/candidate/dashboard', { replace: true });
      toast({
        title: `Welcome, ${name.split(' ')[0]}!`,
        description: 'Your account has been created successfully.',
        variant: 'success',
      });
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Registration failed. Please try again.';
      toast({ title: 'Registration failed', description: message, variant: 'error' });
    }
  };

  // Password strength calculation
  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z\d]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const getStrengthColor = (score) => {
    if (score === 0) return 'bg-muted';
    if (score <= 1) return 'bg-destructive';
    if (score === 2) return 'bg-warning';
    if (score === 3) return 'bg-primary';
    return 'bg-success';
  };

  const strengthScore = calculateStrength(passwordValue);

  return (
    <div className="gradient-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid Background Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-[420px] space-y-8 page-enter relative z-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_40px_hsl(var(--primary)/0.3)] ring-1 ring-white/10">
            <Sparkles className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Join <span className="gradient-text">TalentForgeAI</span>
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Create your candidate account to start applying
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-card/60 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <form
            id="register-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-[13px] font-semibold text-foreground/90">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  {...register('name')}
                  className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 transition-all hover:bg-background/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><ShieldCheck className="size-3" />{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-[13px] font-semibold text-foreground/90">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 transition-all hover:bg-background/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><ShieldCheck className="size-3" />{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="register-password" className="block text-[13px] font-semibold text-foreground/90">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-10 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 transition-all hover:bg-background/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  id="register-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-3 flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div 
                    key={level} 
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strengthScore >= level ? getStrengthColor(strengthScore) : 'bg-secondary'}`}
                  />
                ))}
              </div>

              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1.5"><ShieldCheck className="size-3" />{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="register-confirm-password" className="block text-[13px] font-semibold text-foreground/90">
                Confirm password
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 transition-all hover:bg-background/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><ShieldCheck className="size-3" />{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-4 py-3 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:scale-[1.01] hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[14px] text-muted-foreground relative z-10">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            id="register-login-link"
            className="font-semibold text-primary transition-all hover:text-primary/80 hover:underline hover:underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
