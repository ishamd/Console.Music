/**
 * This is a basic node.js script that performs
 * the Client Credentials oAuth2 flow to authenticate against
 * the Spotify Accounts.
 */

const request = require('request'); // "Request" library
const express = require('express');
const knex = require('../knex');
const router = express.Router();

const client_id = '893c3223efb24f6098017c1a11cfecd0'; // Provided by spotfiy
const client_secret = '10c5354ab52548ef80f37c5612eb0c5f'; // Provided by spotfiy

// Info needed to request authorization from spotify

const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    Authorization: `Basic ${new Buffer(`${client_id}:${client_secret}`).toString('base64')}`
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

/* Gets the authorization token and makes data request based off form input. */
router.post('/track', (req, res, next) => {
  const trackURI = req.body.track;
  const newLanguage = req.body.language;
  const newComment = req.body.comment;

  // Turn this into a function to accomodate other types of input
  const trackID = trackURI.substr(14);
  console.log(trackID);

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // use the access token to access the Spotify Web API
      const token = body.access_token;
      const options = {
        url: `https://api.spotify.com/v1/tracks/${trackID}`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        json: true
      };
      request.get(options, (error, response, body) => {
        // insert data to db via knex_migrations
        // res.redirect() to main library page
        knex('posts')
        .insert({
          type: body.type,
          title: body.name,
          artist: body.artists[0].name,
          language: newLanguage,
          comment: newComment,
          image_url: body.album.images[0].url
        })
        .then(() => {
          // res.send(body);
          res.redirect('/library');
        });
        // console.log(body.type);
        // console.log(body.name);
        // console.log(body.artists[0].name);
        // console.log(language);
        // console.log(comment);
        // console.log(body.album.images[0].url);
      });
    }
  });
});

// GET request for all books from our database
router.get('/library', (_req, res, next) => {
  knex('posts')
  .then((posts) => {
    res.render('library', {
      posts
    });
  })
  .catch((err) => {
    next(err);
  });
});

module.exports = router;
