import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth'
import { forgotPasswordApi } from '../api/auth'
import { authRoutes } from '../routes'
import { Button } from '@/shared/components/ui/Button'
import { BrandLogo } from '@/shared/components/brand/BrandLogo'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError(null)
    try {
      await forgotPasswordApi(data)
      setSentTo(data.email)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Request failed.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full px-6 md:px-10 py-4 flex justify-between items-center border-b border-outline-variant/40">
        <Link to={authRoutes.login}>
          <BrandLogo
            withWordmark
            sizeClassName="w-8 h-8"
            wordmarkClassName="text-on-background"
          />
        </Link>
        <span className="text-label-md text-on-surface-variant">Support</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-surface-container-low">
        <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant p-10 rounded-xl shadow-sm">
          {!sentTo ? (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-electric-blue/10 flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-electric-blue text-[28px]">lock_reset</span>
                </div>
                <h1 className="text-headline-md text-on-background">Forgot Password?</h1>
                <p className="text-body-md text-on-surface-variant">
                  Enter your email to receive a reset link.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                {serverError && (
                  <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
                    {serverError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface-variant block" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    {...register('email')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                  />
                  {errors.email && (
                    <p className="text-label-sm text-error">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-3 pt-1">
                  <Button type="submit" variant="primary" className="w-full h-12" isLoading={isSubmitting}>
                    Send Reset Link
                  </Button>
                  <Link
                    to={authRoutes.login}
                    className="w-full h-12 flex items-center justify-center gap-2 text-on-surface-variant text-label-md hover:text-on-background border border-transparent hover:border-outline-variant rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-50 flex items-center justify-center rounded-full">
                <span
                  className="material-symbols-outlined text-emerald-600 text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-headline-md text-on-background">Check your email</h2>
                <p className="text-body-md text-on-surface-variant">
                  We've sent a password reset link to{' '}
                  <span className="font-bold text-on-background">{sentTo}</span>.
                </p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg text-left border border-outline-variant/30">
                <p className="text-label-sm text-on-surface-variant">
                  Didn't receive the email? Check spam, or open the browser console for the mock
                  reset token (dev only).
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={authRoutes.resetPassword}
                  search={{ token: 'demo' }}
                  className="text-secondary text-label-md font-medium hover:underline"
                >
                  Continue to reset form (dev)
                </Link>
                <button
                  type="button"
                  className="text-on-surface-variant text-label-md hover:underline"
                  onClick={() => {
                    setSentTo(null)
                    reset()
                  }}
                >
                  Try another email address
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-label-sm text-on-surface-variant">
        © {new Date().getFullYear()} Bytevon Systems
      </footer>
    </div>
  )
}
