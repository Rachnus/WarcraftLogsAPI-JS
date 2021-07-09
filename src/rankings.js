var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');

/**
 * encounterRankings/zoneRankings
 * 
 * https://classic.warcraftlogs.com/v2-api-docs/warcraft/character.doc.html
 * 
 * @param byBracket            - Whether or not to use bracket rankings
 *                               instead of overall rankings. For WoW, brackets are item levels or keystones. For
 *                               FF, brackets are patches.
 * @param compare              - Whether or not to compare against rankings
 *                               (best scores across the entire tier) or two weeks worth of parses (more
 *                               representative of real-world performance).
 * @param difficulty           - Whether or not to filter the rankings to
 *                               a specific difficulty. If omitted, the highest difficulty is used.
 * @param includeCombatantInfo - (encounterRankings only) Whether or not to include
 *                               detailed combatant info such as gear in the results.
 * @param includePrivateLogs   - Whether or not to include private
 *                               logs in the results. This option is only available if using the user GraphQL
 *                               endpoint.
 * @param metric               - You can filter to a specific character metric
 *                               like dps or hps. If omitted, an appropriate default metric for the zone will be
 *                               chosen.
 * @param partition            - Whether or not to filter the rankings to a
 *                               specific partition. By default, the latest partition is chosen. A special value
 *                               of -1 can be passed to fetch data from all partitions.
 * @param role                 - The slug for a specific role. This allow you to
 *                               only fetch ranks for the healing role, dps role or tank role.
 * @param size                 - Whether or not to filter rankings to a specific
 *                               size. If omitted, the first valid raid size will be used.
 * @param specName             - The slug for a specific spec. Whether or
 *                               not to filter rankings to a specific spec. If omitted, data for all specs will
 *                               be used.
 * @param timeframe            - Whether or not the returned report
 *                               rankings should be compared against today's rankings or historical rankings
 *                               around the time the fight occurred.
 * @param zoneID               - (zoneRaknings only) If not specified, the latest unfrozen zone
 *                               will be used.
 */
class WCLOGSRankingOptions
{
    constructor(byBracket = true,
                compare = null,
                difficulty = null,
                includeCombatantInfo = null,
                includePrivateLogs = null,
                metric = null,
                partition = null,
                role = null,
                size = null,
                specName = null,
                timeframe = null)
    {
        this.m_bByBracket = byBracket;
        this.m_Compare = compare;
        this.m_iDifficulty = difficulty;
        this.m_bIncludeCombatantInfo = includeCombatantInfo;
        this.m_bIncludePrivateLogs = includePrivateLogs;
        this.m_Metric = metric;
        this.m_iPartition = partition;
        this.m_Role = role;
        this.m_iSize = size;
        this.m_szSpecName = specName;
        this.m_TimeFrame = timeframe;
    }
}

class WCLOGSEncounterRankingResult
{
    constructor(bestAmount = true,
                median = null,
                average = null,
                totalKills = null,
                fastestKill = null,
                difficulty = null,
                metric = null,
                partition = null,
                zone = null,
                ranks = null)
    {
        this.m_flBestAmount = bestAmount;
        this.m_flMedianPerformance = median;
        this.m_flAveragePerformance = average;
        this.m_iTotalKills = totalKills;
        this.m_iFastestKill = fastestKill;
        this.m_iDifficulty = difficulty;
        this.m_szMetric = metric;
        this.m_iPartition = partition;
        this.m_iZone = zone;
        this.m_Ranks = ranks;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;
            
        var result = new WCLOGSEncounterRankingResult();

        result.m_flBestAmount          = json["bestAmount"];
        result.m_flMedianPerformance   = json["medianPerformance"];
        result.m_flAveragePerformance  = json["averagePerformance"];
        result.m_iTotalKills           = json["totalKills"];
        result.m_iFastestKill          = json["fastestKill"];
        result.m_iDifficulty           = json["difficulty"];
        result.m_szMetric              = json["metric"];
        result.m_iPartition            = json["partition"];
        result.m_iZone                 = json["zone"];

        var ranks = json["ranks"];
        if(ranks != null)
        {
            result.m_Ranks = [];
            ranks.forEach(function(rank) {
                result.m_Ranks.push(WCLOGSEncounterParse.FromJSON(rank));
            });
        }
        return result;
    }
}

