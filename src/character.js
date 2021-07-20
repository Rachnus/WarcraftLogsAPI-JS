var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');
var Cache = require('./cache');

/**
 * @param name        - Character ingame name to query
 * @param server      - Name of the realm (firemaw, gehennas etc...)
 * @param region      - Region of player (eu, na, etc...)
 */
 class QueryCharacter
 {
     constructor(name, server, region)
     {
         this.m_szName         = name;
         this.m_szServer       = server;
         this.m_szRegion       = region;
     }
 }

/**
 * Get all character info
 * 
 * @param playerQueries - Array of QueryCharacter
 * @param forceUpdate   - Should the query be forced? Even if the result is cached?
 * @returns             - Promise
 */
function GetCharacter(playerQueries, forceUpdate = false)
{
    var queryCount = playerQueries.length;
    // check cache
    var existingCharacters = [];
    if(!forceUpdate)
    {
        for(var i = playerQueries.length-1; i >= 0; --i)
        {
            var char = Cache.DynamicCache.GetCharacter(playerQueries[i].m_szName, playerQueries[i].m_szServer, playerQueries[i].m_szRegion);
            if(char != null)
            {
                // remove existing characters from the list of names, to grab minimal info
                if(!char.NeedsUpdate())
                {
                    playerQueries.splice(i, 1);
                    existingCharacters.push(char.m_Data);
                }
            }
        }
    }
    

    var promise = new Promise((resolve, reject) =>
    {
        // if all characters are already cached
        if(existingCharacters.length >= queryCount)
        {
            resolve(existingCharacters);
            return promise;
        }

        var body = `{characterData{`

        for(var i = 0; i < playerQueries.length; i++)
        {
            body += `C${i}:character(name: "${playerQueries[i].m_szName}", serverSlug: "${playerQueries[i].m_szServer}", serverRegion: "${playerQueries[i].m_szRegion}")
                    {
                        classID
                        canonicalID
                        faction
                        {
                            id,
                            name
                        }
                        hidden
                        id
                        level
                        name
                        server
                        {
                            id
                            name
                            region
                            {
                                id
                                name
                                compactName
                            }
                        }
                    }`;
        }

        body += `}}`;

        Axios(
        {
            url: APIKey.WARCRAFTLOGS_URL,
            method: 'post',
            headers:
            {
                'Authorization': `Bearer ${APIKey.WARCRAFTLOGS_ACCESS_TOKEN}`,
            },
            data: {
            query: body
            }
        }).then((result) => 
        {
            if(result.data == null)
            {
                resolve(null);
                return promise;
            }

            if(result.data.errors != null)
            {
                console.log(result.data.errors);
                resolve(null);
                return promise;
            }

            if(result.data.data.characterData == null)
            {
                console.log("GetParses(): CharacterData was null");
                resolve(null);
                return promise;
            }

            // copy the existing elements to the results
            var characterList = existingCharacters.slice();
            for(var i = 0; i < playerQueries.length; i++)
            {
                // Cache null values aswell, so we dont keep grabbing invalid gibberish
                var charData = result.data.data.characterData[`C${i}`];
                var character = Types.WCLOGSCharacter.FromJSON(charData);
                Cache.DynamicCache.CacheCharacter(character, playerQueries[i], body);
                characterList.push(character);
            }
            resolve(characterList);
        });
    });

    return promise;
}

/**
 * Get all character info (Cached)
 * 
 * NOTE: GetCachedX functions are unreliable and should only be used when caching was guaranteed previously
 * 
 * @param playerQuery   - QueryCharacter
 * @returns             - WCLOGSCharacter
 */
 function GetCachedCharacter(playerQuery)
 {
     return Cache.DynamicCache.GetCharacter(playerQuery.m_szName, playerQuery.m_szServer, playerQuery.m_szRegion).m_Data;
 }

module.exports =
{
    GetCharacter,
    GetCachedCharacter,

    QueryCharacter,
}