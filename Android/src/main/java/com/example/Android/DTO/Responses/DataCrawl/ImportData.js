const mysql = require("mysql2/promise");
const fs = require("fs");

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "12345",
    database: "movie_booking_db"
};

const movies = JSON.parse(fs.readFileSync("Movies.json", "utf-8"));

async function main() {
    const conn = await mysql.createConnection(dbConfig);

    for (const movie of movies) {
        try {
            // ===== MOVIE =====
            const [movieRes] = await conn.execute(
                `INSERT INTO movies (title, description, poster_url, backdrop_url, release_date)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    movie.title,
                    movie.description,
                    movie.poster_url,
                    movie.backdrop_url,
                    movie.release_date
                ]
            );

            const movieId = movieRes.insertId;

            // ===== GENRES =====
            for (const g of movie.genres || []) {

                // insert nếu chưa có
                await conn.execute(
                    `INSERT IGNORE INTO genres (name) VALUES (?)`,
                    [g]
                );

                // lấy id thật
                const [genreRows] = await conn.execute(
                    `SELECT id FROM genres WHERE name = ?`,
                    [g]
                );

                const genreId = genreRows[0].id;

                await conn.execute(
                    `INSERT IGNORE INTO movie_genres (movie_id, genre_id)
                     VALUES (?, ?)`,
                    [movieId, genreId]
                );
            }

            // ===== CAST =====
            for (const c of movie.cast || []) {

                await conn.execute(
                    `INSERT IGNORE INTO casts (name, profile_url)
                     VALUES (?, ?)`,
                    [c.name, c.profile_url]
                );

                const [castRows] = await conn.execute(
                    `SELECT id FROM casts WHERE name = ?`,
                    [c.name]
                );

                const castId = castRows[0].id;

                await conn.execute(
                    `INSERT IGNORE INTO movie_casts (movie_id, cast_id, character_name)
                     VALUES (?, ?, ?)`,
                    [movieId, castId, c.character]
                );
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