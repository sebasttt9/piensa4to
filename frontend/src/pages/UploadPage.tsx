import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, CheckCircle, CloudUpload, FileSpreadsheet, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { datasetsAPI } from '../lib/services';
import './UploadPage.css';

export function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Verificar tamaño (100MB límite)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. El límite es 100 MB.';
    }

    // Verificar tipo de archivo
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return 'Formato no soportado. Use archivos CSV, Excel (.xlsx/.xls) o JSON.';
    }

    // Verificar tipo MIME para archivos JSON
    if (fileName.endsWith('.json')) {
      const allowedMimeTypes = ['application/json', 'text/plain'];
      if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
        return 'El archivo JSON tiene un tipo MIME inválido.';
      }
    }

    // Verificar que no esté vacío
    if (file.size === 0) {
      return 'El archivo está vacío.';
    }

    return null;
  };

  const mutation = useMutation({
    mutationFn: async ({ file, name, details }: { file: File; name: string; details?: { description?: string; tags?: string[] } }) => {
      const dataset = await datasetsAPI.create({
        name,
        description: details?.description?.trim() ? details?.description?.trim() : undefined,
        tags: details?.tags?.length ? details.tags : undefined,
      });
      await datasetsAPI.uploadFile(dataset.id, file);
      return dataset;
    },
    onError: (error: any) => {
      console.warn('Upload error:', error);
      // El error ya se maneja en el componente
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setFileError(validationError);
        setSelectedFile(null);
        setFileName('');
        // Reset the input
        event.target.value = '';
        return;
      }

      setFileError(null);
      setSelectedFile(file);
      setFileName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setDescription('');
    setTags('');
    setFileError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !fileName.trim()) {
      return;
    }

    mutation.reset();

    const normalizedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      await mutation.mutateAsync({
        file: selectedFile,
        name: fileName.trim(),
        details: {
          description,
          tags: normalizedTags,
        },
      });
      resetForm();
    } catch (error) {
      console.warn('Upload error:', error);
    }
  };

  const features = [
    { icon: Zap, title: 'Análisis Automático', desc: 'IA detecta patrones, anomalías y oportunidades' },
    { icon: ShieldCheck, title: 'Seguridad Empresarial', desc: 'Encriptado end-to-end, cumple GDPR e ISO' },
    { icon: FileSpreadsheet, title: 'CSV, Excel, JSON', desc: 'Soporta múltiples formatos de datos' },
  ];

  const fileSummary = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    const extension = selectedFile.name.split('.').pop()?.toUpperCase() ?? 'Archivo';
    const sizeMb = (selectedFile.size / 1024 / 1024).toFixed(2);

    return { extension, sizeMb };
  }, [selectedFile]);

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="upload-header__info">
          <span className="upload-header__icon">
            <CloudUpload className="w-6 h-6" />
          </span>
          <div className="upload-header__meta">
            <h1 className="upload-header__title">Cargar dataset</h1>
            <p className="upload-header__subtitle">
              Sube tus archivos, agrega metadatos y deja que la plataforma prepare los análisis en segundos.
            </p>
          </div>
        </div>
        <div className="upload-header__progress">
          <CheckCircle className={mutation.isSuccess ? 'upload-header__progress-icon upload-header__progress-icon--active' : 'upload-header__progress-icon'} />
          <span>{mutation.isSuccess ? 'Última carga completada' : 'Listo para cargar'}</span>
        </div>
      </header>

      <div className="upload-layout">
        <section className="upload-panel">
          <form className="upload-form" onSubmit={handleSubmit}>
            <div className="upload-dropzone">
              <input
                type="file"
                id="dataset-file"
                className="upload-dropzone__input"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls,.json"
              />
              <label htmlFor="dataset-file" className="upload-dropzone__label">
                <CloudUpload className="upload-dropzone__icon" />
                <p className="upload-dropzone__title">Arrastra tu archivo o haz clic para seleccionar</p>
                <p className="upload-dropzone__meta">Formatos admitidos: CSV, XLSX, JSON • Límite 100&nbsp;MB</p>
              </label>
            </div>

            {fileError && (
              <div className="upload-error">
                <AlertCircle className="upload-error__icon" />
                <span className="upload-error__message">{fileError}</span>
              </div>
            )}

            {selectedFile && fileSummary && (
              <div className="upload-file">
                <div className="upload-file__icon">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="upload-file__details">
                  <p className="upload-file__name">{selectedFile.name}</p>
                  <p className="upload-file__meta">{fileSummary.extension} • {fileSummary.sizeMb} MB</p>
                </div>
                <button
                  type="button"
                  className="upload-file__reset"
                  onClick={() => {
                    resetForm();
                    mutation.reset();
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Limpiar
                </button>
              </div>
            )}

            {selectedFile && (
              <>
                <div className="upload-field">
                  <label htmlFor="dataset-name" className="upload-field__label">Nombre del dataset</label>
                  <input
                    id="dataset-name"
                    type="text"
                    className="upload-field__input"
                    placeholder="Ej. Ventas retail Q4 2025"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                  />
                  <p className="upload-field__helper">El nombre se mostrará en tu biblioteca y en los dashboards.</p>
                </div>

                <div className="upload-field">
                  <label htmlFor="dataset-description" className="upload-field__label">Descripción (opcional)</label>
                  <textarea
                    id="dataset-description"
                    className="upload-field__textarea"
                    placeholder="Agrega contexto, métricas incluidas o el objetivo del dataset"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />
                </div>

                <div className="upload-field">
                  <label htmlFor="dataset-tags" className="upload-field__label">Etiquetas (opcional)</label>
                  <input
                    id="dataset-tags"
                    type="text"
                    className="upload-field__input"
                    placeholder="Finanzas, Ventas, LATAM"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                  />
                  <p className="upload-field__helper">Separa las etiquetas con coma para facilitar la búsqueda.</p>
                </div>

                <div className="upload-actions">
                  <button
                    type="submit"
                    className="upload-primary"
                    disabled={mutation.isPending || !fileName.trim()}
                  >
                    {mutation.isPending ? 'Procesando...' : 'Subir y analizar'}
                  </button>
                </div>
              </>
            )}

            {mutation.isSuccess && (
              <div className="upload-feedback upload-feedback--success">
                <CheckCircle className="upload-feedback__icon" />
                <div>
                  <p className="upload-feedback__title">Dataset cargado correctamente</p>
                  <p className="upload-feedback__message">Encontrarás el nuevo recurso en la sección de datasets en pocos instantes.</p>
                </div>
              </div>
            )}

            {mutation.isError && (
              <div className="upload-feedback upload-feedback--error">
                <AlertCircle className="upload-feedback__icon" />
                <div>
                  <p className="upload-feedback__title">No pudimos completar la carga</p>
                  <p className="upload-feedback__message">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : 'Revisa el formato del archivo e inténtalo nuevamente.'}
                  </p>
                </div>
              </div>
            )}
          </form>
        </section>

        <aside className="upload-sidebar">
          <div className="upload-sidebar__list">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="upload-sidebar__card">
                  <span className="upload-sidebar__card-icon">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="upload-sidebar__card-title">{feature.title}</p>
                    <p className="upload-sidebar__card-text">{feature.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="upload-guidelines">
            <p className="upload-guidelines__title">Guías de preparación</p>
            <ul className="upload-guidelines__list">
              <li>Asegúrate que cada columna tenga un encabezado descriptivo.</li>
              <li>Normaliza fechas y valores numéricos para facilitar el análisis.</li>
              <li>Los archivos grandes se procesan en segundo plano; recibirás una notificación.</li>
              <li><strong>JSON:</strong> Usa arrays de objetos o objetos con propiedades como 'data', 'records', 'rows', 'items', o 'results'.</li>
              <li><strong>Ejemplo JSON válido:</strong> <code>{'[{"nombre": "Producto A", "precio": 25.50, "cantidad": 100}]'}</code></li>
              <li><strong>Archivos de ejemplo:</strong> Revisa <code>src/data/sample-inventory.json</code> y <code>src/data/sample-inventory-structured.json</code></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default UploadPage;
