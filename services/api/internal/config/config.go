package config

import "os"

type Config struct {
	Addr            string
	DatabasePath    string
	TheatreSeedPath string
	UploadDir       string
}

func Load() Config {
	return Config{
		Addr:            env("JINGMU_API_ADDR", ":8080"),
		DatabasePath:    env("JINGMU_DATABASE_PATH", "data/jingmu.sqlite"),
		TheatreSeedPath: env("JINGMU_THEATRE_SEED_PATH", "../../data/theatres/beijing-theatres.wgs84.json"),
		UploadDir:       env("JINGMU_UPLOAD_DIR", "data/uploads"),
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
