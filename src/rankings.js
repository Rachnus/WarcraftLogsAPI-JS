var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');
var Cache = require('./cache');

/**
 * @param name        - Character ingame name to query
 * @param server      - Name of the realm (firemaw, gehennas etc...)
 * @param region      - Region of player (eu, na, etc...)
 * @param encounterId - ID of encounter // https://wowpedia.fandom.com/wiki/DungeonEncounterID
 * @param options     - options of the search (WCLOGSRankingOptions)
 */
class QueryParse
{
    constructor(name, server, region, encounterId, options = new Types.WCLOGSRankingOptions())
    {
        this.m_szName         = name;
        this.m_szServer       = server;
        this.m_szRegion       = region;
        this.m_iEncounterID   = encounterId;
        this.m_RankingOptions = options;
    }
}

/**
 * @param name        - Character ingame name to query
 * @param server      - Name of the realm (firemaw, gehennas etc...)
 * @param region      - Region of player (eu, na, etc...)
 * @param options     - options of the search (WCLOGSRankingOptions)
 */
class QueryAllstar
{
    constructor(name, server, region, options = new Types.WCLOGSRankingOptions())
    {
        this.m_szName         = name;
        this.m_szServer       = server;
        this.m_szRegion       = region;
        this.m_RankingOptions = options;
    }
}

/**
 * Get all parses of a boss by player/realm/region/encounter id
 * 
 * @param parseQueries - Array of QueryParse
 * @param forceUpdate  - Should the query be forced? Even if the result is cached?
 * @returns            - Promise
 */
