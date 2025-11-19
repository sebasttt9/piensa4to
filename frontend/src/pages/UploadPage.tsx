import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { CloudUpload, FileSpreadsheet, ShieldCheck, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !fileName.trim()) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', fileName);
    try {
      await mutation.mutateAsync(formData);
    } catch (error) {
      console.warn('Upload error:', error);
    }
  };

  const features = [
    { icon: Zap, title: 'Análisis Automático', desc: 'IA detecta patrones, anomalías y oportunidades' },
    { icon: ShieldCheck, title: 'Seguridad Empresarial', desc: 'Encriptado end-to-end, cumple GDPR e ISO' },
    { icon: FileSpreadsheet, title: 'CSV, Excel, JSON', desc: 'Soporta múltiples formatos de datos' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header with Animation */}
        <div className="mb-8 flex items-center gap-3 animate-slideIn">
          <div className="p-2 bg-gradient-to-br from-purple-500 via-blue-500 to-blue-600 rounded-lg hover:shadow-[0_15px_40px_rgba(167,139,250,0.3)] transition-all duration-300 transform hover:scale-110">
            <CloudUpload className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">Cargar Dataset</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Card - Main Area */}
          <Card variant="elevated" className="lg:col-span-2 group overflow-hidden animate-slideIn">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <CardContent className="pt-0 space-y-6 relative z-10">
              {/* Drop Zone */}
              <div className="border-2 border-dashed rounded-2xl p-12 text-center transition-all border-white/20 hover:border-white/40 bg-gradient-to-br from-white/5 to-white/2 hover:from-white/8 hover:to-white/4 group/dropzone cursor-pointer backdrop-blur-sm">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls,.json"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="animate-float mb-4">
                    <CloudUpload className="mx-auto h-12 w-12 bg-gradient-to-br from-purple-400 to-blue-400 bg-clip-text text-transparent" />
                  </div>
                  <p className="text-xl font-semibold text-white group-hover/dropzone:text-transparent group-hover/dropzone:bg-gradient-to-r group-hover/dropzone:from-purple-300 group-hover/dropzone:to-blue-300 group-hover/dropzone:bg-clip-text transition-all duration-300">Arrastra tu archivo aquí</p>
                  <p className="text-white/50 text-sm mt-2">o haz clic para seleccionar</p>
                  <p className="text-white/30 text-xs mt-4">CSV, Excel (.xlsx) o JSON - Máx. 100MB</p>
                </label>
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/40 rounded-xl flex items-center gap-3 animate-bounceIn hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300">
                  <FileSpreadsheet className="w-5 h-5 text-blue-300 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-white/50 text-xs mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}

              {/* Dataset Name Input */}
              {selectedFile && (
                <div className="animate-slideInRight">
                  <Input
                    type="text"
                    placeholder="ej: Ventas Q4 2024"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    label="Nombre del Dataset"
                    helperText="Este nombre aparecerá en tu biblioteca"
                  />
                </div>
              )}

              {/* Upload Button */}
              {selectedFile && (
                <Button
                  onClick={handleSubmit}
                  isLoading={mutation.isPending}
                  disabled={mutation.isPending || !fileName.trim()}
                  size="lg"
                  className="w-full animate-slideInRight"
                >
                  {mutation.isPending ? 'Procesando...' : 'Analizar con IA'}
                </Button>
              )}

              {/* Success Message */}
              {mutation.isSuccess && (
                <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl flex items-start gap-3 animate-bounceIn hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 shadow-lg shadow-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-green-200 font-medium">¡Dataset cargado exitosamente!</p>
                    <p className="text-green-300/70 text-sm mt-1">Tu análisis estará listo en unos segundos</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {mutation.isError && (
                <div className="p-4 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/40 rounded-xl flex items-start gap-3 animate-bounceIn hover:from-red-500/30 hover:to-rose-500/30 transition-all duration-300 shadow-lg shadow-red-500/10">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-red-200 font-medium">Error al cargar</p>
                    <p className="text-red-300/70 text-sm mt-1">Intenta nuevamente con otro archivo</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Sidebar */}
          <div className="space-y-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx} 
                  variant="elevated" 
                  className="group overflow-hidden hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] transform hover:translate-y-[-4px] transition-all duration-300"
                  style={{
                    animation: `slideInRight 0.5s ease-out ${idx * 0.15}s backwards`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <CardContent className="pt-0 flex items-start gap-3 relative z-10">
                    <div className="p-2 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex-shrink-0 group-hover:from-purple-500/50 group-hover:to-blue-500/50 transition-all duration-300 transform group-hover:scale-110">
                      <Icon className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 group-hover:bg-clip-text transition-all duration-300">{feature.title}</p>
                      <p className="text-white/50 text-xs mt-1 group-hover:text-white/70 transition-all duration-300">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Info Card */}
            <Card variant="outlined" className="group overflow-hidden border-white/20 hover:border-white/40 animate-slideInRight" style={{ animationDelay: '0.45s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <CardContent className="pt-0 relative z-10">
                <p className="text-white/80 text-xs font-medium mb-2 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></span>
                  Proceso Automático
                </p>
                <p className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-all duration-300">
                  Nuestro sistema analiza automáticamente la estructura de datos, detecta anomalías y genera visualizaciones recomendadas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
