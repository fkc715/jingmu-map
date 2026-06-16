package upload

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/jingmu-map/services/api/internal/visit"
)

type Handler struct {
	repo      *visit.Repository
	uploadDir string
}

func NewHandler(repo *visit.Repository, uploadDir string) *Handler {
	return &Handler{repo: repo, uploadDir: uploadDir}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "invalid multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if !isAllowedImage(contentType, header.Filename) {
		writeError(w, http.StatusBadRequest, "only jpg, jpeg, png and webp images are supported")
		return
	}

	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "create upload directory failed")
		return
	}

	id := visit.NewID("upload")
	ext := strings.ToLower(filepath.Ext(header.Filename))
	storageKey := id + ext
	targetPath := filepath.Join(h.uploadDir, storageKey)
	target, err := os.Create(targetPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "save upload failed")
		return
	}
	defer target.Close()

	size, err := io.Copy(target, file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "write upload failed")
		return
	}

	// Files are stored locally for phase-one verification. Later this can be replaced by object storage.
	item, err := h.repo.CreateUpload(r.Context(), visit.Upload{
		ID:          id,
		VisitID:     r.FormValue("visitId"),
		TheatreID:   r.FormValue("theatreId"),
		FileName:    header.Filename,
		ContentType: contentType,
		SizeBytes:   size,
		StorageKey:  storageKey,
		PublicURL:   "/uploads/" + storageKey,
		Status:      "ready",
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "record upload failed")
		return
	}

	writeJSON(w, http.StatusCreated, item)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	item, err := h.repo.GetUpload(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusNotFound, "upload not found")
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func isAllowedImage(contentType, filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return false
	}
	return strings.HasPrefix(contentType, "image/")
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
