import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Mail,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { adminUsersAPI, organizationsAPI, type ManagedUser, type Organization } from '../../lib/services';
import { useAuth } from '../../context/AuthContext';
import './OrganizationManagementPage.css';

interface OrganizationManagementPageProps {
  organization: Organization;
  onBack: () => void;
}

const ROLE_LABELS: Record<ManagedUser['role'], string> = {
  user: 'Usuario',
  admin: 'Administrador',
  superadmin: 'Superadmin',
};

const ROLE_WEIGHT: Record<ManagedUser['role'], number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'No pudimos cargar la información. Inténtalo de nuevo.';
};

export function OrganizationManagementPage({ organization, onBack }: OrganizationManagementPageProps) {
  const { roleAtLeast } = useAuth();
  const canManageMembers = roleAtLeast('superadmin');

  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<ManagedUser[]>([]);
  const [organizationsMap, setOrganizationsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleSelections, setRoleSelections] = useState<Record<string, 'user' | 'admin'>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, orgs] = await Promise.all([adminUsersAPI.list(), organizationsAPI.list()]);

      const mapping: Record<string, string> = {};
      for (const org of orgs) {
        mapping[org.id] = org.name;
      }
      setOrganizationsMap(mapping);

      const assigned = users
        .filter((user) => user.organizationId === organization.id)
        .sort((a, b) => {
          const weight = ROLE_WEIGHT[b.role] - ROLE_WEIGHT[a.role];
          if (weight !== 0) return weight;
          return a.name.localeCompare(b.name, 'es');
        });

      const available = users
        .filter((user) => user.role !== 'superadmin' && user.organizationId !== organization.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

      const defaultSelections: Record<string, 'user' | 'admin'> = {};
      for (const user of available) {
        defaultSelections[user.id] = user.role === 'admin' ? 'admin' : 'user';
      }

      setMembers(assigned);
      setAvailableUsers(available);
      setRoleSelections(defaultSelections);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [organization.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAssign = useCallback(
    async (userId: string) => {
      if (!canManageMembers) {
        return;
      }

      const user = availableUsers.find((item) => item.id === userId);
      if (!user) {
        return;
      }

      const desiredRole = roleSelections[userId] ?? (user.role === 'admin' ? 'admin' : 'user');

      setAssigningUserId(userId);
      setFeedback(null);
      try {
        await adminUsersAPI.assignOrganization(userId, {
          organizationId: organization.id,
          makeAdmin: desiredRole === 'admin',
        });
        setFeedback({ type: 'success', message: `${user.name} ahora pertenece a ${organization.name}.` });
        await loadData();
      } catch (err) {
        setFeedback({
          type: 'error',
          message: resolveErrorMessage(err),
        });
      } finally {
        setAssigningUserId(null);
      }
    },
    [availableUsers, canManageMembers, loadData, organization.id, organization.name, roleSelections],
  );

  const filteredAvailable = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return availableUsers;
    }
    return availableUsers.filter((user) =>
      user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized),
    );
  }, [availableUsers, searchTerm]);

  const stats = useMemo(() => {
    const adminCount = members.filter((member) => member.role === 'admin' || member.role === 'superadmin').length;
    const pendingCount = members.filter((member) => !member.approved).length;
    const unassignedCount = availableUsers.filter((user) => !user.organizationId).length;
    return {
      totalMembers: members.length,
      adminCount,
      pendingCount,
      unassignedCount,
    };
  }, [availableUsers, members]);

  const statHighlights = useMemo(
    () => [
      {
        key: 'totalMembers',
        label: 'Miembros totales',
        value: stats.totalMembers,
        icon: Users,
        tone: 'primary' as const,
      },
      {
        key: 'adminCount',
        label: 'Administradores',
        value: stats.adminCount,
        icon: ShieldCheck,
        tone: 'success' as const,
      },
      {
        key: 'pendingCount',
        label: 'Pendientes de aprobación',
        value: stats.pendingCount,
        icon: AlertTriangle,
        tone: 'warning' as const,
      },
      {
        key: 'unassignedCount',
        label: 'Sin organización',
        value: stats.unassignedCount,
        icon: UserMinus,
        tone: 'neutral' as const,
      },
    ],
    [stats.adminCount, stats.pendingCount, stats.totalMembers, stats.unassignedCount],
  );

  return (
    <div className="org-management-page">
      <section className="org-management-hero">
        <div className="org-management-hero__top">
          <button className="org-management-hero__back" onClick={onBack}>
            <ArrowLeft size={18} />
            Volver a organizaciones
          </button>
          <button
            className="org-management-icon-button"
            onClick={() => void handleRefresh()}
            disabled={loading || refreshing}
            title="Recargar información"
            aria-label="Recargar información"
          >
            <RefreshCcw className={refreshing || loading ? 'org-management-icon-button__icon--spinning' : undefined} size={18} />
          </button>
        </div>
        <div className="org-management-hero__content">
          <div className="org-management-hero__body">
            <span className="org-management-hero__icon">
              <Building2 size={24} />
            </span>
            <div className="org-management-hero__text">
              <span className="org-management-hero__eyebrow">Administración</span>
              <h1>{organization.name}</h1>
              <p>{organization.description || 'Gestiona miembros, permisos y datos clave de la organización en un solo lugar.'}</p>
            </div>
          </div>
          <ul className="org-management-meta org-management-hero__meta">
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <Users size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Propietario</span>
                <p>
                  {organization.owner ? (
                    organization.owner
                  ) : (
                    <span className="org-management-meta__muted">No registrado</span>
                  )}
                </p>
              </div>
            </li>
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <Mail size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Correo fiscal</span>
                <p>
                  {organization.businessEmail ? (
                    organization.businessEmail
                  ) : (
                    <span className="org-management-meta__muted">Sin correo de contacto</span>
                  )}
                </p>
              </div>
            </li>
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <MapPin size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Ubicación</span>
                <p>
                  {organization.location ? (
                    organization.location
                  ) : (
                    <span className="org-management-meta__muted">Sin ubicación definida</span>
                  )}
                </p>
              </div>
            </li>
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <Briefcase size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">CI / RUC</span>
                <p>
                  {organization.ciRuc ? (
                    organization.ciRuc
                  ) : (
                    <span className="org-management-meta__muted">Sin registro</span>
                  )}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {feedback && (
        <div className={`org-management-alert org-management-alert--${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

      {error && (
        <div className="org-management-alert org-management-alert--error" role="alert">
          {error}
        </div>
      )}

      <section className="org-management-summary">
        {statHighlights.map(({ key, label, value, icon: Icon, tone }) => (
          <article key={key} className={`org-management-summary-card org-management-summary-card--${tone}`}>
            <span className="org-management-summary-card__icon">
              <Icon size={20} />
            </span>
            <div className="org-management-summary-card__content">
              <span className="org-management-summary-card__label">{label}</span>
              <span className="org-management-summary-card__value">{value}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="org-management-overview">
        <article className="org-management-card">
          <div className="org-management-card__header">
            <h2>Información general</h2>
          </div>
          <p>
            {organization.description
              ? organization.description
              : 'No se registró una descripción para esta organización.'}
          </p>
          <ul className="org-management-meta">
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <Users size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Miembros asignados</span>
                <p>{stats.totalMembers}</p>
              </div>
            </li>
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <ShieldCheck size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Administradores</span>
                <p>{stats.adminCount}</p>
              </div>
            </li>
            <li className="org-management-meta__item">
              <span className="org-management-meta__icon">
                <UserPlus size={18} />
              </span>
              <div>
                <span className="org-management-meta__label">Cupos disponibles</span>
                <p>
                  {typeof organization.availableUserSlots === 'number' ? (
                    organization.availableUserSlots
                  ) : (
                    <span className="org-management-meta__muted">Sin límite declarado</span>
                  )}
                </p>
              </div>
            </li>
          </ul>
        </article>

        <article className="org-management-card org-management-card--stats">
          <div className="org-management-card__header">
            <h2>Actividad</h2>
            <span className="org-management-chip">Actualizado {formatDate(organization.updatedAt)}</span>
          </div>
          <div className="org-management-stats">
            <div className="org-management-stat">
              <span className="org-management-stat__label">Miembros totales</span>
              <strong className="org-management-stat__value">{stats.totalMembers}</strong>
            </div>
            <div className="org-management-stat">
              <span className="org-management-stat__label">Administradores</span>
              <strong className="org-management-stat__value">{stats.adminCount}</strong>
            </div>
            <div className="org-management-stat">
              <span className="org-management-stat__label">Pendientes</span>
              <strong className="org-management-stat__value">{stats.pendingCount}</strong>
            </div>
            <div className="org-management-stat">
              <span className="org-management-stat__label">Usuarios sin organización</span>
              <strong className="org-management-stat__value">{stats.unassignedCount}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="org-management-panels">
        <article className="org-management-section org-management-section--members">
          <header className="org-management-section__header">
            <div>
              <h2>Miembros de la organización</h2>
              <p>Supervisa quién tiene acceso y el estado de aprobación de cada colaborador.</p>
            </div>
            <span className="org-management-chip">{stats.totalMembers} miembros</span>
          </header>
          {loading ? (
            <div className="org-management-loading">
              <RefreshCcw className="org-management-loading__icon" size={20} />
              Cargando miembros...
            </div>
          ) : members.length === 0 ? (
            <div className="org-management-empty">
              <Building2 size={28} />
              <p>Aún no hay personas asignadas a esta organización.</p>
            </div>
          ) : (
            <div className="org-management-table">
              <div className="org-management-table__row org-management-table__row--head">
                <span>Usuario</span>
                <span>Rol</span>
                <span>Estado</span>
                <span>Actualizado</span>
              </div>
              {members.map((member) => (
                <div className="org-management-table__row" key={member.id}>
                  <div className="org-management-table__main">
                    <span className="org-management-table__name">{member.name}</span>
                    <span className="org-management-table__email">{member.email}</span>
                  </div>
                  <span
                    className={`org-management-badge org-management-badge--role-${member.role === 'superadmin' ? 'superadmin' : member.role}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                  <span
                    className={`org-management-badge org-management-badge--state-${member.approved ? 'approved' : 'pending'}`}
                  >
                    {member.approved ? 'Aprobado' : 'Pendiente'}
                  </span>
                  <span className="org-management-table__date">{formatDate(member.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="org-management-section org-management-section--available">
          <header className="org-management-section__header">
            <div>
              <h2>Usuarios disponibles</h2>
              <p>Asigna rápidamente usuarios y administradores a esta organización. La lista muestra perfiles sin acceso actual o pertenecientes a otras empresas.</p>
            </div>
            {canManageMembers && (
              <div className="org-management-section__actions">
                <div className="org-management-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Buscar por nombre o correo"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>
            )}
          </header>
          {!canManageMembers ? (
            <div className="org-management-empty org-management-empty--muted">
              <ShieldCheck size={24} />
              <p>Solo el superadmin puede gestionar los miembros de la organización.</p>
            </div>
          ) : loading ? (
            <div className="org-management-loading">
              <RefreshCcw className="org-management-loading__icon" size={20} />
              Preparando listado de usuarios...
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="org-management-empty">
              <UserPlus size={28} />
              <p>
                {searchTerm
                  ? 'No encontramos coincidencias con tu búsqueda.'
                  : 'Todos los usuarios ya están asignados a una organización.'}
              </p>
            </div>
          ) : (
            <div className="org-management-available">
              {filteredAvailable.map((user) => (
                <div className="org-management-available__item" key={user.id}>
                  <div className="org-management-available__profile">
                    <div className="org-management-avatar" aria-hidden>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="org-management-available__text">
                      <span className="org-management-available__name">{user.name}</span>
                      <span className="org-management-available__email">{user.email}</span>
                      {user.organizationId && user.organizationId !== organization.id && (
                        <span className="org-management-available__hint">
                          Actualmente en {organizationsMap[user.organizationId] ?? 'otra organización'}
                        </span>
                      )}
                      {!user.organizationId && (
                        <span className="org-management-available__hint org-management-available__hint--positive">
                          Sin organización asignada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="org-management-available__actions">
                    <div className="org-management-select">
                      <span>Rol</span>
                      <select
                        value={roleSelections[user.id]}
                        onChange={(event) =>
                          setRoleSelections((prev) => ({
                            ...prev,
                            [user.id]: event.target.value as 'user' | 'admin',
                          }))
                        }
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <button
                      className="org-management-assign-btn"
                      onClick={() => void handleAssign(user.id)}
                      disabled={assigningUserId === user.id}
                    >
                      {assigningUserId === user.id ? (
                        <>
                          <RefreshCcw
                            size={16}
                            className="org-management-assign-btn__icon org-management-assign-btn__icon--spinning"
                            aria-hidden
                          />
                          <span>Asignando...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} className="org-management-assign-btn__icon" aria-hidden />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
