import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { datasetsAPI, type ManualColumn, type CreateManualDatasetInput } from '../lib/services';
import { Button } from '../components/ui/Button';
import './ManualDatasetPage.css';

interface ColumnForm {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description: string;
}

const COLUMN_TYPE_LABELS: Record<ColumnForm['type'], string> = {
  string: 'Texto',
  number: 'Numérico',
  boolean: 'Sí / No',
  date: 'Fecha',
};

const formatColumnLabel = (name: string) =>
  name
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

type DatasetTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  columns: Array<Omit<ManualColumn, 'description'> & { description: string }>;
  sampleRows?: Record<string, any>[];
};

const DATASET_TEMPLATES: DatasetTemplate[] = [
  {
    id: 'ventas-mensuales',
    name: 'Seguimiento de Ventas',
    description: 'Controla tus ventas, canales y cumplimiento de objetivos por mes.',
    tags: ['ventas', 'ingresos', 'canales'],
    columns: [
      { name: 'mes', type: 'date', description: 'Mes de referencia' },
      { name: 'canal', type: 'string', description: 'Canal de venta' },
      { name: 'monto', type: 'number', description: 'Importe total vendido' },
      { name: 'objetivo_cumplido', type: 'boolean', description: '¿Se cumplió el objetivo?' },
    ],
    sampleRows: [
      {
        mes: '2026-01-01',
        canal: 'E-commerce',
        monto: 0,
        objetivo_cumplido: false,
      },
    ],
  },
  {
    id: 'inventario-activo',
    name: 'Inventario Activo',
    description: 'Monitorea existencia, rotación y estado de artículos críticos.',
    tags: ['inventario', 'logística'],
    columns: [
      { name: 'sku', type: 'string', description: 'Identificador del producto' },
      { name: 'descripcion', type: 'string', description: 'Descripción corta' },
      { name: 'stock_actual', type: 'number', description: 'Stock disponible' },
      { name: 'punto_reorden', type: 'number', description: 'Nivel mínimo antes de reordenar' },
      { name: 'activo', type: 'boolean', description: 'Disponible para venta' },
    ],
    sampleRows: [
      {
        sku: 'SKU-001',
        descripcion: 'Producto destacado',
        stock_actual: 0,
        punto_reorden: 0,
        activo: true,
      },
    ],
  },
  {
    id: 'satisfaccion-clientes',
    name: 'Satisfacción de Clientes',
    description: 'Evalúa feedback, puntajes y seguimiento de resolución.',
    tags: ['clientes', 'experiencia'],
    columns: [
      { name: 'fecha', type: 'date', description: 'Fecha del contacto' },
      { name: 'cliente', type: 'string', description: 'Nombre o identificador' },
      { name: 'puntaje_nps', type: 'number', description: 'Puntaje NPS (0-10)' },
      { name: 'comentario', type: 'string', description: 'Resumen del feedback' },
      { name: 'resuelto', type: 'boolean', description: 'Caso resuelto' },
    ],
    sampleRows: [
      {
        fecha: '2026-01-15',
        cliente: 'Cliente ejemplo',
        puntaje_nps: 0,
        comentario: 'Pendiente de respuesta',
        resuelto: false,
      },
    ],
  },
];

const DATASET_TIPS: string[] = [
  'Usa nombres de columnas cortos y consistentes; evita espacios y acentos.',
  'Define tipos de datos acordes al uso analítico (números, fechas, booleanos).',
  'Añade etiquetas para facilitar búsquedas y automatizar dashboards.',
  'Carga filas de ejemplo para validar la estructura antes de producir.',
];

