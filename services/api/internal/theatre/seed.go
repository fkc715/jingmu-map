package theatre

import (
	"context"
	"encoding/json"
	"os"
)

func SeedIfEmpty(ctx context.Context, repo *Repository, path string) error {
	count, err := repo.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	var seed Seed
	if err := json.NewDecoder(file).Decode(&seed); err != nil {
		return err
	}

	for _, item := range seed.Theatres {
		if err := repo.Upsert(ctx, item); err != nil {
			return err
		}
	}
	return nil
}
