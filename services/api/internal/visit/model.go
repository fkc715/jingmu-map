package visit

type Visit struct {
	ID          string   `json:"id"`
	TheatreID   string   `json:"theatreId"`
	TheatreName string   `json:"theatreName"`
	Title       string   `json:"title"`
	VisitedAt   string   `json:"visitedAt"`
	Seat        string   `json:"seat"`
	Rating      string   `json:"rating"`
	Note        string   `json:"note"`
	Status      string   `json:"status"`
	Uploads     []Upload `json:"uploads"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
}

type Upload struct {
	ID          string `json:"id"`
	VisitID     string `json:"visitId,omitempty"`
	TheatreID   string `json:"theatreId,omitempty"`
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	SizeBytes   int64  `json:"sizeBytes"`
	StorageKey  string `json:"storageKey"`
	PublicURL   string `json:"publicUrl"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
}

type CreateVisitRequest struct {
	TheatreID string `json:"theatreId"`
	Title     string `json:"title"`
	VisitedAt string `json:"visitedAt"`
	Seat      string `json:"seat"`
	Rating    string `json:"rating"`
	Note      string `json:"note"`
	Status    string `json:"status"`
}

type UpdateVisitRequest struct {
	TheatreID *string `json:"theatreId"`
	Title     *string `json:"title"`
	VisitedAt *string `json:"visitedAt"`
	Seat      *string `json:"seat"`
	Rating    *string `json:"rating"`
	Note      *string `json:"note"`
	Status    *string `json:"status"`
}

type Stats struct {
	TotalRecords      int            `json:"totalRecords"`
	LinkedTheatres    int            `json:"linkedTheatres"`
	TodoRecords       int            `json:"todoRecords"`
	UploadedImages    int            `json:"uploadedImages"`
	TheatreVisitCount map[string]int `json:"theatreVisitCount"`
}
