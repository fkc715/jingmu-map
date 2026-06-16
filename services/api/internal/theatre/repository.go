package theatre

import (
	"context"
	"database/sql"
	"errors"
)

var ErrNotFound = errors.New("theatre not found")

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM theatres`).Scan(&count)
	return count, err
}

func (r *Repository) Upsert(ctx context.Context, item Theatre) error {
	_, err := r.db.ExecContext(ctx, `
INSERT INTO theatres (
	id, name, district, address, lng, lat, source_coordinate_system, size, intro, image, source, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET
	name = excluded.name,
	district = excluded.district,
	address = excluded.address,
	lng = excluded.lng,
	lat = excluded.lat,
	source_coordinate_system = excluded.source_coordinate_system,
	size = excluded.size,
	intro = excluded.intro,
	image = excluded.image,
	source = excluded.source,
	updated_at = CURRENT_TIMESTAMP
`, item.ID, item.Name, item.District, item.Address, item.Value[0], item.Value[1], item.SourceCoordinateSystem, item.Size, item.Intro, item.Image, item.Source)
	return err
}

func (r *Repository) List(ctx context.Context, district string) ([]Theatre, error) {
	query := `SELECT id, name, district, address, lng, lat, source_coordinate_system, size, intro, image, source FROM theatres`
	args := []any{}
	if district != "" {
		query += ` WHERE district = ?`
		args = append(args, district)
	}
	query += ` ORDER BY district, size DESC, name`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []Theatre{}
	for rows.Next() {
		item, err := scan(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id string) (Theatre, error) {
	row := r.db.QueryRowContext(ctx, `
SELECT id, name, district, address, lng, lat, source_coordinate_system, size, intro, image, source
FROM theatres
WHERE id = ?
`, id)

	item, err := scan(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Theatre{}, ErrNotFound
	}
	return item, err
}

type scanner interface {
	Scan(dest ...any) error
}

func scan(s scanner) (Theatre, error) {
	var item Theatre
	err := s.Scan(
		&item.ID,
		&item.Name,
		&item.District,
		&item.Address,
		&item.Value[0],
		&item.Value[1],
		&item.SourceCoordinateSystem,
		&item.Size,
		&item.Intro,
		&item.Image,
		&item.Source,
	)
	return item, err
}
