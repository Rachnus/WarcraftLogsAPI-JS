var ClientOAuth2 = require('client-oauth2');

var APIKey = require('./apikey');
var Types = require('./src/types');
var Settings = require('./src/settings.js');

var Rankings = require('./src/rankings');
var Classes = require('./src/classes');
var Character = require('./src/character');
var Zones = require('./src/zones');

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
        var oathObj = oath2==null?APIKey.GetToken():oath2;
        oathObj.credentials.getToken().then(async (user) =>
        {
            APIKey.SetToken(user['accessToken']);
            if(APIKey.GetToken() != null)
            {
                console.log(`${Settings} Warcraftlogs authorization successful`);
                await Classes.LoadClassData();
                console.log(`${Settings} Warcraftlogs class data loaded`);
                await Zones.LoadZoneData();
                console.log(`${Settings} Warcraftlogs zone data loaded`);
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
    Zones,
};