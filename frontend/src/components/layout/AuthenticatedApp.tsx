import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';

export function AuthenticatedApp() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
