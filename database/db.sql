CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS location (
    location_id         SERIAL PRIMARY KEY,
    location            GEOGRAPHY(Point, 4326)
);

 CREATE TABLE IF NOT EXISTS destination (
    destination_id  SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES location(location_id),
    name            TEXT NOT NULL UNIQUE,
    label           TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attraction (
    attraction_id       SERIAL PRIMARY KEY,
    attraction_name     TEXT NOT NULL,
    attraction_type     TEXT,
    location_id         INTEGER NOT NULL REFERENCES location(location_id),
    attraction_url      TEXT,
    source_id           UUID UNIQUE
);

CREATE TABLE IF NOT EXISTS attraction_occurrence (
    attraction_id  INTEGER NOT NULL REFERENCES attraction(attraction_id) ON DELETE CASCADE,
    event_date     DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    PRIMARY KEY (attraction_id, event_date, start_time)
);

CREATE TABLE IF NOT EXISTS weather (
    location_id         INTEGER NOT NUll REFERENCES location(location_id) ON DELETE CASCADE,
    weather_date        TIMESTAMPTZ,
    temperature         NUMERIC(4,1),
    rainfall            NUMERIC(4,1) CHECK (rainfall >= 0),
    weather_type        TEXT,
    PRIMARY KEY (location_id, weather_date)
);

CREATE OR REPLACE FUNCTION add_attraction (
    p_source_id UUID,
    p_name  TEXT,
    p_type  TEXT,
    p_url   TEXT,
    p_lat   DOUBLE PRECISION,
    p_lon   DOUBLE PRECISION,
    p_occurrences JSONB DEFAULT '[]'
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_location_id   INTEGER;
    v_attraction_id INTEGER;
    v_point         GEOGRAPHY := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography;
BEGIN
    SELECT attraction_id, location_id
    INTO v_attraction_id, v_location_id
    FROM attraction
    WHERE source_id = p_source_id;

    IF v_attraction_id IS NULL THEN
        INSERT INTO location (location) VALUES (v_point)
        RETURNING location_id INTO v_location_id;

        INSERT INTO attraction (source_id, attraction_name, attraction_type, location_id, attraction_url)
        VALUES (p_source_id, p_name, p_type, v_location_id, p_url)
        RETURNING attraction_id INTO v_attraction_id;
    ELSE
        UPDATE location SET location = v_point WHERE location_id = v_location_id;

        UPDATE attraction 
        SET attraction_name = p_name, attraction_type = p_type, attraction_url = p_url
        WHERE attraction_id = v_attraction_id;

        DELETE FROM attraction_occurrence WHERE attraction_id = v_attraction_id;
    END IF;

    INSERT INTO attraction_occurrence (attraction_id, event_date, start_time, end_time)
    SELECT v_attraction_id, o.event_date, o.start_time, o.end_time
    FROM jsonb_to_recordset(p_occurrences) AS o(event_date DATE, start_time TIME, end_time TIME)
    ON CONFLICT DO NOTHING;

    RETURN v_attraction_id;
END;
$$;