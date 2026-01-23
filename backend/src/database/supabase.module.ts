import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT, SUPABASE_DATA_CLIENT } from './supabase.constants';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: SUPABASE_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService): SupabaseClient => {
                const url = configService.get<string>('supabase.url');
                const serviceRoleKey = configService.get<string>('supabase.serviceRoleKey');

                if (!url || !serviceRoleKey) {
                    throw new Error('Primary Supabase credentials are not configured');
                }

                return createClient(url, serviceRoleKey, {
                    auth: {
                        persistSession: false,
                    },
                });
            },
        },
        {
            provide: SUPABASE_DATA_CLIENT,
            inject: [ConfigService],
            useFactory: (configService: ConfigService): SupabaseClient => {
                const primaryUrl = configService.get<string>('supabase.url');
                const primaryServiceRoleKey = configService.get<string>('supabase.serviceRoleKey');
                const dataUrl = configService.get<string>('supabase.datasets.url') ?? primaryUrl;
                const dataServiceRoleKey =
                    configService.get<string>('supabase.datasets.serviceRoleKey') ?? primaryServiceRoleKey;

                if (!dataUrl || !dataServiceRoleKey) {
                    throw new Error('Datasets Supabase credentials are not configured');
                }

                return createClient(dataUrl, dataServiceRoleKey, {
                    auth: {
                        persistSession: false,
                    },
                });
            },
        },
    ],
    exports: [SUPABASE_CLIENT, SUPABASE_DATA_CLIENT],
})
export class SupabaseModule { }
