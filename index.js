process.traceDeprecation = true;
// Require Express
require('dotenv').config();
const express = require('express');
// Require Google
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
// const res = require('express/lib/response');

//
// EXPRESS
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

// Data to get
const dataToGet = {
  participants: {
    names: '',
    giftTypes: '',
    giftsOk: '',
    blocked: '',
  },
  dataStatus: 'not ready'
};

// GET FROM SPREADSHEET
app.get('/api', (request, response) => {
  const participants = dataToGet.participants;

  if (participants.names && participants.giftTypes && participants.giftsOk) {
    dataToGet.dataStatus = 'ready';
  }
  else {
    response.end();
  }
  // Response data should be populated by grabParticipants.
  response.json(dataToGet);
});

// Data to send
const dataToSend = {
  customData: {
    value: []
  },
  participants: {
    value: []
  },
  // use to determine if all mandatory data is present as condition
  status: 'not ready'
};

// POST TO SPREADSHEET
app.post('/api', (request, response) => {
  const dataObject = request.body;

  dataToSend.customData.value = dataObject.customData;
  dataToSend.participants.value = dataObject.participants;

  fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), postParticipantData);
  });
  // A receipt.
  response.json(request.body);
});

//
// GOOGLE
//

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), grabParticipants);
});

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';


//
// FUNCTIONS
//


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
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
    const participants = dataToGet.participants;
    const sheets = google.sheets({ version: 'v4', auth });
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
      range: 'TEST!A1:B2',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['A1', 'B1'], ['A2', 'B2']] }
    }, (err, res) => {
      if (err) console.log(err);
      const response = JSON.stringify(res, null, 2);
      console.log('PUTTING RES:', response);
    });
    sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet1,
      range: 'TEST!TestNamedRange',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [['C1'], ['C2'], ['C3'], ['C4']] }
    }, (err, res) => {
      if (err) console.log(err);
      const response = JSON.stringify(res, null, 2);
      console.log('PUTTING RES:', response);
    });

    sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheet1,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: updtBatchDE
      },
    }, (err, res) => {
      if (err) console.log(err);
      const response = JSON.stringify(res, null, 2);
      console.log('PUTTING RES:', response);
    });
}

function postParticipantData(auth) {
  const customData = dataToSend.customData;
  const participantData = dataToSend.participants;
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheet1,
    range: 'TEST!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: customData.value }
  }, (err, res) => {
    if (err) console.log(err);
    const response = JSON.stringify(res, null, 2);
    console.log('PUTTING RES:', response);
  });

  sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheet1,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: participantData.value
    },
  }, (err, res) => {
    if (err) console.log(err);
    const response = JSON.stringify(res, null, 2);
    console.log('PUTTING RES:', response);
  });
}

// Values that share a single array represent a row
// Each array represents a column stack. DE = cols D and E
const updtBatchDE = [
  {
  'range': 'TEST!D:D',
  'majorDimension': 'ROWS',
  'values': [['D1'], ['D2'], ['D3'], ['D4']]
  },
  {
    'range': 'TEST!E:E',
    'majorDimension': 'ROWS',
    'values': [['E1'], ['E2'], ['E3'], ['E4']]
  }
];