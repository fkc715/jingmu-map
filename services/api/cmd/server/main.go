package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jingmu-map/services/api/internal/calendar"
	"github.com/jingmu-map/services/api/internal/config"
	"github.com/jingmu-map/services/api/internal/database"
	apihttp "github.com/jingmu-map/services/api/internal/http"
	"github.com/jingmu-map/services/api/internal/theatre"
	"github.com/jingmu-map/services/api/internal/visit"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	theatreRepo := theatre.NewRepository(db)
	if err := theatre.SeedIfEmpty(context.Background(), theatreRepo, cfg.TheatreSeedPath); err != nil {
		log.Fatalf("seed theatres: %v", err)
	}
	visitRepo := visit.NewRepository(db)
	calendarRepo := calendar.NewRepository(db, visitRepo)

	server := &http.Server{
		Addr:              cfg.Addr,
		Handler:           apihttp.NewRouter(theatreRepo, visitRepo, calendarRepo, cfg.UploadDir),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("jingmu api listening on %s", cfg.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen and serve: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("server shutdown: %v", err)
	}
}
