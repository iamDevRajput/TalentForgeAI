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
import { Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
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
    <div className="gradient-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 page-enter">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to <span className="gradient-text">TalentForgeAI</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <form
            id="login-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full rounded-lg border border-input bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full rounded-lg border border-input bg-secondary/40 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          New candidate?{' '}
          <Link
            to="/auth/register"
            id="login-register-link"
            className="font-medium text-primary transition-opacity hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