class WCLOGSEncounterParse
{
    constructor(lockedIn = null,
                rankPercent = null,
                historicalPercent = null,
                todayPercent = null,
                rankTotalParses = null,
                historicalTotalParses = null,
                todayTotalParses = null,
                guild = null,
                report = null, // TODO: Implement WCLOGSReport
                duration = null,
                startTime = null,
                amount = null,
                bracketData = null,
                spec = null,
                bestSpec = null,
                faction = null)
    {
        this.m_bLockedIn = lockedIn;
        this.m_flRankPercent = rankPercent;
        this.m_flHistoricalPercent = historicalPercent;
        this.m_flTodayPercent = todayPercent;
        this.m_iRankTotalParses = rankTotalParses;
        this.m_iHistoricalTotalParses = historicalTotalParses;
        this.m_iTodayTotalParses = todayTotalParses;
        this.m_Guild = guild;
        this.m_Report = report;
        this.m_iDuration = duration;
        this.m_iStartTime = startTime;
        this.m_flAmount = amount;
        this.m_iBracketData = bracketData;
        this.m_szSpec = spec;
        this.m_szBestSpec = bestSpec;
        this.m_iFaction = faction;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;
            
        var rank = new WCLOGSEncounterParse();

        rank.m_bLockedIn               = json["lockedIn"];
        rank.m_flRankPercent           = json["rankPercent"];
        rank.m_flHistoricalPercent     = json["historicalPercent"];
        rank.m_flTodayPercent          = json["todayPercent"];
        rank.m_iRankTotalParses        = json["rankTotalParses"];
        rank.m_iHistoricalTotalParses  = json["historicalTotalParses"];
        rank.m_iTodayTotalParses       = json["todayTotalParses"];
        rank.m_Guild                   = Types.WCLOGSGuild.FromJSON(json["guild"])
    //  rank.m_Report                  = json["zone"]; TODO: IMPLEMENT REPORT
        rank.m_iDuration               = json["duration"];
        rank.m_iStartTime              = json["startTime"];
        rank.m_flAmount                = json["amount"];
        rank.m_iBracketData            = json["bracketData"];
        rank.m_szSpec                  = json["spec"];
        rank.m_szBestSpec              = json["bestSpec"];
        rank.m_iFaction                = json["faction"];

        return rank;
    }
}

class WCLOGSZoneRankingResult
{
    constructor(bestAmount = true,
                median = null,
                difficulty = null,
                metric = null,
                partition = null,
                zone = null,
                allstars = null,
                rankings = null)
    {
        this.m_flBestPerformanceAverage = bestAmount;
        this.m_flMedianPerformanceAverage = median;
        this.m_iDifficulty = difficulty;
        this.m_szMetric = metric;
        this.m_iPartition = partition;
        this.m_iZone = zone;
        this.m_Allstars = allstars;
        this.m_Rankings = rankings;
    }
 
    static FromJSON(json)
    {
        if(json == null)
            return null;

        var result = new WCLOGSZoneRankingResult();

        result.m_flBestPerformanceAverage     = json["bestPerformanceAverage"];
        result.m_flMedianPerformanceAverage   = json["medianPerformanceAverage"];
        result.m_iDifficulty                  = json["difficulty"];
        result.m_szMetric                     = json["metric"];
        result.m_iPartition                   = json["partition"];
        result.m_iZone                        = json["zone"];

        var allstars = json["allStars"];
        if(allstars != null)
        {
            result.m_Allstars = [];
            allstars.forEach(function(allstar) {
                result.m_Allstars.push(WCLOGSAllstar.FromJSON(allstar));
            });
        }

        var ranking = json["rankings"];
        if(ranking != null)
        {
            result.m_Rankings = [];
            ranking.forEach(function(ranking) {
                result.m_Rankings.push(WCLOGSRanking.FromJSON(ranking));
            });
        }

        return result;
    }
 }

// Over all (world) ranking of a player, with all specs
class WCLOGSAllstar
{
    constructor(partition = true,
                spec = null,
                points = null,
                possiblePoints = null,
                rank = null,
                regionRank = null,
                serverRank = null,
                rankPercent = null,
                total = null)
    {
        this.m_iPartition = partition;
        this.m_szSpec = spec;
        this.m_flPoints = points;
        this.m_iPossiblePoints = possiblePoints;
        this.m_iRank = rank;                     // Current rank
        this.m_iRegionRank = regionRank;         // Region rank (EU, NA, etc..)
        this.m_iServerRank = serverRank;
        this.m_flRankPercent = rankPercent; 
        this.m_iTotal = total;                   // Amount of ranked ppl
    }
 
