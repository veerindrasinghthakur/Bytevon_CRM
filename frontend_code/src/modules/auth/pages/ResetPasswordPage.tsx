import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BrandLogo } from '@/shared/components/brand/BrandLogo'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { authRoutes } from '../routes'
import { useResetPasswordForm } from '../hooks/useResetPasswordForm'

export function ResetPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    serverError,
    done,
    showPassword,
    toggleShowPassword,
    onSubmit,
    goToLogin,
  } = useResetPasswordForm()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full px-6 md:px-10 py-4 flex items-center border-b border-outline-variant/40">
        <Link {...({ to: authRoutes.login, params: {}, search: {} } as never)}>
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
              <div className="mx-auto w-16 h-16 bg-secondary/10 flex items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-secondary text-[32px]">check_circle</span>
              </div>
              <h1 className="text-headline-md text-on-background">Password updated</h1>
              <p className="text-body-md text-on-surface-variant">
                You can now sign in with your new password.
              </p>
              <Button variant="primary" className="w-full" onClick={goToLogin}>
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">password</span>
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
                      className="w-full h-12 px-4 pr-12 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
                      {...register('password')}
                      onKeyDown={(e) => handleEnterAdvance(e, 'confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 text-outline"
                      onClick={toggleShowPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
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
