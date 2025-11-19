import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { UploadPage } from './pages/UploadPage';
import { SavedDashboardsPage } from './pages/SavedDashboardsPage';
import { InsightsPage } from './pages/InsightsPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import SimpleLayoutDemo from './pages/SimpleLayoutDemo';

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Demo route to preview the simple layout you provided */}
      <Route path="/simple" element={<SimpleLayoutDemo />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="datasets/:datasetId" element={<DatasetDetailPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="saved" element={<SavedDashboardsPage />} />
          <Route path="insights" element={<InsightsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app/overview" replace />} />
    </Routes>
  );
}
