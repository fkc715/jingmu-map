package visit

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

var ErrNotFound = errors.New("visit not found")

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func NewID(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}

func normalizeRating(value string) string {
	// Rating uses text placeholders for now. Replace these strings with emoji assets in the UI later if desired.
	switch value {
	case "好", "一般", "不好":
		return value
	default:
		return "一般"
	}
}

func normalizeStatus(value string) string {
	switch value {
	case "todo", "complete":
		return value
	default:
		return "complete"
	}
}

func (r *Repository) Create(ctx context.Context, req CreateVisitRequest) (Visit, error) {
	id := NewID("visit")
	_, err := r.db.ExecContext(ctx, `
INSERT INTO visits (id, theatre_id, title, visited_at, seat, rating, note, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, id, req.TheatreID, req.Title, req.VisitedAt, req.Seat, normalizeRating(req.Rating), req.Note, normalizeStatus(req.Status))
	if err != nil {
		return Visit{}, err
	}
	if err := r.RefreshTheatreVisitCount(ctx, req.TheatreID); err != nil {
		return Visit{}, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id string, req UpdateVisitRequest) (Visit, error) {
	current, err := r.Get(ctx, id)
	if err != nil {
		return Visit{}, err
	}

	theatreID := current.TheatreID
	title := current.Title
	visitedAt := current.VisitedAt
	seat := current.Seat
	rating := current.Rating
	note := current.Note
	status := current.Status
	if req.TheatreID != nil {
		theatreID = *req.TheatreID
	}
	if req.Title != nil {
		title = *req.Title
	}
	if req.VisitedAt != nil {
		visitedAt = *req.VisitedAt
	}
	if req.Seat != nil {
		seat = *req.Seat
	}
	if req.Rating != nil {
		rating = normalizeRating(*req.Rating)
	}
	if req.Note != nil {
		note = *req.Note
	}
	if req.Status != nil {
		status = normalizeStatus(*req.Status)
	}

	_, err = r.db.ExecContext(ctx, `
UPDATE visits
SET theatre_id = ?, title = ?, visited_at = ?, seat = ?, rating = ?, note = ?, status = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`, theatreID, title, visitedAt, seat, rating, note, status, id)
	if err != nil {
		return Visit{}, err
	}
	if current.TheatreID != theatreID {
		if err := r.RefreshTheatreVisitCount(ctx, current.TheatreID); err != nil {
			return Visit{}, err
		}
	}
	if err := r.RefreshTheatreVisitCount(ctx, theatreID); err != nil {
		return Visit{}, err
	}
	return r.Get(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	current, err := r.Get(ctx, id)
	if err != nil {
		return err
	}
	if _, err := r.db.ExecContext(ctx, `DELETE FROM visits WHERE id = ?`, id); err != nil {
		return err
	}
	return r.RefreshTheatreVisitCount(ctx, current.TheatreID)
}

func (r *Repository) List(ctx context.Context) ([]Visit, error) {
	rows, err := r.db.QueryContext(ctx, `
SELECT v.id, v.theatre_id, t.name, v.title, v.visited_at, v.seat, v.rating, v.note, v.status, v.created_at, v.updated_at
FROM visits v
JOIN theatres t ON t.id = v.theatre_id
ORDER BY v.visited_at DESC, v.created_at DESC
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []Visit{}
	for rows.Next() {
		item, err := scanVisit(rows)
		if err != nil {
			return nil, err
		}
		item.Uploads, err = r.ListUploadsForVisit(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) ListByDate(ctx context.Context, date string) ([]Visit, error) {
	rows, err := r.db.QueryContext(ctx, `
SELECT v.id, v.theatre_id, t.name, v.title, v.visited_at, v.seat, v.rating, v.note, v.status, v.created_at, v.updated_at
FROM visits v
JOIN theatres t ON t.id = v.theatre_id
WHERE v.visited_at = ?
ORDER BY v.created_at DESC
`, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []Visit{}
	for rows.Next() {
		item, err := scanVisit(rows)
		if err != nil {
			return nil, err
		}
		item.Uploads, err = r.ListUploadsForVisit(ctx, item.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Get(ctx context.Context, id string) (Visit, error) {
	row := r.db.QueryRowContext(ctx, `
SELECT v.id, v.theatre_id, t.name, v.title, v.visited_at, v.seat, v.rating, v.note, v.status, v.created_at, v.updated_at
FROM visits v
JOIN theatres t ON t.id = v.theatre_id
WHERE v.id = ?
`, id)
	item, err := scanVisit(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Visit{}, ErrNotFound
	}
	if err != nil {
		return Visit{}, err
	}
	item.Uploads, err = r.ListUploadsForVisit(ctx, item.ID)
	return item, err
}

func (r *Repository) CreateUpload(ctx context.Context, item Upload) (Upload, error) {
	_, err := r.db.ExecContext(ctx, `
INSERT INTO uploads (id, visit_id, theatre_id, file_name, content_type, size_bytes, storage_key, public_url, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`, item.ID, nullable(item.VisitID), nullable(item.TheatreID), item.FileName, item.ContentType, item.SizeBytes, item.StorageKey, item.PublicURL, item.Status)
	if err != nil {
		return Upload{}, err
	}
	return r.GetUpload(ctx, item.ID)
}

func (r *Repository) GetUpload(ctx context.Context, id string) (Upload, error) {
	row := r.db.QueryRowContext(ctx, `
SELECT id, COALESCE(visit_id, ''), COALESCE(theatre_id, ''), file_name, content_type, size_bytes, storage_key, public_url, status, created_at
FROM uploads
WHERE id = ?
`, id)
	var item Upload
	err := row.Scan(&item.ID, &item.VisitID, &item.TheatreID, &item.FileName, &item.ContentType, &item.SizeBytes, &item.StorageKey, &item.PublicURL, &item.Status, &item.CreatedAt)
	return item, err
}

func (r *Repository) ListUploadsForVisit(ctx context.Context, visitID string) ([]Upload, error) {
	rows, err := r.db.QueryContext(ctx, `
SELECT id, COALESCE(visit_id, ''), COALESCE(theatre_id, ''), file_name, content_type, size_bytes, storage_key, public_url, status, created_at
FROM uploads
WHERE visit_id = ?
ORDER BY created_at DESC
`, visitID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []Upload{}
	for rows.Next() {
		var item Upload
		if err := rows.Scan(&item.ID, &item.VisitID, &item.TheatreID, &item.FileName, &item.ContentType, &item.SizeBytes, &item.StorageKey, &item.PublicURL, &item.Status, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *Repository) Stats(ctx context.Context) (Stats, error) {
	stats := Stats{TheatreVisitCount: map[string]int{}}
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM visits`).Scan(&stats.TotalRecords); err != nil {
		return stats, err
	}
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(DISTINCT theatre_id) FROM visits`).Scan(&stats.LinkedTheatres); err != nil {
		return stats, err
	}
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM visits WHERE status = 'todo'`).Scan(&stats.TodoRecords); err != nil {
		return stats, err
	}
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM uploads WHERE visit_id IS NOT NULL`).Scan(&stats.UploadedImages); err != nil {
		return stats, err
	}

	rows, err := r.db.QueryContext(ctx, `SELECT theatre_id, COUNT(*) FROM visits GROUP BY theatre_id`)
	if err != nil {
		return stats, err
	}
	defer rows.Close()
	for rows.Next() {
		var theatreID string
		var count int
		if err := rows.Scan(&theatreID, &count); err != nil {
			return stats, err
		}
		stats.TheatreVisitCount[theatreID] = count
	}
	return stats, rows.Err()
}

func (r *Repository) RefreshTheatreVisitCount(ctx context.Context, theatreID string) error {
	if theatreID == "" {
		return nil
	}
	// Theatre state is still single-user local data. Later login can add user_id to this table.
	_, err := r.db.ExecContext(ctx, `
INSERT INTO theatre_states (theatre_id, visited_count, updated_at)
SELECT ?, COUNT(*), CURRENT_TIMESTAMP FROM visits WHERE theatre_id = ?
ON CONFLICT(theatre_id) DO UPDATE SET
	visited_count = excluded.visited_count,
	updated_at = CURRENT_TIMESTAMP
`, theatreID, theatreID)
	return err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanVisit(s rowScanner) (Visit, error) {
	var item Visit
	err := s.Scan(&item.ID, &item.TheatreID, &item.TheatreName, &item.Title, &item.VisitedAt, &item.Seat, &item.Rating, &item.Note, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	return item, err
}

func nullable(value string) any {
	if value == "" {
		return nil
	}
	return value
}
