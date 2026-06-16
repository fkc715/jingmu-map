CREATE TABLE IF NOT EXISTS theatres (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	district TEXT NOT NULL,
	address TEXT NOT NULL,
	lng REAL NOT NULL,
	lat REAL NOT NULL,
	source_coordinate_system TEXT NOT NULL,
	size INTEGER NOT NULL,
	intro TEXT NOT NULL,
	image TEXT NOT NULL DEFAULT '',
	source TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theatres_district ON theatres(district);

CREATE TABLE IF NOT EXISTS user_theatre_profiles (
	user_id TEXT NOT NULL,
	theatre_id TEXT NOT NULL,
	name TEXT,
	district TEXT,
	address TEXT,
	lng REAL,
	lat REAL,
	source_coordinate_system TEXT,
	size INTEGER,
	intro TEXT,
	image TEXT,
	source TEXT NOT NULL DEFAULT 'user override',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, theatre_id),
	FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_theatre_profiles_user_id ON user_theatre_profiles(user_id);

CREATE TABLE IF NOT EXISTS theatre_states (
	theatre_id TEXT PRIMARY KEY,
	visited_count INTEGER NOT NULL DEFAULT 0,
	favorite INTEGER NOT NULL DEFAULT 0,
	want_to_go INTEGER NOT NULL DEFAULT 0,
	note TEXT NOT NULL DEFAULT '',
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visits (
	id TEXT PRIMARY KEY,
	theatre_id TEXT NOT NULL,
	title TEXT NOT NULL,
	visited_at TEXT NOT NULL,
	seat TEXT NOT NULL DEFAULT '',
	rating TEXT NOT NULL DEFAULT '一般',
	note TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'complete',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_visits_theatre_id ON visits(theatre_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);

CREATE TABLE IF NOT EXISTS uploads (
	id TEXT PRIMARY KEY,
	visit_id TEXT,
	theatre_id TEXT,
	file_name TEXT NOT NULL,
	content_type TEXT NOT NULL,
	size_bytes INTEGER NOT NULL,
	storage_key TEXT NOT NULL,
	public_url TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'pending',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
	FOREIGN KEY (theatre_id) REFERENCES theatres(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS calendar_days (
	date TEXT PRIMARY KEY,
	cover_upload_id TEXT,
	cover_url TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (cover_upload_id) REFERENCES uploads(id) ON DELETE SET NULL
);
