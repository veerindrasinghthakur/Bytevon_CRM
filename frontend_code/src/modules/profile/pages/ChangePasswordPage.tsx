import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/modules/auth/schemas/auth'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { useChangePassword } from '../hooks/use-profile'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const changeMut = useChangePassword()
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
      revokeAllSessions: false,
    },
  })

  const onSubmit = async (data: ChangePasswordInput) => {
    setServerError(null)
    try {
      await changeMut.mutateAsync(data)
      setDone(true)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Password change failed.')
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <BackButton to="/profile" label="Back to profile" />
      <PageHeader
        title="Change password"
        description="Update your account password. Optionally revoke all other sessions."
      />

      <div className="bv-surface p-6 md:p-8">
        {done ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-50 flex items-center justify-center rounded-full">
              <span
                className="material-symbols-outlined text-emerald-600 text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h2 className="text-title-lg font-semibold">Password updated</h2>
            <p className="text-body-sm text-on-surface-variant">
              Your password has been changed successfully.
            </p>
            <Button variant="primary" onClick={() => navigate({ to: '/profile' })}>
              Back to profile
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && (
              <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
                {serverError}
              </div>
            )}

            <div>
              <label className="text-label-md text-on-surface-variant block mb-2" htmlFor="currentPassword">
                Current password
              </label>
              <input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                {...register('currentPassword')}
                onKeyDown={(e) => handleEnterAdvance(e, 'password')}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-label-sm text-error">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="text-label-md text-on-surface-variant block mb-2" htmlFor="password">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-11 px-4 pr-12 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
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
              <label className="text-label-md text-on-surface-variant block mb-2" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="w-full h-11 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                {...register('confirmPassword')}
                onKeyDown={(e) => handleEnterAdvance(e)}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-label-sm text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 rounded border-outline-variant text-secondary" {...register('revokeAllSessions')} />
              <span>
                <span className="text-body-md font-medium block">Revoke all other sessions</span>
                <span className="text-body-sm text-on-surface-variant">
                  Sign out every device except this one after the password change.
                </span>
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/profile' })}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting || changeMut.isPending}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
