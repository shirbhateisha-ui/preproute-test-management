import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink-strong">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-muted">Dashboard page placeholder</p>
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
