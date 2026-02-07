-- Creates the Keycloak database on first Postgres initialization.
-- Runs automatically because /docker-entrypoint-initdb.d is mounted.
-- If the postgres_data volume already exists, remove it (docker compose down -v) so this script runs.

CREATE DATABASE keycloak OWNER postgres;
