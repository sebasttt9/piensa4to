import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateOrganizationDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}