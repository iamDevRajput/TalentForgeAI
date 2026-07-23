import { BrandLogo } from "@/shared/components/Brand";
/**
 * LoginPage.jsx — Authentication entry for all roles
 *
 * After login:
 *   - Stores user in Zustand (persisted to localStorage)
 *   - Redirects to role-specific dashboard or the originally requested page
 *
 * Design: Full-screen, gradient background, centered glass card
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Sparkles, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { authApi } from './authApi';
import { useAuthStore } from './authStore';
import { useToast } from '@/shared/components/Toast';

const ROLE_REDIRECT = {
  hr: '/hr/dashboard',
  interviewer: '/interviewer/dashboard',
  candidate: '/candidate/dashboard',
};

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const { data: { user } } = await authApi.login(data);
      setUser(user);

      const from = location.state?.from?.pathname;
      const redirect = from || ROLE_REDIRECT[user.role] || '/';
      navigate(redirect, { replace: true });

      toast({
        title: `Welcome back, ${user.name.split(' ')[0]}!`,
        variant: 'success',
      });
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.';
      toast({ title: 'Login failed', description: message, variant: 'error' });
    }
  };

  return (
    <div className="gradient-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid Background Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-[420px] space-y-8 page-enter relative z-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-6 hover:opacity-80 transition-opacity">
            <BrandLogo markSize="size-14" textSize="text-2xl" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-card/60 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <form
            id="login-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-[13px] font-semibold text-foreground/90"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] font-semibold text-foreground/90"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full rounded-xl border border-border/50 bg-background/50 pl-10 pr-10 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 transition-all hover:bg-background/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5"><ShieldCheck className="size-3" />{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-4 py-3 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:scale-[1.01] hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[14px] text-muted-foreground relative z-10">
          New candidate?{' '}
          <Link
            to="/auth/register"
            id="login-register-link"
            className="font-semibold text-primary transition-all hover:text-primary/80 hover:underline hover:underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
