const axios = require("axios");
const fs = require("fs");

const API_KEY = "9a4cfd83006d8f231d23e0927d1d1def";

// ================= GENRE =================
async function getGenreMap() {
    const res = await axios.get(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`
    );

    const map = {};
    res.data.genres.forEach(g => {
        map[g.id] = g.name;
    });

    return map;
}

// ================= CAST =================
async function getCast(movieId) {
    try {
        const res = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`
        );

        return res.data.cast.slice(0, 5).map(c => ({
            name: c.name,
            character: c.character,
            profile_url: c.profile_path
                ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
                : null
        }));

    } catch (err) {
        return [];
    }
}

// ================= MAIN =================
async function crawlMovies() {
    const genreMap = await getGenreMap();

    const res = await axios.get(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`
    );

    const moviesRaw = res.data.results.slice(0, 25);

    const movies = [];

    for (let m of moviesRaw) {
        console.log(`🎬 Crawling: ${m.title}`);

        const cast = await getCast(m.id);

        movies.push({
            title: m.title,
            description: m.overview,
            poster_url: m.poster_path
                ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                : null,
            backdrop_url: m.backdrop_path
                ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}`
                : null,
            release_date: m.release_date,
            genres: m.genre_ids.map(id => genreMap[id]),
            cast: cast
        });
    }

    // save file
    fs.writeFileSync(
        "movies_full.json",
        JSON.stringify(movies, null, 2),
        "utf-8"
    );

    console.log("🎉 DONE → movies_full.json");
}

crawlMovies();