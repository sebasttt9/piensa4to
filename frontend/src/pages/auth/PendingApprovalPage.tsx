import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

export function PendingApprovalPage() {

  const handleResendNotification = () => {
    // Aquí podríamos implementar lógica para reenviar notificación
    alert('Se ha enviado un recordatorio al administrador.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-500/10 rounded-full">
            <Clock className="h-12 w-12 text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Cuenta pendiente de aprobación</h1>
          <p className="text-slate-300">
            Tu solicitud de cuenta ha sido registrada exitosamente. Un administrador
            revisará tu información y activará tu cuenta en las próximas horas.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 font-medium">Proceso de aprobación</span>
          </div>
          <p className="text-sm text-slate-300">
            Todas las cuentas nuevas requieren verificación administrativa para
            garantizar la seguridad y calidad del servicio.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendNotification}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Recordar al administrador
          </button>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>

        <div className="text-xs text-slate-500">
          Si tienes preguntas, contacta al soporte técnico de tu organización.
        </div>
      </div>
    </div>
  );
}