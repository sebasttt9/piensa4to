import { DatasetAnalysis } from './interfaces/dataset-analysis.interface';
export declare class AnalysisService {
    analyse(rows: Record<string, unknown>[]): DatasetAnalysis;
    private extractColumns;
    private buildColumnStats;
    private buildNumericSummary;
    private buildDateSummary;
    private buildCategoricalSummary;
    private buildChartSuggestions;
}