    static FromJSON(json)
    {
        if(json == null)
            return null;

        var allstar = new WCLOGSAllstar();

        allstar.m_iPartition      = json["partition"];
        allstar.m_szSpec          = json["spec"];
        allstar.m_flPoints        = json["points"];
        allstar.m_iPossiblePoints = json["possiblePoints"];
        allstar.m_iRank           = json["rank"];
        allstar.m_iRegionRank     = json["regionRank"];
        allstar.m_flRankPercent   = json["rankPercent"];
        allstar.m_iTotal          = json["total"];

        return allstar;
    }
}

// Encounter (world) ranking of a player, with all specs
class WCLOGSRanking
{
    constructor(encounter = null,
                rankPercent = null,
                medianPercent = null,
                lockedIn = null,
                totalKills = null,
                fastestKill = null,
                allstars = null,
                spec = null,
                bestSpec = null,
                bestAmount = null)
    {
        this.m_Encounter = encounter;
        this.m_flRankPercent = rankPercent;
        this.m_flMedianPercent = medianPercent;
        this.m_bLockedIn = lockedIn;
        this.m_iTotalKills = totalKills;
        this.m_iFastestKill = fastestKill;
        this.m_Allstars = allstars;
        this.m_szSpec = spec;
        this.m_szBestSpec = bestSpec;
        this.m_flBestAmount = bestAmount;
    }
 
    static FromJSON(json)
    {
        if(json == null)
            return null;

        var allstar = new WCLOGSRanking();

        allstar.m_Encounter        = Types.WCLOGSEncounter.FromJSON(json["partition"]);
        allstar.m_flRankPercent    = json["rankPercent"];
        allstar.m_flMedianPercent  = json["medianPercent"];
        allstar.m_bLockedIn        = json["lockedIn"];
        allstar.m_iTotalKills      = json["totalKills"];
        allstar.m_iFastestKill     = json["fastestKill"];
        allstar.m_Allstars         = WCLOGSAllstar.FromJSON(json["allStars"]);
        allstar.m_szSpec           = json["spec"];
        allstar.m_szBestSpec       = json["bestSpec"];
        allstar.m_flBestAmount     = json["bestAmount"];

        return allstar;
    }
}

/**
 * Get all parses of a boss by player/realm/region/encounter id
 * 
 * @param name        - Name of player
 * @param server      - Server name
 * @param region      - Region of player (eu, na, etc...)
 * @param encounterId - ID of encounter // https://wowpedia.fandom.com/wiki/DungeonEncounterID
 * @param options     - options of the search (WCLOGSRankingOptions)
 * @returns           - Promise
 */
function GetParses(name, server, region, encounterId, options = null)
{
    var promise = new Promise((resolve, reject) =>
    {
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

        var body = `
                    {
                        characterData
                        {
                            character(name: "${name}", serverSlug: "${server}", serverRegion: "${region}")
                            {
                                ${encRankStr}
                                classID
                            }
                        }
                    }
                    `
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

            if(result.data.data.characterData == null || result.data.data.characterData.character == null)
            {
                console.log("GetParses(): Character was null");
                resolve(null);
                return promise;
            }

            var encounterRankings = WCLOGSEncounterRankingResult.FromJSON(result.data.data.characterData.character.encounterRankings);
            resolve({raw:result.data.data.characterData.character, encounterRankings:encounterRankings});
        });
    });

    return promise;
}

/**
 * * Get players rankings of every encounter, including different specs, also gets overall, region and server ranking
 * 
 * @param name        - Name of player
 * @param server      - Server name
 * @param region      - Region of player (eu, na, etc...)
 * @param options     - options of the search (WCLOGSRankingOptions)
 * @returns           - Promise
 */
function GetAllstars(name, server, region, options = null)
{
    var promise = new Promise((resolve, reject) =>
    {
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

        var body = `
                    {
                        characterData
                        {
                            character(name: "${name}", serverSlug: "${server}", serverRegion: "${region}")
                            {
                                ${zoneRankStr}
                                classID
                            }
                        }
                    }
                    `

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

            if(result.data.data.characterData.character == null)
            {
                resolve(null);
                return promise;
            }

            var zoneRankings = WCLOGSZoneRankingResult.FromJSON(result.data.data.characterData.character.zoneRankings);
            resolve({raw:result.data.data.characterData.character, zoneRankings:zoneRankings});
        });
    });

    return promise;
}

module.exports =
{
    WCLOGSRankingOptions,

    // Encounter Rankings
    WCLOGSEncounterRankingResult,
    WCLOGSEncounterParse,
    GetParses,

    // Zone Rankings
    WCLOGSZoneRankingResult,
    WCLOGSAllstar,
    WCLOGSRanking,
    GetAllstars,
};