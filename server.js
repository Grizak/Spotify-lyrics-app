import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import querystring from 'querystring';

const app = express();
const PORT = 3000;

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

const clientId = 'bfd99c041c524684af9b2c3e8f64f864'; // Replace with your Spotify Client ID
const clientSecret = 'a437f1e0ddfd400cbde8488ea8bb1eb7'; // Replace with your Spotify Client Secret
const redirectUri = 'https://zany-robot-rj5wqxvr96r3p96v-3000.app.github.dev/callback'; // Your Redirect URI

app.get('/login', (req, res) => {
  const scopes = 'user-read-playback-state user-read-currently-playing';
  const authorizeURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
      // Redirect to error page if no code is returned
      return res.redirect('/error');
  }

  const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
      }),
      headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
      },
  };

  try {
      // Exchange authorization code for access token
      const response = await axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers });
      const access_token = response.data.access_token;
      const refresh_token = response.data.refresh_token;

      // Redirect to lyrics page after successful authentication
      res.redirect(`/lyrics?access_token=${access_token}`); // Pass the access token to the lyrics page
  } catch (error) {
      console.error('Error fetching access token:', error);
      res.redirect('/error');
  }
});


// Error route
app.get('/error', (req, res) => {
  res.send('An error occurred during authentication. Please try again.');
});

app.get('/lyrics', async (req, res) => {
  const accessToken = req.query.access_token || null;
  const currentlyPlayingURL = 'https://api.spotify.com/v1/me/player/currently-playing';

  if (!accessToken) {
      console.error('Access token missing');
      return res.status(400).json({ error: 'Access token missing' });
  }

  try {
      const trackResponse = await fetch(currentlyPlayingURL, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });

      if (!trackResponse.ok) {
          const errorDetails = await trackResponse.json();
          console.error('Spotify API request failed:', errorDetails);
          throw new Error('Spotify API request failed');
      }

      const trackData = await trackResponse.json();
      const trackName = trackData.item.name;
      const artistName = trackData.item.artists[0].name;

      // Fetch song lyrics from Genius API
      const geniusApiKey = '-Zj6MSRVNFw7KHkDJRLPVX84H1IlQQbmXezss5dplKI4WfKfbxdQB4px4136E-qf'; // Replace with your Genius API key
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

      res.json({
          trackName,
          artistName,
          lyricsHtml: lyricsUrl ? `<p><a href="${lyricsUrl}" target="_blank">View Lyrics on Genius</a></p>` : '<p>Lyrics not found.</p>'
      });
  } catch (error) {
      console.error('Error fetching data:', error.message);
      console.error('Error stack trace:', error.stack);  // Print stack trace for more details
      res.status(500).json({ error: 'Error fetching data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
