import { useCallback, useEffect, useState } from 'react';
import { Building2, ArrowLeft, Users, BarChart3, Database, FileText, Settings } from 'lucide-react';
import { type Organization } from '../../lib/services';
import './OrganizationManagementPage.css';

interface OrganizationManagementPageProps {
  organization: Organization;
  onBack: () => void;
}

export function OrganizationManagementPage({ organization, onBack }: OrganizationManagementPageProps) {
  const [stats, setStats] = useState({
    users: 0,
    dashboards: 0,
    datasets: 0,
    reports: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      // Aquí cargaríamos las estadísticas reales de la organización
      // Por ahora usamos datos mock
      setStats({
        users: 8, // 5 users + 3 admins + 1 superadmin
        dashboards: 12,
        datasets: 25,
        reports: 5,
      });
    } catch (error) {
      console.error('Error loading organization stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="org-management-page">
      <div className="org-management-page__header">
        <button
          className="org-management-page__back-btn"
          onClick={onBack}
        >
          <ArrowLeft className="org-management-page__back-icon" />
          Volver a Organizaciones
        </button>
        <div className="org-management-page__title">
          <Building2 className="org-management-page__title-icon" />
          <div>
            <h1>{organization.name}</h1>
            <p>{organization.description || 'Sin descripción'}</p>
          </div>
        </div>
      </div>

      <div className="org-management-page__info-grid">
        <div className="org-management-page__info-card">
          <h3>Información General</h3>
          <div className="org-management-page__info-item">
            <strong>Ubicación:</strong> {organization.location || 'No especificada'}
          </div>
          <div className="org-management-page__info-item">
            <strong>Dueño:</strong> {organization.owner || 'No especificado'}
          </div>
          <div className="org-management-page__info-item">
            <strong>CI/RUC:</strong> {organization.ciRuc || 'No especificado'}
          </div>
          <div className="org-management-page__info-item">
            <strong>Email Empresarial:</strong> {organization.businessEmail || 'No especificado'}
          </div>
          <div className="org-management-page__info-item">
            <strong>Creado:</strong> {new Date(organization.createdAt).toLocaleDateString('es-ES')}
          </div>
          <div className="org-management-page__info-item">
            <strong>Última actualización:</strong> {new Date(organization.updatedAt).toLocaleDateString('es-ES')}
          </div>
        </div>

        <div className="org-management-page__stats-grid">
          <div className="org-management-page__stat-card">
            <Users className="org-management-page__stat-icon" />
            <div className="org-management-page__stat-content">
              <h4>{stats.users}</h4>
              <p>Usuarios</p>
            </div>
          </div>
          <div className="org-management-page__stat-card">
            <BarChart3 className="org-management-page__stat-icon" />
            <div className="org-management-page__stat-content">
              <h4>{stats.dashboards}</h4>
              <p>Dashboards</p>
            </div>
          </div>
          <div className="org-management-page__stat-card">
            <Database className="org-management-page__stat-icon" />
            <div className="org-management-page__stat-content">
              <h4>{stats.datasets}</h4>
              <p>Datasets</p>
            </div>
          </div>
          <div className="org-management-page__stat-card">
            <FileText className="org-management-page__stat-icon" />
            <div className="org-management-page__stat-content">
              <h4>{stats.reports}</h4>
              <p>Reportes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="org-management-page__actions-grid">
        <div className="org-management-page__action-card">
          <Users className="org-management-page__action-icon" />
          <h3>Gestionar Usuarios</h3>
          <p>Administrar usuarios, roles y permisos de la organización</p>
          <button className="org-management-page__action-btn">
            Gestionar Usuarios
          </button>
        </div>

        <div className="org-management-page__action-card">
          <BarChart3 className="org-management-page__action-icon" />
          <h3>Dashboards</h3>
          <p>Ver y gestionar todos los dashboards de la organización</p>
          <button className="org-management-page__action-btn">
            Ver Dashboards
          </button>
        </div>

        <div className="org-management-page__action-card">
          <Database className="org-management-page__action-icon" />
          <h3>Datasets</h3>
          <p>Administrar datasets y fuentes de datos</p>
          <button className="org-management-page__action-btn">
            Gestionar Datasets
          </button>
        </div>

        <div className="org-management-page__action-card">
          <FileText className="org-management-page__action-icon" />
          <h3>Reportes</h3>
          <p>Generar y gestionar reportes de la organización</p>
          <button className="org-management-page__action-btn">
            Ver Reportes
          </button>
        </div>

        <div className="org-management-page__action-card">
          <Settings className="org-management-page__action-icon" />
          <h3>Configuración</h3>
          <p>Configurar parámetros y preferencias de la organización</p>
          <button className="org-management-page__action-btn">
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}