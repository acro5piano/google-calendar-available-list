const fs = require('fs')
const util = require('util')
const readline = require('readline')
const { google } = require('googleapis')

const readFile = util.promisify(fs.readFile)

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const TOKEN_PATH = 'token.json'

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

  // Check if we have previously stored a token.
  try {
    const token = await readFile(TOKEN_PATH)
    oAuth2Client.setCredentials(JSON.parse(token))
    return oAuth2Client
  } catch (e) {
    return getAccessToken(oAuth2Client)
  }
}

async function getAccessToken(oAuth2Client) {
  return new Promise(resolve => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    })
    console.log('Authorize this app by visiting this url:', authUrl)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question('Enter the code from that page here: ', code => {
      rl.close()
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err)
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
          if (err) console.error(err)
          console.log('Token stored to', TOKEN_PATH)
          resolve(oAuth2Client)
        })
      })
    })
  })
}

/**
 * @return {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function getClient() {
  // Load client secrets from a local file.
  try {
    const credentials = await readFile('credentials.json')
    return authorize(JSON.parse(credentials))
  } catch (e) {
    console.error('Error loading client secret file:', e)
    process.exit(1)
  }
}

module.exports = getClient