function GetParses(parseQueries, forceUpdate = false)
{
    var queryCount = parseQueries.length;

    // check cache
    var existingRankings = [];

    if(!forceUpdate)
    {
        for(var i = parseQueries.length-1; i >= 0; --i)
        {
            var ranking = Cache.DynamicCache.GetEncounterRankings(parseQueries[i].m_szName, parseQueries[i].m_szServer, parseQueries[i].m_szRegion, parseQueries[i].m_iEncounterID, parseQueries[i].m_RankingOptions);
            if(ranking != null)
            {
                // remove existing characters from the list of names, to grab minimal info
                if(!ranking.NeedsUpdate())
                {
                    parseQueries.splice(i, 1);
                    existingRankings.push({index:i, data:ranking.m_Data});  
                }
            }
        }
    }

    var promise = new Promise((resolve, reject) =>
    {
        if(existingRankings.length >= queryCount)
        {
            resolve(existingRankings);
            return promise;
        }

        var body = `{characterData{`

        for(var i = 0; i < parseQueries.length; i++)
        {
            var encRankStr = `encounterRankings(encounterID: ${parseQueries[i].m_iEncounterID}`;

            if(parseQueries[i].m_RankingOptions != null)
            {
                if(parseQueries[i].m_RankingOptions.m_bByBracket != null)            encRankStr+= ', byBracket:'            +parseQueries[i].m_RankingOptions.m_bByBracket;
                if(parseQueries[i].m_RankingOptions.m_Compare != null)               encRankStr+= ', compare:'              +parseQueries[i].m_RankingOptions.m_Compare;
                if(parseQueries[i].m_RankingOptions.m_iDifficulty != null)           encRankStr+= ', difficulty:'           +parseQueries[i].m_RankingOptions.m_iDifficulty;
                if(parseQueries[i].m_RankingOptions.m_bIncludeCombatantInfo != null) encRankStr+= ', includeCombatantInfo:' +parseQueries[i].m_RankingOptions.m_bIncludeCombatantInfo;
                if(parseQueries[i].m_RankingOptions.m_bIncludePrivateLogs != null)   encRankStr+= ', includePrivateLogs:'   +parseQueries[i].m_RankingOptions.m_bIncludePrivateLogs;
                if(parseQueries[i].m_RankingOptions.m_Metric != null)                encRankStr+= ', metric:'               +parseQueries[i].m_RankingOptions.m_Metric;
                if(parseQueries[i].m_RankingOptions.m_iPartition != null)            encRankStr+= ', partition:'            +parseQueries[i].m_RankingOptions.m_iPartition;
                if(parseQueries[i].m_RankingOptions.m_Role != null)                  encRankStr+= ', role:'                 +parseQueries[i].m_RankingOptions.m_Role;
                if(parseQueries[i].m_RankingOptions.m_iSize != null)                 encRankStr+= ', size:'                 +parseQueries[i].m_RankingOptions.m_iSize;
                if(parseQueries[i].m_RankingOptions.m_szSpecName != null)            encRankStr+= ', specName:"'            +parseQueries[i].m_RankingOptions.m_szSpecName+'"';
                if(parseQueries[i].m_RankingOptions.m_TimeFrame != null)             encRankStr+= ', timeframe:'            +parseQueries[i].m_RankingOptions.m_TimeFrame;
            }

            encRankStr += `)`;

            body += `C${i}:character(name: "${parseQueries[i].m_szName}", serverSlug: "${parseQueries[i].m_szServer}", serverRegion: "${parseQueries[i].m_szRegion}")
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

            var encounterRankingsList = [];
            for(var i = 0; i < parseQueries.length; i++)
            {
                // add the existing rankings in correct query order
                var con = false;
                for(var j = 0; j < existingRankings.length; j++)
                {
                    if(i == existingRankings[j].index)
                    {
                        encounterRankingsList.push(existingRankings[j].data);
                        con = true;
                        break;
                    }
                }

                if(con)
                    continue;

                // Cache null values aswell, so we dont keep grabbing invalid gibberish
                var charData = result.data.data.characterData[`C${i}`];
                var encounterRankings = charData==null?null:Types.WCLOGSEncounterRankingResult.FromJSON(charData.encounterRankings);
                var character = Types.WCLOGSCharacter.FromJSON(charData);

                Cache.DynamicCache.CacheEncounterRanking(encounterRankings, character, parseQueries[i], body);
                Cache.DynamicCache.CacheCharacter(character, parseQueries[i], body);

                encounterRankingsList.push(encounterRankings);

            }
            resolve(encounterRankingsList);
        });
    });

    return promise;
}

/**
 * Get all parses of a boss by player/realm/region/encounter id (Cached)
 * 
 * NOTE: GetCachedX functions are unreliable and should only be used when caching was guaranteed previously
 * 
 * @param parseQuery    - QueryParse
 * @returns             - WCLOGSEncounterRankingResult
 */
 function GetCachedParses(parseQuery)
 {
     return Cache.DynamicCache.GetEncounterRankings(parseQuery.m_szName, parseQuery.m_szServer, parseQuery.m_szRegion, parseQuerym_iEncounterID, parseQuery.m_RankingOptions).m_Data;
 }

/**
 * Get players rankings of every encounter, including different specs, also gets overall, region and server ranking
 * 
 * @param allstarQueries - Array of QueryAllstar
 * @param forceUpdate    - Should the query be forced? Even if the result is cached?
 * @returns              - Promise
 */
function GetAllstars(allstarQueries, forceUpdate = false)
{
    var queryCount = allstarQueries.length;
    // check cache
    var existingRankings = [];

    if(!forceUpdate)
    {
        for(var i = allstarQueries.length-1; i >= 0; --i)
        {
            var ranking = Cache.DynamicCache.GetZoneRankings(allstarQueries[i].m_szName, allstarQueries[i].m_szServer, allstarQueries[i].m_szRegion, allstarQueries[i].m_RankingOptions);
            if(ranking != null)
            {
                // remove existing characters from the list of names, to grab minimal info
                if(!ranking.NeedsUpdate())
                {
                    allstarQueries.splice(i, 1);
                    existingRankings.push({index:i, data:ranking.m_Data});  
                }
            }
        }
    }

    var promise = new Promise((resolve, reject) =>
    {
        if(existingRankings.length >= queryCount)
        {
            resolve(existingRankings);
            return promise;
        }

        var body = `{characterData{`

        for(var i = 0; i < allstarQueries.length; i++)
        {
            var zoneRankStr = `zoneRankings`;
            var args = "";

            if(allstarQueries[i].m_RankingOptions != null)
            {
                if(allstarQueries[i].m_RankingOptions.m_bByBracket != null)            args+= 'byBracket:'            +allstarQueries[i].m_RankingOptions.m_bByBracket+', ';
                if(allstarQueries[i].m_RankingOptions.m_Compare != null)               args+= 'compare:'              +allstarQueries[i].m_RankingOptions.m_Compare+', ';
                if(allstarQueries[i].m_RankingOptions.m_iDifficulty != null)           args+= 'difficulty:'           +allstarQueries[i].m_RankingOptions.m_iDifficulty+', ';
                if(allstarQueries[i].m_RankingOptions.m_bIncludePrivateLogs != null)   args+= 'includePrivateLogs:'   +allstarQueries[i].m_RankingOptions.m_bIncludePrivateLogs+', ';
                if(allstarQueries[i].m_RankingOptions.m_Metric != null)                args+= 'metric:'               +allstarQueries[i].m_RankingOptions.m_Metric+', ';
                if(allstarQueries[i].m_RankingOptions.m_iPartition != null)            args+= 'partition:'            +allstarQueries[i].m_RankingOptions.m_iPartition+', ';
                if(allstarQueries[i].m_RankingOptions.m_Role != null)                  args+= 'role:'                 +allstarQueries[i].m_RankingOptions.m_Role+', ';
                if(allstarQueries[i].m_RankingOptions.m_iSize != null)                 args+= 'size:'                 +allstarQueries[i].m_RankingOptions.m_iSize+', ';
                if(allstarQueries[i].m_RankingOptions.m_szSpecName != null)            args+= 'specName:"'            +allstarQueries[i].m_RankingOptions.m_szSpecName+'", ';
                if(allstarQueries[i].m_RankingOptions.m_TimeFrame != null)             args+= 'timeframe:'            +allstarQueries[i].m_RankingOptions.m_TimeFrame+', ';
                if(allstarQueries[i].m_RankingOptions.m_iZoneID != null)               args+= 'zoneID:'               +allstarQueries[i].m_RankingOptions.m_iZoneID+', ';
            }

            if(args.length > 0)
                zoneRankStr += `(${args})`;

            body += `C${i}:character(name: "${allstarQueries[i].m_szName}", serverSlug: "${allstarQueries[i].m_szServer}", serverRegion: "${allstarQueries[i].m_szRegion}")
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

            var zoneRankingsList = [];
            for(var i = 0; i < allstarQueries.length; i++)
            {
                // add the existing rankings in correct query order
                var con = false;
                for(var j = 0; j < existingRankings.length; j++)
                {
                    if(i == existingRankings[j].index)
                    {
                        zoneRankingsList.push(existingRankings[j].data);
                        con = true;
                        break;
                    }
                }

                if(con)
                    continue;

                // Cache null values aswell, so we dont keep grabbing invalid gibberish
                var charData = result.data.data.characterData[`C${i}`];
                var zoneRankings = null;
  
                if(charData != null)
                    zoneRankings = Types.WCLOGSZoneRankingResult.FromJSON(charData.zoneRankings);

                var character = Types.WCLOGSCharacter.FromJSON(charData);

                Cache.DynamicCache.CacheZoneRanking(zoneRankings, character, allstarQueries[i], body);
                Cache.DynamicCache.CacheCharacter(character, allstarQueries[i], body);

                zoneRankingsList.push(zoneRankings);

            }
            resolve(zoneRankingsList);
        });
    });

    return promise;
}

function GetParsesEntries()
{
    return Cache.DynamicCache.s_EncounterRankings.entries();
}

function GetAllstarEntries()
{
    return Cache.DynamicCache.s_ZoneRankings.entries();
}

/**
 * Get players rankings of every encounter, including different specs, also gets overall, region and server ranking
 * 
 * NOTE: GetCachedX functions are unreliable and should only be used when caching was guaranteed previously
 * 
 * @param allstarQuery  - QueryAllstar
 * @returns             - WCLOGSZoneRankingResult
 */
 function GetCachedAllstars(allstarQuery)
 {
     return Cache.DynamicCache.GetZoneRankings(allstarQuery.m_szName, allstarQuery.m_szServer, allstarQuery.m_szRegion, allstarQuery.m_RankingOptions).m_Data;
 }

module.exports =
{
    GetParses,
    GetCachedParses,
    GetParsesEntries,

    GetAllstars,
    GetCachedAllstars,
    GetAllstarEntries,

    QueryParse,
    QueryAllstar,
};