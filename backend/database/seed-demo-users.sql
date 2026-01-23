
create extension if not exists pgcrypto;

insert into
    public.users (
        email,
        name,
        role,
        password_hash
    )
values (
        'demo.user@datapulse.local',
        'Demo Usuario',
        'user',
        crypt (
            'DemoUser123!',
            gen_salt ('bf', 12)
        )
    ),
    (
        'demo.admin@datapulse.local',
        'Demo Administrador',
        'admin',
        crypt (
            'DemoAdmin123!',
            gen_salt ('bf', 12)
        )
    ),
    (
        'demo.superadmin@datapulse.local',
        'Demo Superadmin',
        'superadmin',
        crypt (
            'DemoRoot123!',
            gen_salt ('bf', 12)
        )
    ) on conflict (email) do nothing;