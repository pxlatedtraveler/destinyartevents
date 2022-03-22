process.traceDeprecation = true;
//Require Express
require('dotenv').config();
const express = require('express');
//Require Google
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const res = require('express/lib/response');

//
//EXPRESS
//

const app = express();
const port = process.env.PORT || 3000;
const spreadsheet1 = process.env.SPREADSHEET1;
const nameRange = process.env.NAMERANGE;
const giftTypeRange = process.env.GIFTTYPERANGE;
const giftsOkRange = process.env.GIFTSOKRANGE;
const blockedRange = process.env.BLOCKEDRANGE;

app.listen(port || 3000, () => {
  console.log('listening at', port);
  app.emit('serverready');
});
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

// Data to send
const dataToSend = {
  participants: {
    names: '',
    giftTypes: '',
    giftsOk: '',
    blocked: '',
  },
  dataStatus: 'not ready'
};

app.post('/api', (request, response) => {
  // Requested data
  console.log(request.body);

  const participants = dataToSend.participants;

  if (participants.names && participants.giftTypes && participants.giftsOk) {
    dataToSend.dataStatus = 'ready';
  }
  else {
    response.end();
  }

  // Response data should be populated by grabParticipants.
  response.json(dataToSend);
})

//
//GOOGLE
//

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), grabParticipants);
});

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';


//////////////////////////////////////////////////
//FUNCTIONS
//////////////////////////////////////////////////


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function grabParticipants(auth) {
    const participants = dataToSend.participants;
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet1,
      range: nameRange,
    }, (err, res) => {
      if (err) console.log(err);
      const names = res.data.values;
      participants.names = names;
      console.log(names);
    });
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet1,
      range: giftTypeRange,
    }, (err, res) => {
      if (err) console.log(err);
      const giftTypes = res.data.values;
      participants.giftTypes = giftTypes;
    });
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet1,
      range: giftsOkRange,
    }, (err, res) => {
      if (err) console.log(err);
      const giftsOk = res.data.values;
      participants.giftsOk = giftsOk;
    });
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet1,
      range: blockedRange,
    }, (err, res) => {
      if (err) console.log(err);
      const blocked = res.data.values;
      participants.blocked = blocked;
    });

    sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet1,
      range: 'TEST!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {values: [['just a test!']]}
    }, (err, res) => {
      if (err) console.log(err);
      const response = JSON.stringify(res, null, 2);
      console.log('PUTTING RES:', response);
    })
}

