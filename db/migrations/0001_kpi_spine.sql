-- OS-K1: additive history, scoped to the deployment's server-bound venture.
-- Rollback disables consumers; never drop/rewrite these append-only records.
PRAGMA foreign_keys = ON;

CREATE TABLE os_kpi_definitions (
  venture_id TEXT NOT NULL,
  kpi_key TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  unit TEXT NOT NULL CHECK (length(unit) > 0),
  category TEXT NOT NULL,
  better_is_lower INTEGER NOT NULL CHECK (better_is_lower IN (0, 1)),
  definition_json TEXT NOT NULL CHECK (
    json_valid(definition_json)
    AND json_extract(definition_json, '$.contract') IS 'kpi-definition/v1'
    AND json_extract(definition_json, '$.kpi_key') IS kpi_key
    AND json_extract(definition_json, '$.version') IS version
    AND json_extract(definition_json, '$.unit') IS unit
    AND json_extract(definition_json, '$.category') IS category
    AND json_extract(definition_json, '$.better_is_lower') IS better_is_lower
  ),
  PRIMARY KEY (venture_id, kpi_key, version)
);

CREATE TABLE os_kpi_observations (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  venture_id TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  kpi_key TEXT NOT NULL,
  definition_version INTEGER NOT NULL,
  value REAL,
  missing_reason TEXT,
  source_ref TEXT NOT NULL CHECK (length(source_ref) > 0),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL CHECK (period_end > period_start),
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (venture_id, observation_id),
  FOREIGN KEY (venture_id, kpi_key, definition_version)
    REFERENCES os_kpi_definitions (venture_id, kpi_key, version),
  CHECK ((value IS NULL AND missing_reason IS NOT NULL AND length(missing_reason) > 0)
    OR (value IS NOT NULL AND missing_reason IS NULL))
);
CREATE INDEX os_kpi_latest ON os_kpi_observations
  (venture_id, kpi_key, definition_version, period_end DESC, sequence DESC);

CREATE TRIGGER os_kpi_meaning BEFORE INSERT ON os_kpi_definitions
WHEN EXISTS (SELECT 1 FROM os_kpi_definitions d
  WHERE d.venture_id = NEW.venture_id AND d.kpi_key = NEW.kpi_key
    AND (d.unit <> NEW.unit OR d.category <> NEW.category OR d.better_is_lower <> NEW.better_is_lower))
BEGIN SELECT RAISE(ABORT, 'definition_meaning_changed'); END;

CREATE TRIGGER os_kpi_definition_no_update BEFORE UPDATE ON os_kpi_definitions
BEGIN SELECT RAISE(ABORT, 'KPI definitions are append-only'); END;
CREATE TRIGGER os_kpi_definition_no_delete BEFORE DELETE ON os_kpi_definitions
BEGIN SELECT RAISE(ABORT, 'KPI definitions are append-only'); END;
CREATE TRIGGER os_kpi_observation_no_update BEFORE UPDATE ON os_kpi_observations
BEGIN SELECT RAISE(ABORT, 'KPI observations are append-only'); END;
CREATE TRIGGER os_kpi_observation_no_delete BEFORE DELETE ON os_kpi_observations
BEGIN SELECT RAISE(ABORT, 'KPI observations are append-only'); END;

-- REPLACE deletes rows without DELETE triggers when recursive_triggers is off.
-- Prevent replacement at INSERT rather than relying on a connection-level pragma.
CREATE TRIGGER os_kpi_definition_no_replace BEFORE INSERT ON os_kpi_definitions
WHEN EXISTS (SELECT 1 FROM os_kpi_definitions d WHERE d.venture_id = NEW.venture_id
  AND d.kpi_key = NEW.kpi_key AND d.version = NEW.version)
BEGIN SELECT RAISE(ABORT, 'KPI definitions are append-only'); END;
CREATE TRIGGER os_kpi_observation_no_replace BEFORE INSERT ON os_kpi_observations
WHEN EXISTS (SELECT 1 FROM os_kpi_observations o WHERE o.venture_id = NEW.venture_id
  AND o.observation_id = NEW.observation_id)
BEGIN SELECT RAISE(ABORT, 'KPI observations are append-only'); END;
