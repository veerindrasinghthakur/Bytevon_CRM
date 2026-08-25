import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas/auth'
import { resetPasswordApi } from '../api/auth'
import { authRoutes } from '../routes'
import { Button } from '@/shared/components/ui/Button'
import { BrandLogo } from '@/shared/components/brand/BrandLogo'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { safeNavigate } from '@/shared/lib/safeNavigate'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { token?: string }
  const token = search.token ?? ''
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError(null)
    if (!token) {
      setServerError('Missing reset token. Open the link from your email.')
      return
    }
    try {
      if (token === 'demo') {
        await new Promise((r) => setTimeout(r, 500))
        setDone(true)
        return
      }
      await resetPasswordApi(token, data)
      setDone(true)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Reset failed.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full px-6 md:px-10 py-4 flex items-center border-b border-outline-variant/40">
        <Link to={authRoutes.login}>
          <BrandLogo
            withWordmark
            sizeClassName="w-8 h-8"
            wordmarkClassName="text-on-background"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant p-10 rounded-xl shadow-sm">
          {done ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 flex items-center justify-center rounded-full">
                <span
                  className="material-symbols-outlined text-emerald-600 text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h1 className="text-headline-md text-on-background">Password updated</h1>
              <p className="text-body-md text-on-surface-variant">
                You can now sign in with your new password.
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => safeNavigate(navigate, { to: authRoutes.login })}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-electric-blue/10 flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-electric-blue text-[28px]">password</span>
                </div>
                <h1 className="text-headline-md text-on-background">Set a new password</h1>
                <p className="text-body-md text-on-surface-variant">
                  Choose a strong password for your account.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                {serverError && (
                  <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
                    {serverError}
                  </div>
                )}

                <div>
                  <label className="text-label-md text-on-surface-variant block mb-2" htmlFor="password">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full h-12 px-4 pr-12 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                      {...register('password')}
                      onKeyDown={(e) => handleEnterAdvance(e, 'confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 text-outline"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-label-sm text-error">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label
                    className="text-label-md text-on-surface-variant block mb-2"
                    htmlFor="confirmPassword"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    {...register('confirmPassword')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-label-sm text-error">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" variant="primary" className="w-full h-12" isLoading={isSubmitting}>
                  Update Password
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
