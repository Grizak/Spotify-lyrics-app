const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');

const app = express();
const PORT = 3000;

const clientId = 'bfd99c041c524684af9b2c3e8f64f864'; // Replace with your Spotify Client ID
const clientSecret = 'a437f1e0ddfd400cbde8488ea8bb1eb7'; // Replace with your Spotify Client Secret
const redirectUri = 'http://localhost:3000/callback'; // Your Redirect URI

app.get('/login', (req, res) => {
  const scopes = 'user-read-playback-state user-read-currently-playing';
  const authorizeURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authorizeURL);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const tokenURL = 'https://accounts.spotify.com/api/token';

  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch(tokenURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  res.redirect(`/lyrics?access_token=${accessToken}`);
});

app.get('/lyrics', async (req, res) => {
  const accessToken = req.query.access_token || null;
  const currentlyPlayingURL = 'https://api.spotify.com/v1/me/player/currently-playing';

  const trackResponse = await fetch(currentlyPlayingURL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const trackData = await trackResponse.json();
  const trackName = trackData.item.name;
  const artistName = trackData.item.artists[0].name;

  res.send(`
    <h1>Currently Playing Track</h1>
    <p>Track: ${trackName}</p>
    <p>Artist: ${artistName}</p>
    <!-- Add code here to fetch and display lyrics using a lyrics API -->
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
