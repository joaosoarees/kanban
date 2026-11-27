SELECT pg_sleep(20) WHERE current_database() NOT LIKE 'prisma_migrate_shadow_db%';
