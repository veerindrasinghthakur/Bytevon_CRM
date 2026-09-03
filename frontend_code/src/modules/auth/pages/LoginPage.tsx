import { Link } from '@tanstack/react-router'
import { authRoutes } from '../routes'
import { Button } from '@/shared/components/ui/Button'
import { BrandLogo, BrandMark } from '@/shared/components/brand/BrandLogo'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { looseSearch } from '@/shared/lib/safeNavigate'
import { useLoginForm } from '../hooks/useLoginForm'
import { AUTH_COPYRIGHT_YEAR } from '../schemas/auth'

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    serverError,
    showPassword,
    toggleShowPassword,
    onSubmit,
    mockCredentials,
  } = useLoginForm()

  return (
    <main className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 max-w-[1440px] mx-auto">
      <section className="hidden md:flex flex-col justify-between p-10 bg-surface-container-low relative overflow-hidden">
        <div className="z-10">
          <BrandLogo
            withWordmark
            sizeClassName="w-10 h-10"
            wordmarkClassName="text-on-background"
          />
          <div className="mt-8 max-w-md">
            <h1 className="text-[48px] leading-[56px] font-bold tracking-tight text-on-background mb-4">
              Welcome to Bytevon
            </h1>
            <p className="text-body-lg text-on-surface-variant">
              Your all-in-one enterprise platform for seamless ERP and CRM management.
            </p>
          </div>
        </div>
        <div className="z-10 flex justify-center items-center py-8">
          <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-surface-container to-secondary/10 border border-outline-variant/40 flex items-center justify-center overflow-hidden">
            <BrandMark className="w-28 h-28" />
          </div>
        </div>
        <p className="z-10 text-label-sm text-on-surface-variant opacity-70">
          © {AUTH_COPYRIGHT_YEAR} Bytevon Enterprise. All rights reserved.
        </p>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full opacity-5" />
      </section>

      <section className="flex items-center justify-center p-4 md:p-10 bg-surface">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 flex justify-center">
            <BrandLogo
              withWordmark
              sizeClassName="w-9 h-9"
              wordmarkClassName="text-on-background"
            />
          </div>

          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-[0_10px_40px_-15px_rgba(11,28,48,0.1)] border border-outline-variant">
            <div className="mb-8">
              <h2 className="text-headline-lg text-on-background">Login to your account</h2>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Enter your credentials to access the dashboard
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              {serverError && (
                <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
                  {serverError}
                </div>
              )}

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </span>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="admin"
                    className="block w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('username')}
                    onKeyDown={(e) => handleEnterAdvance(e, 'password')}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-label-sm text-error">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-outline pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('password')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-background"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    {...register('rememberMe')}
                  />
                  <span className="text-label-md text-on-surface-variant">Remember Me</span>
                </label>
                <Link
                  to={authRoutes.forgotPassword}
                  search={looseSearch()}
                  className="text-label-md text-secondary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" variant="primary" className="w-full py-3" isLoading={isSubmitting}>
                Login to Dashboard
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-surface-container-low border border-outline-variant/50 px-4 py-3 text-center">
              <p className="text-label-sm text-on-surface-variant mb-1">Temporary test account</p>
              <p className="text-body-sm text-on-background">
                Username <span className="font-semibold">{mockCredentials.username}</span>
                {' · '}
                Password <span className="font-semibold">{mockCredentials.password}</span>
              </p>
            </div>
          </div>

          <nav className="mt-8 flex justify-center gap-6">
            <span className="text-label-sm text-on-surface-variant">Privacy Policy</span>
            <span className="text-label-sm text-on-surface-variant">Terms of Service</span>
            <span className="text-label-sm text-on-surface-variant">Help Center</span>
          </nav>
        </div>
      </section>
    </main>
  )
}
