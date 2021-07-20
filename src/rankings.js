var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');
var Cache = require('./cache');

/**
 * Get all parses of a boss by player/realm/region/encounter id
 * 
 * @param names       - Array of names to get parses for
 * @param server      - Server name
 * @param region      - Region of player (eu, na, etc...)
 * @param encounterId - ID of encounter // https://wowpedia.fandom.com/wiki/DungeonEncounterID
 * @param options     - options of the search (WCLOGSRankingOptions)
 * @returns           - Promise
 */
function GetParses(names, server, region, encounterId, options = null)
{
    var newNames = names.slice();
    // check cache
    var existingRankings = [];
    for(var i = 0; i < names.length; i++)
    {
        var ranking = Cache.DynamicCache.GetEncounterRankings(names[i], server, region, encounterId);
        if(ranking != null)
        {
            // remove existing characters from the list of names, to grab minimal info
            if(!ranking.NeedsUpdate())
            {
                newNames.splice(newNames.indexOf(names[i]), 1);
                existingRankings.push(ranking);
            }
        }
    }

    var promise = new Promise((resolve, reject) =>
    {
        for(var i = 0; i < names.length; i++)
        {
            // if all characters are already cached
            if(existingRankings.length >= names.length)
            {
                resolve(existingRankings);
                return promise;
            }
        }

        var encRankStr = `encounterRankings(encounterID: ${encounterId}`;

        if(options != null)
        {
            if(options.m_bByBracket != null)            encRankStr+= ', byBracket:'            +options.m_bByBracket;
            if(options.m_Compare != null)               encRankStr+= ', compare:'              +options.m_Compare;
            if(options.m_iDifficulty != null)           encRankStr+= ', difficulty:'           +options.m_iDifficulty;
            if(options.m_bIncludeCombatantInfo != null) encRankStr+= ', includeCombatantInfo:' +options.m_bIncludeCombatantInfo;
            if(options.m_bIncludePrivateLogs != null)   encRankStr+= ', includePrivateLogs:'   +options.m_bIncludePrivateLogs;
            if(options.m_Metric != null)                encRankStr+= ', metric:'               +options.m_Metric;
            if(options.m_iPartition != null)            encRankStr+= ', partition:'            +options.m_iPartition;
            if(options.m_Role != null)                  encRankStr+= ', role:'                 +options.m_Role;
            if(options.m_iSize != null)                 encRankStr+= ', size:'                 +options.m_iSize;
            if(options.m_szSpecName != null)            encRankStr+= ', specName:'             +options.m_szSpecName;
            if(options.m_TimeFrame != null)             encRankStr+= ', timeframe:'            +options.m_TimeFrame;
        }

        encRankStr += `)`;

        var body = `{characterData{`

        for(var i = 0; i < names.length; i++)
        {
            body += `C${i}:character(name: "${names[i]}", serverSlug: "${server}", serverRegion: "${region}")
                    {
                        ${encRankStr}
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

            var encounterRankingsList = existingRankings.slice();
            for(var i = 0; i < names.length; i++)
            {
                var charData = result.data.data.characterData[`C${i}`];
                if(charData == null)
                    continue;

                var encounterRankings = Types.WCLOGSEncounterRankingResult.FromJSON(charData.encounterRankings);
                var character = Types.WCLOGSCharacter.FromJSON(charData);

                Cache.DynamicCache.CacheEncounterRanking(encounterRankings, encounterId, character, body);
                Cache.DynamicCache.CacheCharacter(character, body);

                encounterRankingsList.push(encounterRankings);

            }
            resolve(encounterRankingsList);
        });
    });

    return promise;
}

/**
 * Get players rankings of every encounter, including different specs, also gets overall, region and server ranking
 * 
 * @param names       - Array of names to get allstars for
 * @param server      - Server name
 * @param region      - Region of player (eu, na, etc...)
 * @param options     - options of the search (WCLOGSRankingOptions)
 * @returns           - Promise
 */
function GetAllstars(names, server, region, options = null)
{
    var newNames = names.slice();
    // check cache
    var existingRankings = [];
    for(var i = 0; i < names.length; i++)
    {
        var ranking = Cache.DynamicCache.GetZoneRankings(names[i], server, region);
        if(ranking != null)
        {
            // remove existing characters from the list of names, to grab minimal info
            if(!ranking.NeedsUpdate())
            {
                newNames.splice(newNames.indexOf(names[i]), 1);
                existingRankings.push(ranking);
            }
        }
    }

    var promise = new Promise((resolve, reject) =>
    {
        for(var i = 0; i < names.length; i++)
        {
            // if all characters are already cached
            if(existingRankings.length >= names.length)
            {
                resolve(existingRankings);
                return promise;
            }
        }

        var zoneRankStr = `zoneRankings`;
        var args = "";

        if(options != null)
        {
            if(options.m_bByBracket != null)            args+= 'byBracket:'            +options.m_bByBracket+', ';
            if(options.m_Compare != null)               args+= 'compare:'              +options.m_Compare+', ';
            if(options.m_iDifficulty != null)           args+= 'difficulty:'           +options.m_iDifficulty+', ';
            if(options.m_bIncludePrivateLogs != null)   args+= 'includePrivateLogs:'   +options.m_bIncludePrivateLogs+', ';
            if(options.m_Metric != null)                args+= 'metric:'               +options.m_Metric+', ';
            if(options.m_iPartition != null)            args+= 'partition:'            +options.m_iPartition+', ';
            if(options.m_Role != null)                  args+= 'role:'                 +options.m_Role+', ';
            if(options.m_iSize != null)                 args+= 'size:'                 +options.m_iSize+', ';
            if(options.m_szSpecName != null)            args+= 'specName:'             +options.m_szSpecName+', ';
            if(options.m_TimeFrame != null)             args+= 'timeframe:'            +options.m_TimeFrame+', ';
            if(options.m_iZoneID != null)               args+= 'zoneID:'               +options.m_iZoneID+', ';
        }

        if(args.length > 0)
            zoneRankStr += `(${args})`;

        var body = `{characterData{`

        for(var i = 0; i < names.length; i++)
        {
            body += `C${i}:character(name: "${names[i]}", serverSlug: "${server}", serverRegion: "${region}")
                    {
                        ${zoneRankStr}
                        classID
                        canonicalID
                        faction
                        {
                            id
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
                resolve(null);
                return promise;
            }

            var zoneRankingsList = existingRankings.slice();
            for(var i = 0; i < names.length; i++)
            {
                var charData = result.data.data.characterData[`C${i}`];
                if(charData == null)
                    continue;

                var zoneRankings = Types.WCLOGSZoneRankingResult.FromJSON(charData.zoneRankings);
                var character = Types.WCLOGSCharacter.FromJSON(charData);

                Cache.DynamicCache.CacheZoneRanking(zoneRankings, character, body);
                Cache.DynamicCache.CacheCharacter(character, body);

                zoneRankingsList.push(zoneRankings);

            }
            resolve(zoneRankingsList);
        });
    });

    return promise;
}


module.exports =
{
    GetParses,
    GetAllstars,
};