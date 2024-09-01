import express from 'express';
import fetch from 'node-fetch';
import querystring from 'querystring';
import axios from 'axios';

const app = express();
const PORT = 3000;

const clientId = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your Spotify Client ID
const clientSecret = 'YOUR_SPOTIFY_CLIENT_SECRET'; // Replace with your Spotify Client Secret
const redirectUri = 'http://localhost:3000/callback'; // Your Redirect URI

app.get('/login', (req, res) => {
  const scopes = 'user-read-playback-state user-read-currently-playing';
  const authorizeURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authorizeURL);
});

app.get('/lyrics', async (req, res) => {
  const accessToken = req.query.access_token || null;
  const currentlyPlayingURL = 'https://api.spotify.com/v1/me/player/currently-playing';

  try {
    // Fetch currently playing track data from Spotify
    const trackResponse = await fetch(currentlyPlayingURL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const trackData = await trackResponse.json();
    const trackName = trackData.item.name;
    const artistName = trackData.item.artists[0].name;

    // Fetch song lyrics from Genius API
    const geniusApiKey = 'YOUR_GENIUS_API_KEY'; // Replace with your Genius API key
    const geniusSearchUrl = `https://api.genius.com/search?q=${encodeURIComponent(trackName + ' ' + artistName)}`;

    const geniusResponse = await axios.get(geniusSearchUrl, {
      headers: {
        'Authorization': `Bearer ${geniusApiKey}`
      }
    });

    const hits = geniusResponse.data.response.hits;
    let lyricsUrl = '';

    if (hits.length > 0) {
      lyricsUrl = hits[0].result.url; // Genius URL for the lyrics page
    }

    res.send(`
      <h1>Currently Playing Track</h1>
      <p>Track: ${trackName}</p>
      <p>Artist: ${artistName}</p>
      ${lyricsUrl ? `<p><a href="${lyricsUrl}" target="_blank">View Lyrics on Genius</a></p>` : '<p>Lyrics not found.</p>'}
    `);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.send('Error fetching data.');
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
