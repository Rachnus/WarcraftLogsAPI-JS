var ClientOAuth2 = require('client-oauth2');

var APIKey = require('./apikey');
var Types = require('./src/types');
var Settings = require('./src/settings.js');

var Rankings = require('./src/rankings');
var Classes = require('./src/classes');
var Character = require('./src/character');

/**
 * Call this before making any API calls
 * 
 * @param oath2        - (optional) client oath object, uses apikey.js options if null is passed
 * @returns null
 */
function InitAPI(oath2)
{
    var promise = new Promise((resolve, reject) =>
    {
        var oathObj = oath2==null?APIKey.WARCRAFTLOGS_AUTH:oath2;
        oathObj.credentials.getToken().then(function (user) 
        {
            APIKey.WARCRAFTLOGS_ACCESS_TOKEN = user['accessToken'];
            if(APIKey.WARCRAFTLOGS_ACCESS_TOKEN != null)
            {
                console.log(`${Settings} Warcraftlogs authorization successful`);
                g_Initialized = true;

                // Load classes
                Classes.LoadClassData().then(() => {
                    console.log(`${Settings} Warcraftlogs class data loaded`);
                })
            }
            else
                Error(`${Settings} Could not authorize to warcraftlogs`);
            resolve();
        });

        
    })
    return promise;
}

module.exports =
{
    InitAPI: InitAPI,

    APIKey,
    Rankings,
    Types,
    Classes,
    Character,
};