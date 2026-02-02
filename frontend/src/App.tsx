import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthenticatedApp } from './components/layout/AuthenticatedApp';
import { OverviewPage } from './pages/OverviewPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { UploadPage } from './pages/UploadPage';
import { SavedDashboardsPage } from './pages/SavedDashboardsPage';
import { InsightsPage } from './pages/InsightsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { IssuesPage } from './pages/IssuesPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { ManualDatasetPage } from './pages/ManualDatasetPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import SimpleLayoutDemo from './pages/SimpleLayoutDemo';
import { AccountsPage } from './pages/admin/AccountsPage';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SuperadminDashboardPage } from './pages/admin/SuperadminDashboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/simple" element={<SimpleLayoutDemo />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AuthenticatedApp />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} redirectTo="/app/admin/dashboard" />}>
            <Route path="overview" element={<OverviewPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="datasets/:datasetId" element={<DatasetDetailPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="manual-dataset" element={<ManualDatasetPage />} />
            <Route path="saved" element={<SavedDashboardsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles="superadmin" redirectTo="/app/admin/dashboard" />}>
            <Route path="admin/dashboard" element={<SuperadminDashboardPage />} />
            <Route path="admin/accounts" element={<AccountsPage />} />
            <Route path="admin/organizations" element={<OrganizationsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app/overview" replace />} />
    </Routes>
  );
}
