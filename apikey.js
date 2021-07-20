var ClientOAuth2 = require('client-oauth2');

const WARCRAFTLOGS_URL          = "https://classic.warcraftlogs.com/api/v2/client";
var   WARCRAFTLOGS_ACCESS_TOKEN = null; // Received from oauth2 request after calling (InitAPI())
var   WARCRAFTLOGS_AUTH         = new ClientOAuth2({
      clientId:         'Client-ID-Here',     // Client ID goes here
      clientSecret:     'Client-Secret-Here', // Client Secret goes here
      accessTokenUri:   'https://classic.warcraftlogs.com/oauth/token',
      authorizationUri: 'https://classic.warcraftlogs.com/oauth/authorize',
      redirectUri:      'http://example.com/auth/github/callback'
})

module.exports =
{
    WARCRAFTLOGS_AUTH,
    WARCRAFTLOGS_URL,
    WARCRAFTLOGS_ACCESS_TOKEN,
};