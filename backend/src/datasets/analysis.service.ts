import { Injectable } from '@nestjs/common';
import { detectColumnType } from '../common/utils/data-type.util';
import {
  ChartSuggestion,
  ColumnStats,
  DatasetAnalysis,
  NumericSummary,
  DateSummary,
  CategoricalSummary,
} from './interfaces/dataset-analysis.interface';

@Injectable()
export class AnalysisService {
  analyse(rows: Record<string, unknown>[]): DatasetAnalysis {
    const rowCount = rows.length;
    const columns = this.extractColumns(rows);
    const columnStats = columns.map((column) =>
      this.buildColumnStats(column, rows),
    );
    const chartSuggestions = this.buildChartSuggestions(columnStats);

    return { rowCount, columns: columnStats, chartSuggestions };
  }

  private extractColumns(rows: Record<string, unknown>[]): string[] {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
  }

  private buildColumnStats(
    column: string,
    rows: Record<string, unknown>[],
  ): ColumnStats {
    const values = rows.map((row) => row[column]);
    const type = detectColumnType(values);
    const meaningfulValues = values.filter(
      (value) => value !== null && value !== undefined && value !== '',
    );
    const emptyValues = values.length - meaningfulValues.length;
    const sampleValues = meaningfulValues.slice(0, 5);

    const baseStats: ColumnStats = {
      column,
      type,
      emptyValues,
      uniqueValues: new Set(meaningfulValues.map((value) => String(value)))
        .size,
      sampleValues,
    };

    if (type === 'number') {
      baseStats.summary = this.buildNumericSummary(meaningfulValues);
    } else if (type === 'date') {
      baseStats.summary = this.buildDateSummary(meaningfulValues);
    } else {
      baseStats.summary = this.buildCategoricalSummary(meaningfulValues);
    }

    return baseStats;
  }

  private buildNumericSummary(values: unknown[]): NumericSummary {
    const numericValues = values
      .map((value) =>
        typeof value === 'number' ? value : Number(String(value)),
      )
      .filter((value) => Number.isFinite(value));

    const count = numericValues.length;
    if (count === 0) {
      return { min: 0, max: 0, average: 0, sum: 0, count: 0 };
    }

    const sum = numericValues.reduce((acc, value) => acc + value, 0);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    return {
      min,
      max,
      sum,
      count,
      average: sum / count,
    };
  }

  private buildDateSummary(values: unknown[]): DateSummary {
    const dates = values
      .map((value) =>
        value instanceof Date ? value : new Date(String(value)),
      )
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      const now = new Date().toISOString();
      return { start: now, end: now, granularity: 'month' };
    }

    const start = dates[0].toISOString();
    const end = dates[dates.length - 1].toISOString();
    const diffInDays =
      (dates[dates.length - 1].getTime() - dates[0].getTime()) /
      (1000 * 60 * 60 * 24);

    let granularity: DateSummary['granularity'] = 'day';
    if (diffInDays > 365 * 2) {
      granularity = 'year';
    } else if (diffInDays > 180) {
      granularity = 'quarter';
    } else if (diffInDays > 90) {
      granularity = 'month';
    } else if (diffInDays > 30) {
      granularity = 'week';
    }

    return { start, end, granularity };
  }

  private buildCategoricalSummary(values: unknown[]): CategoricalSummary {
    const frequencyMap = new Map<string, number>();

    for (const value of values) {
      const key = String(value);
      frequencyMap.set(key, (frequencyMap.get(key) ?? 0) + 1);
    }

    const topValues = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));

    return { topValues };
  }

  private buildChartSuggestions(columns: ColumnStats[]): ChartSuggestion[] {
    const suggestions: ChartSuggestion[] = [];
    const numericColumns = columns.filter((column) => column.type === 'number');
    const dateColumns = columns.filter((column) => column.type === 'date');
    const categoricalColumns = columns.filter(
      (column) => column.type === 'string',
    );

    // Time series: date + numeric
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      for (const dateCol of dateColumns) {
        for (const numericCol of numericColumns) {
          suggestions.push({
            type: 'line',
            label: `${numericCol.column} por ${dateCol.column}`,
            xAxis: dateCol.column,
            yAxis: numericCol.column,
            description: 'Serie temporal',
          });
        }
      }
    }

    // Category comparison: categorical + numeric
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      for (const catCol of categoricalColumns) {
        for (const numericCol of numericColumns) {
          suggestions.push({
            type: 'bar',
            label: `${numericCol.column} por ${catCol.column}`,
            xAxis: catCol.column,
            yAxis: numericCol.column,
            description: 'Comparación de categorías',
          });
        }
      }
    }

    // Direct comparison: numeric vs numeric
    if (suggestions.length === 0 && numericColumns.length >= 2) {
      suggestions.push({
        type: 'area',
        label: `${numericColumns[0].column} vs ${numericColumns[1].column}`,
        xAxis: numericColumns[0].column,
        yAxis: numericColumns[1].column,
        description: 'Comparación directa',
      });
    }

    // Fallback: table view
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'table',
        label: 'Vista tabular',
        xAxis: 'rows',
        yAxis: columns.map((column) => column.column),
        description: 'Exploración básica',
      });
    }

    return suggestions.slice(0, 10);
  }
}
