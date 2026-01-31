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
            useFactory: (): SupabaseClient => {
                const dataUrl = 'https://bggsqbvrpenahcppvuyc.supabase.co';
                const dataServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ3NxYnZycGVuYWhjcHB2dXljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0NzI4MiwiZXhwIjoyMDgzMzIzMjgyfQ.j32e8oZwZDSgXOGbVRqnVcqdkGyclPIFTzmy29cb8Hw';

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
