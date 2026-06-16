package theatre

import (
	"encoding/json"
	"errors"
	"net/http"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.List(r.Context(), r.URL.Query().Get("district"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list theatres failed")
		return
	}

	writeJSON(w, http.StatusOK, ListResponse{
		Version:          "db",
		CoordinateSystem: "WGS84",
		Theatres:         items,
	})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "theatre not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get theatre failed")
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
