package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"

	"github.com/frederikgoebel/farg/fargpalett/rt"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

var createColorTable = `
	CREATE TABLE IF NOT EXISTS colors (id INTEGER PRIMARY KEY, color TEXT NOT NULL, swatch_id INTEGER,
  FOREIGN KEY(swatch_id) REFERENCES swatches(id));
	`

var createSwatchTable = `
  	CREATE TABLE IF NOT EXISTS swatches (id INTEGER PRIMARY KEY, stream_id TEXT);
  	`

var insertColor = `
  	INSERT INTO colors ( color, swatch_id) VALUES (?,?);
  	`

var insertSwatch = `
      	INSERT INTO swatches (stream_id) VALUES (?);
      	`

var getSwatchID = `
      	SELECT id FROM swatches WHERE stream_id = ?;
              	`

var getColorsForSwatch = `
      	SELECT color FROM colors WHERE swatch_id = ?;
              	`

func main() {

	var port = flag.String("port", ":8082", "The port used to run the server on.")
	flag.Parse()
	var loggerOut = os.Stdout // TODO replace with writer to file

	db, err := sql.Open("sqlite3", "./fargpalett.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	_, err = db.Exec(createSwatchTable)
	if err != nil {
		panic(err)
	}
	_, err = db.Exec(createColorTable)
	if err != nil {
		panic(err)
	}

	hub := rt.NewHub()
	go hub.Run()

	fs := http.FileServer(http.Dir("./static"))

	router := mux.NewRouter().StrictSlash(false)
	router.Handle("/ws", rt.HandleWebsocket(hub))
	router.Handle("/{stream}/swatches", handlers.LoggingHandler(loggerOut, postSwatch(db, hub))).Methods("POST")
	router.Handle("/{stream}/swatches", handlers.LoggingHandler(loggerOut, getStream(db))).Methods("GET")
	router.PathPrefix("/").Handler(fs)

	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{"http://farg.app", "http://www.farg.app", "http://dev.farg.app", "http://localhost:8080"}) // TOOD localhost should not be set. load from config
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})

	server := &http.Server{
		Addr:    *port,
		Handler: handlers.CORS(originsOk, headersOk, methodsOk)(router),
	}

	log.Println("Listen and serve on " + *port)
	log.Fatal(server.ListenAndServe())

}

// Swatch represents the json body of a new color swatch
type Swatch struct {
	Colors []string `json:"colors"`
}

func isHex(s string) bool {
	isHex, _ := regexp.MatchString("^#(?:[0-9a-fA-F]{3}){1,2}$", s)
	return isHex
}

// /*
// function rgbaToHex(rgb) {
//   if (rgb.indexOf('rgb') == -1) // there might be hex colors already
//     return rgb
//
//   rgb = rgb.substr(5).split(")")[0].split(',');
//
//   let r = (+rgb[0]).toString(16),
//     g = (+rgb[1]).toString(16),
//     b = (+rgb[2]).toString(16);
//
//   if (r.length == 1)
//     r = "0" + r;
// //   if (g.length == 1)
// //     g = "0" + g;
// //   if (b.length == 1)
// //     b = "0" + b;
// //
// //   return "#" + r + g + b;
// // }
// // */
// //
// func rgbaToHex(rgb string) (string, error) {
// 	if len(rgb) < 5 {
// 		return "", errors.New("Not a rgb[a] string")
// 	}
//
// 	var parts []string
// 	if rgb[0:3] == "rgb" {
// 		parts = strings.split(rgb[4:], ",")
// 	} else if rgb[0:4] == "rgba" {
// 		parts = strings.split(rgb[5:], ",")
// 	} else {
// 		return "", errors.New("Not a rgb[a] string")
// 	}
//
// 		r := parts[0]
//
// }

func (s *Swatch) Validate() string {
	if len(s.Colors) != 6 {
		return "Wrong swatch length"
	}
	for _, color := range s.Colors {
		if !isHex(color) {
			return "Not hex"
		}
	}
	return ""
}

func postSwatch(db *sql.DB, hub *rt.Hub) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		streamID := mux.Vars(r)["stream"]
		decoder := json.NewDecoder(r.Body)
		var swatch Swatch
		if err := decoder.Decode(&swatch); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, "Invalid json") // todo proper error handling
			return
		}

		if validation := swatch.Validate(); validation != "" {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, validation)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			log.Println(err)
			return
		}

		res, err := tx.Exec(insertSwatch, streamID)
		if err != nil {
			log.Println(err)
			tx.Rollback()
			return
		}
		swatchID, err := res.LastInsertId()
		if err != nil {
			log.Println(err)
			tx.Rollback()
			return
		}

		for _, color := range swatch.Colors {
			_, err := tx.Exec(insertColor, color, swatchID)
			if err != nil {
				log.Println(err)
				tx.Rollback()
				return
			}
		}

		b, err := json.Marshal(swatch)
		if err != nil {
			log.Print(err)
		}
		hub.Broadcast <- b

		w.WriteHeader(http.StatusCreated)
		tx.Commit()
	})
}

type Stream struct {
	Colors [][]string `json:"colors"`
}

func getStream(db *sql.DB) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		streamID := mux.Vars(r)["stream"]

		tx, err := db.Begin()
		if err != nil {
			log.Println(err)
			return
		}

		swatchRows, err := tx.Query(getSwatchID, streamID)
		if err != nil {
			log.Print(err)
			tx.Rollback()
			return
		}
		var stream Stream
		for swatchRows.Next() {
			var swatchID string
			swatchRows.Scan(&swatchID)
			rows, err := tx.Query(getColorsForSwatch, swatchID)
			if err != nil {
				log.Print(err)
				tx.Rollback()
				return
			}

			var swatch []string
			for rows.Next() {
				var color string
				rows.Scan(&color)
				swatch = append(swatch, color)
			}
			stream.Colors = append(stream.Colors, swatch)
		}
		tx.Commit()

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(stream); err != nil {
			log.Println(err)
			return
		}
	})
}
