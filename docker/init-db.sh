#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Try to create uuid-ossp extension (may fail on Alpine, that's OK)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

# If uuid-ossp extension fails (common on Alpine), create a function alias
# PostgreSQL 13+ has gen_random_uuid() built-in
psql -v ON_ERROR_STOP=0 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid AS \$\$ 
        SELECT gen_random_uuid(); 
    \$\$ LANGUAGE sql;
EOSQL

