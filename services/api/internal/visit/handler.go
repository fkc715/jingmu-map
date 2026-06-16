package visit

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
	items, err := h.repo.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list visits failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateVisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if req.TheatreID == "" || req.Title == "" || req.VisitedAt == "" {
		writeError(w, http.StatusBadRequest, "theatreId, title and visitedAt are required")
		return
	}
	item, err := h.repo.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "create visit failed")
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "visit not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get visit failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	var req UpdateVisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	item, err := h.repo.Update(r.Context(), r.PathValue("id"), req)
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "visit not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update visit failed")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.Delete(r.Context(), r.PathValue("id")); errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, "visit not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "delete visit failed")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.Stats(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get stats failed")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
