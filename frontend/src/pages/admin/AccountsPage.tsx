import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCcw, Trash2, Users, Crown, Clock, CheckCircle } from 'lucide-react';
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
    const approved = accounts.filter((account) => account.approved).length;
    const pending = accounts.filter((account) => !account.approved).length;
    const admins = accounts.filter((account) => account.role === 'admin' && account.approved).length;
    const superadmins = accounts.filter((account) => account.role === 'superadmin' && account.approved).length;
    const standardUsers = Math.max(approved - admins - superadmins, 0);

    return {
      total,
      approved,
      pending,
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

  const handleApprove = useCallback(async (accountId: string) => {
    setProcessingId(accountId);
    setFeedback(null);
    try {
      const updated = await adminUsersAPI.approve(accountId);
      setAccounts((prev) => prev.map((account) => (account.id === accountId ? updated : account)));
      setFeedback({ type: 'success', message: 'Cuenta aprobada correctamente.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos aprobar la cuenta.';
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
      <header className="accounts-header">
        <div className="accounts-header__top">
          <div className="accounts-header__icon">
            <ShieldCheck size={24} />
          </div>
          <div className="accounts-header__titles">
            <span className="accounts-header__eyebrow">Administración central</span>
            <h1 className="accounts-header__title">Control de cuentas y roles</h1>
          </div>
        </div>
        <p className="accounts-header__subtitle">
          Supervisa accesos, reasigna permisos y mantén la gobernanza de tu organización en un solo lugar.
        </p>
      </header>

      <section className="accounts-metrics">
        <article className="accounts-metric">
          <div className="accounts-metric__icon accounts-metric__icon--accent">
            <Users size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Cuentas activas</p>
            <p className="accounts-metric__value">{summary.approved.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Aprobadas y activas</span>
          </div>
        </article>
        <article className="accounts-metric">
          <div className="accounts-metric__icon accounts-metric__icon--warning">
            <Clock size={20} />
          </div>
          <div>
            <p className="accounts-metric__label">Pendientes</p>
            <p className="accounts-metric__value">{summary.pending.toLocaleString('es-ES')}</p>
            <span className="accounts-metric__helper">Esperando aprobación</span>
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
                  <th>Estado</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th className="accounts-table__actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="accounts-table__empty accounts-table__empty--loading">
                      Cargando cuentas…
                    </td>
                  </tr>
                )}

                {!loading && sortedAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="accounts-table__empty">
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
                        <span className={`accounts-status ${account.approved ? 'accounts-status--approved' : 'accounts-status--pending'}`}>
                          {account.approved ? (
                            <>
                              <CheckCircle size={14} />
                              Aprobada
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              Pendiente
                            </>
                          )}
                        </span>
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
                            disabled={isProcessing || !account.approved}
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
                        <div className="accounts-actions">
                          {!account.approved && (
                            <button
                              type="button"
                              className="accounts-approve"
                              onClick={() => void handleApprove(account.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle size={14} />
                              Aprobar
                            </button>
                          )}
                          <button
                            type="button"
                            className="accounts-delete"
                            onClick={() => void handleDelete(account)}
                            disabled={isProcessing}
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <footer className="accounts-table-card__footer">
          <button
            type="button"
            className="accounts-icon-button"
            onClick={() => void loadAccounts()}
            disabled={loading}
            aria-label="Recargar cuentas"
            title="Recargar cuentas"
          >
            <RefreshCcw size={18} />
          </button>
        </footer>
      </section>
    </div>
  );
}
