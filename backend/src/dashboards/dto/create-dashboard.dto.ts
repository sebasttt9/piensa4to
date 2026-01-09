import {
  IsArray,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  datasetIds?: string[];
}
