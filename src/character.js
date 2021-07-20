var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');
var Cache = require('./cache');

/**
 * Get all character info
 * 
 * @param names       - Array of names to get data for
 * @param server      - Server name
 * @param region      - Region of player (eu, na, etc...)
 * @returns           - Promise
 */
function GetCharacter(names, server, region)
{
    var newNames = names.slice();
    // check cache
    var existingCharacters = [];
    for(var i = 0; i < names.length; i++)
    {
        var char = Cache.DynamicCache.GetCharacter(names[i]);
        if(char != null)
        {
            // remove existing characters from the list of names, to grab minimal info
            if(!char.NeedsUpdate())
            {
                newNames.splice(newNames.indexOf(names[i]), 1);
                existingCharacters.push(char.m_Data);
            }
        }
    }

    var promise = new Promise((resolve, reject) =>
    {
        // if all characters are already cached
        if(existingCharacters.length >= names.length)
        {
            resolve(existingCharacters);
            return promise;
        }

        console.log(`exist: ${existingCharacters.length}`);

        var body = `{characterData{`

        for(var i = 0; i < newNames.length; i++)
        {
            body += `C${i}:character(name: "${newNames[i]}", serverSlug: "${server}", serverRegion: "${region}")
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
            for(var i = 0; i < newNames.length; i++)
            {
                var charData = result.data.data.characterData[`C${i}`];
                if(charData == null)
                    continue;
                
                var character = Types.WCLOGSCharacter.FromJSON(charData);
                Cache.DynamicCache.CacheCharacter(character, body);
                characterList.push(character);
            }
            resolve(characterList);
        });
    });

    return promise;
}

module.exports =
{
    GetCharacter,
}