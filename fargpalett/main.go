package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

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
	router.Handle("/{stream}/swatches", handlers.LoggingHandler(loggerOut, CORS(Preflight()))).Methods("OPTIONS")
	router.Handle("/{stream}/swatches", handlers.LoggingHandler(loggerOut, CORS(postSwatch(db, hub)))).Methods("POST")
	router.Handle("/{stream}/swatches", handlers.LoggingHandler(loggerOut, CORS(getStream(db)))).Methods("GET")
	router.PathPrefix("/").Handler(fs)

	server := &http.Server{
		Addr:    *port,
		Handler: router,
	}

	log.Println("Listen and serve on " + *port)
	log.Fatal(server.ListenAndServe())

}

func Preflight() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		next.ServeHTTP(w, r)
	})
}

// Swatch represents the json body of a new color swatch
type Swatch struct {
	Colors []string `json:"colors"`
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
