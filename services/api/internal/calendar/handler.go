package calendar

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Month(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		month = "2026-06"
	}
	item, err := h.repo.Month(r.Context(), month)
	if err != nil {
		writeError(w, http.StatusBadRequest, "month must use YYYY-MM")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) Day(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.Day(r.Context(), r.PathValue("date"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "date must use YYYY-MM-DD")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) UpdateDay(w http.ResponseWriter, r *http.Request) {
	var req UpdateDayRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	item, err := h.repo.UpdateDay(r.Context(), r.PathValue("date"), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update calendar day failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