export function ManualDatasetPage() {
  const navigate = useNavigate();
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [columns, setColumns] = useState<ColumnForm[]>([{ name: '', type: 'string', description: '' }]);
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([{}]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const tagsPlaceholder = useMemo(
    () => (tags.trim().length ? tags : 'etiqueta1, etiqueta2, etiqueta3'),
    [tags],
  );

  const mutation = useMutation({
    mutationFn: datasetsAPI.createManual,
    onSuccess: (dataset) => {
      navigate(`/datasets/${dataset.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const addColumn = () => {
    setColumns((prev) => [...prev, { name: '', type: 'string', description: '' }]);
  };

  const removeColumn = (index: number) => {
    setColumns((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      const nextColumns = prev.filter((_, i) => i !== index);
      setDataRows((rows) =>
        rows.map((row) => {
          const updated = { ...row };
          const columnName = prev[index].name;
          if (columnName) {
            delete updated[columnName];
          }
          return updated;
        }),
      );
      return nextColumns;
    });
  };

  const updateColumn = (index: number, field: keyof ColumnForm, value: string) => {
    setColumns((prev) => {
      const next = [...prev];
      const current = next[index];
      const previousName = current.name;

      next[index] = { ...current, [field]: value };

      if (field === 'name' && previousName !== value) {
        setDataRows((rows) =>
          rows.map((row) => {
            if (!(previousName in row)) {
              return row;
            }
            const updated = { ...row };
            updated[value] = updated[previousName];
            delete updated[previousName];
            return updated;
          }),
        );
      }

      return next;
    });
  };

  const addRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      if (!col.name) {
        return;
      }
      if (col.type === 'number') {
        newRow[col.name] = 0;
      } else if (col.type === 'boolean') {
        newRow[col.name] = false;
      } else {
        newRow[col.name] = '';
      }
    });
    setDataRows((prev) => [...prev, newRow]);
  };

  const removeRow = (index: number) => {
    setDataRows((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateCell = (rowIndex: number, columnName: string, value: any) => {
    setDataRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [columnName]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!datasetName.trim()) {
      setError('El nombre del dataset es obligatorio');
      return;
    }

    if (columns.some((col) => !col.name.trim())) {
      setError('Todas las columnas deben tener nombre');
      return;
    }

    if (dataRows.length === 0) {
      setError('Debe agregar al menos una fila de datos');
      return;
    }

    const manualColumns: ManualColumn[] = columns.map((col) => ({
      name: col.name.trim(),
      type: col.type,
      description: col.description.trim() || undefined,
    }));

    const input: CreateManualDatasetInput = {
      name: datasetName.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      columns: manualColumns,
      data: dataRows,
    };

    mutation.mutate(input);
  };

  const applyTemplate = (templateId: string) => {
    const template = DATASET_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setSelectedTemplate(templateId);
    setDatasetName(template.name);
    setDescription(template.description);
    setTags(template.tags.join(', '));
    setColumns(
      template.columns.map((col) => ({
        name: col.name,
        type: col.type,
        description: col.description,
      })),
    );

    if (template.sampleRows?.length) {
      setDataRows(template.sampleRows.map((row) => ({ ...row })));
      return;
    }

    const row: Record<string, any> = {};
    template.columns.forEach((col) => {
      if (col.type === 'number') {
        row[col.name] = 0;
      } else if (col.type === 'boolean') {
        row[col.name] = false;
      } else {
        row[col.name] = '';
      }
    });
    setDataRows([row]);
  };

  return (
    <div className="manual-dataset-page">
      <div className="manual-dataset-layout">
        <div className="manual-dataset-header">
          <h1>Crear Dataset Manual</h1>
          <p>Define las columnas, carga datos de ejemplo y estandariza tu catálogo.</p>
        </div>

        <section className="manual-dataset-templates-section">
          <header className="manual-dataset-templates-section__header">
            <h2>Plantillas rápidas</h2>
            <p>Elige uno de los tres modelos recomendados y precarga todo con un clic.</p>
          </header>
          <div className="manual-dataset-templates-grid">
            {DATASET_TEMPLATES.map((template) => {
              const isActive = selectedTemplate === template.id;
              return (
                <article
                  key={template.id}
                  className={`manual-dataset-template ${isActive ? 'is-active' : ''}`}
                >
                  <div className="manual-dataset-template__body">
                    <div className="manual-dataset-template__heading">
                      <h3>{template.name}</h3>
                      <span>{template.tags.join('  ')}</span>
                    </div>
                    <p>{template.description}</p>
                    <ul className="manual-dataset-template__fields">
                      {template.columns.map((column) => (
                        <li key={`${template.id}-${column.name}`}>
                          <div className="manual-dataset-template__field-copy">
                            <span className="manual-dataset-template__field-name">{formatColumnLabel(column.name)}</span>
                            <span className="manual-dataset-template__field-meta">{COLUMN_TYPE_LABELS[column.type]}</span>
                          </div>
                          <p className="manual-dataset-template__field-description">{column.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    type="button"
                    variant="custom"
                    size="sm"
                    className="manual-dataset-btn manual-dataset-btn--outline"
                    onClick={() => applyTemplate(template.id)}
                  >
                    {isActive ? 'Plantilla activa' : 'Aplicar plantilla'}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="manual-dataset-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-section form-section--metadata">
            <div className="section-header">
              <h2>Información del Dataset</h2>
            </div>
            <div className="metadata-grid">
              <div className="form-group">
                <label htmlFor="name">Nombre *</label>
                <input
                  id="name"
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="Mi Dataset Manual"
                  required
                />
              </div>

              <div className="form-group form-group--full">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción opcional del dataset"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Etiquetas</label>
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={tagsPlaceholder}
                />
              </div>
            </div>
          </div>
          <div className="form-section">
            <div className="section-header">
              <h2>Columnas</h2>
              <Button
                type="button"
                onClick={addColumn}
                variant="custom"
                size="sm"
                className="manual-dataset-btn manual-dataset-btn--outline"
              >
                Agregar Columna
              </Button>
            </div>

            {columns.map((column, index) => (
              <div key={index} className="column-row">
                <input
                  type="text"
                  placeholder="Nombre de columna"
                  value={column.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  required
                />
                <select
                  value={column.type}
                  onChange={(e) => updateColumn(index, 'type', e.target.value as ColumnForm['type'])}
                >
                  <option value="string">Texto libre</option>
                  <option value="number">Valor numérico</option>
                  <option value="boolean">Sí / No</option>
                  <option value="date">Fecha</option>
                </select>
                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={column.description}
                  onChange={(e) => updateColumn(index, 'description', e.target.value)}
                />
                {columns.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeColumn(index)}
                    variant="danger"
                    size="sm"
                    className="manual-dataset-btn manual-dataset-btn--danger"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2>Datos</h2>
              <Button
                type="button"
                onClick={addRow}
                variant="custom"
                size="sm"
                className="manual-dataset-btn manual-dataset-btn--outline"
              >
                Agregar Fila
              </Button>
            </div>

            <div className="data-table-wrapper">
              <div className="data-table">
                <div className="table-header">
                  {columns.map((col, index) => (
                    col.name && (
                      <div key={index} className="table-cell header-cell">
                        <div className="manual-dataset-header-cell">
                          <span>{formatColumnLabel(col.name)}</span>
                          <span className="manual-dataset-header-cell__hint">{COLUMN_TYPE_LABELS[col.type]}</span>
                        </div>
                      </div>
                    )
                  ))}
                  <div className="table-cell header-cell manual-dataset-actions-header">Acciones</div>
                </div>

                {dataRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="table-row">
                    {columns.map((col, colIndex) => (
                      col.name && (
                        <div key={colIndex} className="table-cell">
                          {col.type === 'boolean' ? (
                            <button
                              type="button"
                              className={`manual-dataset-boolean-toggle ${row[col.name] ? 'is-true' : 'is-false'}`}
                              onClick={() => {
                                const current = Boolean(row[col.name]);
                                updateCell(rowIndex, col.name, !current);
                              }}
                              aria-label={`Alternar ${col.name}`}
                            >
                              <span aria-hidden>{row[col.name] ? '' : ''}</span>
                              <span>{row[col.name] ? 'Sí' : 'No'}</span>
                            </button>
                          ) : (
                            <input
                              type={
                                col.type === 'number'
                                  ? 'number'
                                  : col.type === 'date'
                                    ? 'date'
                                    : 'text'
                              }
                              value={row[col.name] ?? (col.type === 'number' ? 0 : '')}
                              onChange={(e) => {
                                const value =
                                  col.type === 'number'
                                    ? e.target.value
                                      ? Number(e.target.value)
                                      : ''
                                    : e.target.value;
                                updateCell(rowIndex, col.name, value);
                              }}
                              placeholder={`Valor ${col.type}`}
                            />
                          )}
                        </div>
                      )
                    ))}
                    {dataRows.length > 1 && (
                      <div className="table-cell manual-dataset-actions-cell">
                        <Button
                          type="button"
                          onClick={() => removeRow(rowIndex)}
                          variant="danger"
                          size="sm"
                          className="manual-dataset-btn manual-dataset-btn--danger"
                        >
                          <span aria-hidden></span>
                          <span>Eliminar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              onClick={() => navigate('/datasets')}
              variant="custom"
              size="sm"
              className="manual-dataset-btn manual-dataset-btn--outline"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              variant="custom"
              size="sm"
              className="manual-dataset-btn manual-dataset-btn--primary"
            >
              {mutation.isPending ? 'Creando...' : 'Crear Dataset'}
            </Button>
          </div>
        </form>

        <section className="manual-dataset-sidebar-card manual-dataset-checklist">
          <header className="manual-dataset-sidebar-card__header">
            <h2>Checklist de calidad</h2>
            <p>Garantiza consistencia antes de publicar el dataset.</p>
          </header>
          <ul className="manual-dataset-tips">
            {DATASET_TIPS.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
