import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CreateTestPage from '@/pages/CreateTestPage'
import EditTestPage from '@/pages/EditTestPage'
import ComingSoonPage from '@/pages/ComingSoonPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tests/new" element={<CreateTestPage />} />
            <Route path="/tests/:id/edit" element={<EditTestPage />} />
            <Route
              path="/tests/:id/questions"
              element={<ComingSoonPage title="Add Questions" />}
            />
            <Route
              path="/tests/:id"
              element={<ComingSoonPage title="View Test" />}
            />
            <Route
              path="/test-tracking"
              element={<ComingSoonPage title="Test Tracking" />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
