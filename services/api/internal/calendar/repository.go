package calendar

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jingmu-map/services/api/internal/visit"
)

type Repository struct {
	db     *sql.DB
	visits *visit.Repository
}

func NewRepository(db *sql.DB, visits *visit.Repository) *Repository {
	return &Repository{db: db, visits: visits}
}

func (r *Repository) Month(ctx context.Context, month string) (MonthResponse, error) {
	start, err := time.Parse("2006-01", month)
	if err != nil {
		return MonthResponse{}, err
	}
	end := start.AddDate(0, 1, 0)

	days := []DayResponse{}
	for day := start; day.Before(end); day = day.AddDate(0, 0, 1) {
		item, err := r.Day(ctx, day.Format("2006-01-02"))
		if err != nil {
			return MonthResponse{}, err
		}
		days = append(days, item)
	}
	return MonthResponse{Month: month, Days: days}, nil
}

func (r *Repository) Day(ctx context.Context, date string) (DayResponse, error) {
	visits, err := r.visits.ListByDate(ctx, date)
	if err != nil {
		return DayResponse{}, err
	}
	profile, err := r.getProfile(ctx, date)
	if err != nil {
		return DayResponse{}, err
	}

	coverURL := profile.CoverURL
	source := "custom"
	if coverURL == "" {
		source = "visit"
		coverURL = firstVisitCover(visits)
	}
	if coverURL == "" {
		source = "empty"
	}
	return DayResponse{
		Date:          date,
		CoverURL:      coverURL,
		Description:   profile.Description,
		ProfileSource: source,
		Visits:        visits,
	}, nil
}

func (r *Repository) UpdateDay(ctx context.Context, date string, req UpdateDayRequest) (DayResponse, error) {
	current, err := r.getProfile(ctx, date)
	if err != nil {
		return DayResponse{}, err
	}
	coverUploadID := current.CoverUploadID
	coverURL := current.CoverURL
	description := current.Description
	if req.CoverUploadID != nil {
		coverUploadID = *req.CoverUploadID
	}
	if req.CoverURL != nil {
		coverURL = *req.CoverURL
	}
	if req.Description != nil {
		description = *req.Description
	}

	_, err = r.db.ExecContext(ctx, `
INSERT INTO calendar_days (date, cover_upload_id, cover_url, description, updated_at)
VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(date) DO UPDATE SET
	cover_upload_id = excluded.cover_upload_id,
	cover_url = excluded.cover_url,
	description = excluded.description,
	updated_at = CURRENT_TIMESTAMP
`, date, nullable(coverUploadID), coverURL, description)
	if err != nil {
		return DayResponse{}, err
	}
	return r.Day(ctx, date)
}

func (r *Repository) getProfile(ctx context.Context, date string) (DayProfile, error) {
	row := r.db.QueryRowContext(ctx, `
SELECT date, COALESCE(cover_upload_id, ''), cover_url, description, updated_at
FROM calendar_days
WHERE date = ?
`, date)
	var item DayProfile
	err := row.Scan(&item.Date, &item.CoverUploadID, &item.CoverURL, &item.Description, &item.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return DayProfile{Date: date}, nil
	}
	return item, err
}

func firstVisitCover(items []visit.Visit) string {
	for _, item := range items {
		if len(item.Uploads) > 0 {
			return item.Uploads[0].PublicURL
		}
	}
	return ""
}

func nullable(value string) any {
	if value == "" {
		return nil
	}
	return value
}
