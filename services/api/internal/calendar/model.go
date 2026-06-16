package calendar

import "github.com/jingmu-map/services/api/internal/visit"

type DayProfile struct {
	Date          string `json:"date"`
	CoverUploadID string `json:"coverUploadId"`
	CoverURL      string `json:"coverUrl"`
	Description   string `json:"description"`
	UpdatedAt     string `json:"updatedAt"`
}

type DayResponse struct {
	Date          string        `json:"date"`
	CoverURL      string        `json:"coverUrl"`
	Description   string        `json:"description"`
	ProfileSource string        `json:"profileSource"`
	Visits        []visit.Visit `json:"visits"`
}

type MonthResponse struct {
	Month string        `json:"month"`
	Days  []DayResponse `json:"days"`
}

type UpdateDayRequest struct {
	CoverUploadID *string `json:"coverUploadId"`
	CoverURL      *string `json:"coverUrl"`
	Description   *string `json:"description"`
}
