import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/slice/auth/auth-api'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setCredentials } from '@/slice/auth/auth-slice'
import logo from '@/assets/logo.png'
import illustration from '@/assets/login-illustration.png'

const schema = z.object({
  userId: z.string().min(1, 'Please enter your User ID'),
  password: z.string().min(1, 'Please enter your password'),
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const onSubmit = async (values: LoginForm) => {
    try {
      const { token, user } = await login(values).unwrap()
      dispatch(setCredentials({ token, user }))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Invalid credentials. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg p-3 sm:p-6">
      <div className="flex flex-1 overflow-hidden rounded-2xl bg-surface">
        <div className="hidden flex-1 items-center justify-center bg-[#f6fbff] lg:flex">
          <img
            src={illustration}
            alt=""
            className="max-h-[70%] w-auto object-contain"
          />
        </div>

        <div className="flex w-full items-center justify-center px-6 lg:w-[46%]">
          <div className="w-full max-w-sm">
            <img src={logo} alt="PrepRoute" className="mb-8 h-auto w-36" />

            <h1 className="text-xl font-semibold text-ink-strong">Login</h1>
            <p className="mt-1 text-sm text-ink-subtle">
              Use your company provided Login credentials
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="userId" className="text-ink-muted">
                  User ID
                </Label>
                <Input
                  id="userId"
                  autoComplete="username"
                  placeholder="Enter User ID"
                  className="h-11"
                  aria-invalid={!!errors.userId}
                  {...register('userId')}
                />
                {errors.userId && (
                  <p className="text-xs text-danger">{errors.userId.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-ink-muted">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter Password"
                  className="h-11"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <button type="button" className="text-sm font-medium text-primary-600 hover:underline">
                Forgot password?
              </button>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-primary-600 text-white hover:bg-primary-600/90"
              >
                {isLoading ? 'Signing in…' : 'Login'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
