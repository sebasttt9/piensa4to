import { useState } from 'react';
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

export function ManualDatasetPage() {
  const navigate = useNavigate();
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [columns, setColumns] = useState<ColumnForm[]>([{ name: '', type: 'string', description: '' }]);
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([{}]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: datasetsAPI.createManual,
    onSuccess: (dataset) => {
      navigate(`/datasets/${dataset.id}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'string', description: '' }]);
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
      // Remove column from all data rows
      setDataRows(dataRows.map(row => {
        const newRow = { ...row };
        delete newRow[columns[index].name];
        return newRow;
      }));
    }
  };

  const updateColumn = (index: number, field: keyof ColumnForm, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);

    // Update data rows if column name changed
    if (field === 'name') {
      setDataRows(dataRows.map(row => {
        const newRow = { ...row };
        if (columns[index].name in newRow) {
          newRow[value] = newRow[columns[index].name];
          delete newRow[columns[index].name];
        }
        return newRow;
      }));
    }
  };

  const addRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      if (col.name) {
        newRow[col.name] = '';
      }
    });
    setDataRows([...dataRows, newRow]);
  };

  const removeRow = (index: number) => {
    if (dataRows.length > 1) {
      setDataRows(dataRows.filter((_, i) => i !== index));
    }
  };

  const updateCell = (rowIndex: number, columnName: string, value: any) => {
    const newDataRows = [...dataRows];
    newDataRows[rowIndex] = { ...newDataRows[rowIndex], [columnName]: value };
    setDataRows(newDataRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!datasetName.trim()) {
      setError('El nombre del dataset es obligatorio');
      return;
    }

    if (columns.some(col => !col.name.trim())) {
      setError('Todas las columnas deben tener nombre');
      return;
    }

    if (dataRows.length === 0) {
      setError('Debe agregar al menos una fila de datos');
      return;
    }

    const manualColumns: ManualColumn[] = columns.map(col => ({
      name: col.name.trim(),
      type: col.type,
      description: col.description.trim() || undefined,
    }));

    const input: CreateManualDatasetInput = {
      name: datasetName.trim(),
      description: description.trim() || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      columns: manualColumns,
      data: dataRows,
    };

    mutation.mutate(input);
  };

  return (
    <div className="manual-dataset-page">
      <div className="manual-dataset-header">
        <h1>Crear Dataset Manual</h1>
        <p>Define las columnas y agrega los datos manualmente</p>
      </div>

      <form onSubmit={handleSubmit} className="manual-dataset-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-section">
          <h2>Información del Dataset</h2>
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

          <div className="form-group">
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
              placeholder="etiqueta1, etiqueta2, etiqueta3"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Columnas</h2>
            <Button type="button" onClick={addColumn} variant="secondary">
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
                onChange={(e) => updateColumn(index, 'type', e.target.value as any)}
              >
                <option value="string">Texto</option>
                <option value="number">Número</option>
                <option value="boolean">Booleano</option>
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
            <Button type="button" onClick={addRow} variant="secondary">
              Agregar Fila
            </Button>
          </div>

          <div className="data-table">
            <div className="table-header">
              {columns.map((col, index) => (
                col.name && <div key={index} className="table-cell header-cell">{col.name}</div>
              ))}
              <div className="table-cell header-cell">Acciones</div>
            </div>

            {dataRows.map((row, rowIndex) => (
              <div key={rowIndex} className="table-row">
                {columns.map((col, colIndex) => (
                  col.name && (
                    <div key={colIndex} className="table-cell">
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={row[col.name] || ''}
                        onChange={(e) => {
                          const value = col.type === 'number'
                            ? (e.target.value ? Number(e.target.value) : '')
                            : col.type === 'boolean'
                            ? e.target.value.toLowerCase() === 'true'
                            : e.target.value;
                          updateCell(rowIndex, col.name, value);
                        }}
                        placeholder={`Valor ${col.type}`}
                      />
                    </div>
                  )
                ))}
                {dataRows.length > 1 && (
                  <div className="table-cell">
                    <Button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      variant="danger"
                      size="sm"
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Button
            type="button"
            onClick={() => navigate('/datasets')}
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Creando...' : 'Crear Dataset'}
          </Button>
        </div>
      </form>
    </div>
  );
}