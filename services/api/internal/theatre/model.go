package theatre

type Theatre struct {
	ID                     string     `json:"id"`
	Name                   string     `json:"name"`
	District               string     `json:"district"`
	Address                string     `json:"address"`
	Value                  [2]float64 `json:"value"`
	SourceCoordinateSystem string     `json:"sourceCoordinateSystem"`
	Size                   int        `json:"size"`
	Intro                  string     `json:"intro"`
	Image                  string     `json:"image"`
	Source                 string     `json:"source"`
}

type Seed struct {
	Version          string    `json:"version"`
	CoordinateSystem string    `json:"coordinateSystem"`
	Theatres         []Theatre `json:"theatres"`
}

type ListResponse struct {
	Version          string    `json:"version"`
	CoordinateSystem string    `json:"coordinateSystem"`
	Theatres         []Theatre `json:"theatres"`
}
