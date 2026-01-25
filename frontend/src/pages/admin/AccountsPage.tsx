import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCcw, UserPlus, Trash2, Users, Crown, Lock } from 'lucide-react';
import { adminUsersAPI, type ManagedUser } from '../../lib/services';
import { useAuth, type Role } from '../../context/AuthContext';
import './AccountsPage.css';

const ROLE_LABEL: Record<Role, string> = {
  user: 'Usuario',
  admin: 'Administrador',
  superadmin: 'Superadmin',
};

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'user', label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
  { value: 'superadmin', label: 'Superadmin' },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await adminUsersAPI.list();
      setAccounts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos recuperar los usuarios.';
      setError(message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const sortedAccounts = useMemo(
    () => accounts.slice().sort((a, b) => a.name.localeCompare(b.name, 'es-ES')),
    [accounts],
  );

  const summary = useMemo(() => {
    const total = accounts.length;
    const admins = accounts.filter((account) => account.role === 'admin').length;
    const superadmins = accounts.filter((account) => account.role === 'superadmin').length;
    const standardUsers = Math.max(total - admins - superadmins, 0);

    return {
      total,
      admins,
      superadmins,
      standardUsers,
    };
  }, [accounts]);

  const handleRoleChange = useCallback(async (accountId: string, role: Role) => {
    setProcessingId(accountId);
    setFeedback(null);
    try {
      const updated = await adminUsersAPI.update(accountId, { role });
      setAccounts((prev) => prev.map((account) => (account.id === accountId ? updated : account)));
      setFeedback({ type: 'success', message: 'Rol actualizado correctamente.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos actualizar el rol.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  }, []);

  const handleDelete = useCallback(async (account: ManagedUser) => {
    if (account.id === user?.id) {
      setFeedback({ type: 'error', message: 'No puedes eliminar tu propia cuenta mientras mantienes la sesión activa.' });
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la cuenta de ${account.name}? Esta acción no se puede deshacer.`);
    if (!confirmed) {
      return;
    }

    setProcessingId(account.id);
    setFeedback(null);
    try {
      await adminUsersAPI.remove(account.id);
      setAccounts((prev) => prev.filter((item) => item.id !== account.id));
      setFeedback({ type: 'success', message: 'Cuenta eliminada correctamente.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos eliminar la cuenta.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessingId(null);
    }
  }, [user?.id]);

  return (
    <div className="accounts-page">
      <section className="accounts-hero">
        <div className="accounts-hero__icon">
          <ShieldCheck size={28} />
        </div>
        <div className="accounts-hero__content">
          <span className="accounts-hero__eyebrow">Administración central</span>
          <h1 className="accounts-hero__title">Control de cuentas y roles</h1>
          <p className="accounts-hero__subtitle">
            Supervisa accesos, reasigna permisos y mantén la gobernanza de tu organización en un solo lugar.
          </p>
        </div>
        <div className="accounts-hero__actions">
          <button type="button" className="accounts-button accounts-button--ghost" onClick={() => void loadAccounts()} disabled={loading}>
            <RefreshCcw size={16} />
            Recargar
          </button>
          <button type="button" className="accounts-button" disabled>
            <UserPlus size={16} />
            Invitar usuario
          </button>
        </div>
      </section>

      <section className="accounts-metrics">
        <article className="accounts-metric">
          <div className="accounts-metric__icon accounts-metric__icon--accent">
            <Users size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Cuentas activas</p>
            <p className="accounts-metric__value">{summary.total.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Total provisionado</span>
          </div>
        </article>
        <article className="accounts-metric">
          <div className="accounts-metric__icon">
            <Crown size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Superadmins</p>
            <p className="accounts-metric__value">{summary.superadmins.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Gobierno total</span>
          </div>
        </article>
        <article className="accounts-metric">
          <div className="accounts-metric__icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Administradores</p>
            <p className="accounts-metric__value">{summary.admins.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Gestión operativa</span>
          </div>
        </article>
        <article className="accounts-metric">
          <div className="accounts-metric__icon">
            <Lock size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Usuarios estándar</p>
            <p className="accounts-metric__value">{summary.standardUsers.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Acceso limitado</span>
          </div>
        </article>
      </section>

      {feedback && (
        <div className={`accounts-toast ${feedback.type === 'success' ? 'accounts-toast--success' : 'accounts-toast--error'}`}>
          {feedback.message}
        </div>
      )}

      {error && <div className="accounts-toast accounts-toast--error">{error}</div>}

      <section className="accounts-table-card">
        <header className="accounts-table-card__header">
          <div>
            <h2 className="accounts-table-card__title">Usuarios registrados</h2>
            <p className="accounts-table-card__subtitle">Gestiona roles, revoca accesos y controla la seguridad en tiempo real.</p>
          </div>
          <span className="accounts-table-card__badge">{summary.total.toLocaleString('es-ES')} cuentas</span>
        </header>

        <div className="accounts-table-card__content">
          <div className="accounts-table__scroll">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th className="accounts-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="accounts-table__empty accounts-table__empty--loading">
                      Cargando cuentas…
                    </td>
                  </tr>
                )}

                {!loading && sortedAccounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="accounts-table__empty">
                      No hay cuentas registradas todavía.
                    </td>
                  </tr>
                )}

                {!loading && sortedAccounts.map((account) => {
                  const isProcessing = processingId === account.id;
                  return (
                    <tr key={account.id}>
                      <td>
                        <span className="accounts-table__name">{account.name}</span>
                      </td>
                      <td>
                        <span className="accounts-table__email">{account.email}</span>
                      </td>
                      <td>
                        <div className="accounts-role">
                          <span className={`accounts-role__badge accounts-role__badge--${account.role}`}>
                            {ROLE_LABEL[account.role]}
                          </span>
                          <select
                            className="accounts-role__select"
                            value={account.role}
                            onChange={(event) => handleRoleChange(account.id, event.target.value as Role)}
                            disabled={isProcessing}
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <span className="accounts-table__date">{formatDate(account.createdAt)}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="accounts-delete"
                          onClick={() => void handleDelete(account)}
                          disabled={isProcessing}
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
