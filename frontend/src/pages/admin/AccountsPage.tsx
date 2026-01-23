import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, RefreshCcw, UserPlus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminUsersAPI, type ManagedUser } from '../../lib/services';
import { useAuth, type Role } from '../../context/AuthContext';

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
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-slideIn">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-white/10 text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Control de cuentas</h1>
            <p className="text-white/60">Autoriza roles, provisiona accesos y mantiene la gobernanza centralizada.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => void loadAccounts()}
            disabled={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            Recargar
          </Button>
          <Button variant="primary" className="flex items-center gap-2" disabled>
            <UserPlus className="w-4 h-4" />
            Invitar usuario
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 ${feedback.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}
        >
          {feedback.message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 px-4 py-3">
          {error}
        </div>
      )}

      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <Table>
              <TableHeader className="border-b border-white/10 bg-white/5">
                <TableRow>
                  <TableHead className="text-white/70 font-semibold">Nombre</TableHead>
                  <TableHead className="text-white/70 font-semibold">Correo</TableHead>
                  <TableHead className="text-white/70 font-semibold">Rol</TableHead>
                  <TableHead className="text-white/70 font-semibold">Creado</TableHead>
                  <TableHead className="text-right text-white/70 font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-white/70">
                      Cargando cuentas…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && sortedAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-white/60">
                      No hay cuentas registradas todavía.
                    </TableCell>
                  </TableRow>
                )}

                {!loading && sortedAccounts.map((account) => {
                  const isProcessing = processingId === account.id;
                  return (
                    <TableRow key={account.id} className="border-b border-white/5 hover:bg-white/10 transition-colors duration-300">
                      <TableCell className="text-white font-medium">
                        {account.name}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {account.email}
                      </TableCell>
                      <TableCell className="text-white/70">
                        <div className="flex items-center gap-3">
                          <Badge variant={account.role === 'superadmin' ? 'info' : account.role === 'admin' ? 'warning' : 'default'} size="sm">
                            {ROLE_LABEL[account.role]}
                          </Badge>
                          <select
                            className="rounded-lg bg-white/10 border border-white/20 text-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            value={account.role}
                            onChange={(event) => handleRoleChange(account.id, event.target.value as Role)}
                            disabled={isProcessing}
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value} className="text-slate-900">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {formatDate(account.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          className="inline-flex items-center gap-2"
                          onClick={() => void handleDelete(account)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
