import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthenticatedApp } from './components/layout/AuthenticatedApp';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { UploadPage } from './pages/UploadPage';
import { SavedDashboardsPage } from './pages/SavedDashboardsPage';
import { InsightsPage } from './pages/InsightsPage';
import { InventoryPage } from './pages/InventoryPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import SimpleLayoutDemo from './pages/SimpleLayoutDemo';
import { AccountsPage } from './pages/admin/AccountsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/simple" element={<SimpleLayoutDemo />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AuthenticatedApp />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="datasets/:datasetId" element={<DatasetDetailPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="inventory" element={<InventoryPage />} />

          <Route path="upload" element={<UploadPage />} />
          <Route path="saved" element={<SavedDashboardsPage />} />
          <Route element={<ProtectedRoute allowedRoles="superadmin" />}>
            <Route path="admin/accounts" element={<AccountsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app/overview" replace />} />
    </Routes>
  );
}
