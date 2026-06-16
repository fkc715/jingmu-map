package http

import (
	"encoding/json"
	"net/http"
)

type errorResponse struct {
	Error string `json:"error"`
}

type plannedResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}

func writePlanned(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusNotImplemented, plannedResponse{
		Error:   "planned_endpoint",
		Message: message,
	})
}
