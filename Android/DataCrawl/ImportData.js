const mysql = require("mysql2/promise");
const fs = require("fs");

const dbConfig = {
    host: "localhost",
    user: "root",  
    password: "123456",
    database: "movie_booking_db"
};

const movies = JSON.parse(fs.readFileSync("Movies.json", "utf-8"));

async function main() {
    const conn = await mysql.createConnection(dbConfig);

    for (const movie of movies) {
        try {
            // ===== MOVIE =====
            await conn.execute(
                `INSERT INTO movies (title, description, poster_url, backdrop_url, release_date)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                [
                    movie.title,
                    movie.description,
                    movie.poster_url,
                    movie.backdrop_url,
                    movie.release_date
                ]
            );

            const [movieIdRes] = await conn.execute(
                `SELECT LAST_INSERT_ID() as id`
            );
            const movieId = movieIdRes[0].id;

            // ===== GENRES =====
            if (movie.genres) {
                for (const g of movie.genres) {

                    await conn.execute(
                        `INSERT INTO genres (name)
                         VALUES (?)
                         ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                        [g]
                    );

                    const [genreIdRes] = await conn.execute(
                        `SELECT LAST_INSERT_ID() as id`
                    );
                    const genreId = genreIdRes[0].id;

                    await conn.execute(
                        `INSERT IGNORE INTO movie_genres (movie_id, genre_id)
                         VALUES (?, ?)`,
                        [movieId, genreId]
                    );
                }
            }

            // ===== CAST =====
            if (movie.cast) {
                for (const c of movie.cast) {

                    await conn.execute(
                        `INSERT INTO casts (name, profile_url)
                         VALUES (?, ?)`,
                        [c.name, c.profile_url]
                    );

                    const [castIdRes] = await conn.execute(
                        `SELECT LAST_INSERT_ID() as id`
                    );
                    const castId = castIdRes[0].id;

                    await conn.execute(
                        `INSERT IGNORE INTO movie_casts (movie_id, cast_id, character_name)
                         VALUES (?, ?, ?)`,
                        [movieId, castId, c.character]
                    );
                }
            }

            console.log(`✅ ${movie.title}`);

        } catch (err) {
            console.error(`❌ ${movie.title}:`, err.message);
        }
    }

    await conn.end();
    console.log("🎉 IMPORT DONE");
}

main();