package http

import (
	"net/http"

	"github.com/jingmu-map/services/api/internal/calendar"
	"github.com/jingmu-map/services/api/internal/theatre"
	"github.com/jingmu-map/services/api/internal/upload"
	"github.com/jingmu-map/services/api/internal/visit"
)

func NewRouter(theatreRepo *theatre.Repository, visitRepo *visit.Repository, calendarRepo *calendar.Repository, uploadDir string) http.Handler {
	mux := http.NewServeMux()
	theatreHandler := theatre.NewHandler(theatreRepo)
	visitHandler := visit.NewHandler(visitRepo)
	uploadHandler := upload.NewHandler(visitRepo, uploadDir)
	calendarHandler := calendar.NewHandler(calendarRepo)

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("GET /api/v1/theatres", theatreHandler.List)
	mux.HandleFunc("GET /api/v1/theatres/{id}", theatreHandler.Get)
	mux.HandleFunc("PATCH /api/v1/theatres/{id}/profile", planned("用户自定义剧院条目接口已预留：首次登录读取默认资料，修改后保存个人覆盖内容。"))
	mux.HandleFunc("DELETE /api/v1/theatres/{id}/profile", planned("重置个人剧院条目接口已预留：删除个人覆盖后恢复默认资料和默认图片。"))

	mux.HandleFunc("GET /api/v1/visits", visitHandler.List)
	mux.HandleFunc("POST /api/v1/visits", visitHandler.Create)
	mux.HandleFunc("GET /api/v1/visits/{id}", visitHandler.Get)
	mux.HandleFunc("PATCH /api/v1/visits/{id}", visitHandler.Update)
	mux.HandleFunc("DELETE /api/v1/visits/{id}", visitHandler.Delete)
	mux.HandleFunc("GET /api/v1/visit-stats", visitHandler.Stats)

	mux.HandleFunc("GET /api/v1/theatres/{id}/state", planned("剧院个人状态接口已预留：收藏、待去、去过次数。"))
	mux.HandleFunc("PATCH /api/v1/theatres/{id}/state", planned("剧院个人状态更新接口已预留：favorite、wantToGo、visitedCount、note。"))

	mux.HandleFunc("POST /api/v1/uploads", uploadHandler.Create)
	mux.HandleFunc("GET /api/v1/uploads/{id}", uploadHandler.Get)

	mux.HandleFunc("GET /api/v1/calendar", calendarHandler.Month)
	mux.HandleFunc("GET /api/v1/calendar/days/{date}", calendarHandler.Day)
	mux.HandleFunc("PATCH /api/v1/calendar/days/{date}", calendarHandler.UpdateDay)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	return cors(mux)
}

func planned(message string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writePlanned(w, message)
	}
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
