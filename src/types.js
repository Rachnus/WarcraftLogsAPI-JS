// https://classic.warcraftlogs.com/v2-api-docs/warcraft/rankingcomparetype.doc.html
const WCLOGSRankingCompareType = 
{
    Rankings: 'Rankings',
    Parses:   'Parses',
}

// https://classic.warcraftlogs.com/v2-api-docs/warcraft/characterrankingmetrictype.doc.html
const WCLOGSCharacterRankingMetricType = 
{
    // SHARED
    BossDPS:                'bossdps',
    Default:                'default',
    DPS:                    'dps',
    HPS:                    'hps',
    KRSI:                   'krsi',
    PlayerScore:            'playerscore',
    PlayerSpeed:            'playerspeed',
    TankHPS:                'tankhps',

    // WOW ONLY
    WDPS:                   'wdps',

    // FFXIV ONLY
    RDPS:                   'rdps',
    BossRDPS:               'bossrdps',
    HealerCombinedDPS:      'healercombineddps',
    HealerCombinedBossDPS:  'healercombinedbossdps',
    HealerCombinedRDPS:     'healercombineddps',
    HealerCombinedBossRDPS: 'healercombinedbossrdps',
    TankCombinedDPS:        'tankcombineddps',
    TankCombinedBossDPS:    'tankcombinedbossdps',
    TankCombinedRDPS:       'tankcombinedrdps',
    TankCombinedBossRDPS:   'tankcombinedbossrdps'
}

// https://classic.warcraftlogs.com/v2-api-docs/warcraft/rankingtimeframetype.doc.html
const WCLOGSRankingTimeframeType = 
{
    Today:      'Today',
    Historical: 'Historical',
}

// https://classic.warcraftlogs.com/v2-api-docs/warcraft/roletype.doc.html
const WCLOGSRankingRoleType = 
{
    Any:    'Any',
    DPS:    'DPS',
    Healer: 'Healer',
    Tank:   'Tank',
}

class WCLOGSRegion
{
    constructor()
    {
        this.m_iID           = null;
        this.m_szCompactName = null;
        this.m_szName        = null;
        this.m_szSlug        = null;

        this.m_SubRegions    = null; // Array of SubRegions
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var region = new WCLOGSRegion();

        region.m_iID           = Number(json["id"]);
        region.m_szCompactName = json["compactName"];
        region.m_szName        = json["name"];
        region.m_szSlug        = json["slug"];

        return region;
    }
}

class WCLOGSSubRegion
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
        this.m_Region = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var subRegion = new WCLOGSSubRegion();

        subRegion.m_iID           = Number(json["id"]);
        subRegion.m_szName        = json["name"];

        subRegion.m_Region        = WCLOGSRegion.FromJSON(json["region"]);

        return subRegion;
    }
}

class WCLOGSServer
{
    constructor()
    {
        this.m_iID              = null;
        this.m_szName           = null;
        this.m_szNormalizedName = null;
        this.m_szSlug           = null;
        this.m_Region           = null;
        this.m_SubRegion        = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var server = new WCLOGSServer();

        server.m_iID              = Number(json["id"]);
        server.m_szName           = json["name"];
        server.m_szNormalizedName = json["normalizedName"];
        server.m_szSlug           = json["slug"];
        server.m_Region           = WCLOGSRegion.FromJSON(json["region"]);
        server.m_SubRegion        = WCLOGSSubRegion.FromJSON(json["subregion"]);

        return server;
    }
}

class WCLOGSGameFaction
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var faction = new WCLOGSGameFaction();

        faction.m_iID     = Number(json["id"]);
        faction.m_szName  = json["name"];

        return faction;
    }
}

class WCLOGSGuild
{
    constructor()
    {
        this.m_bCompetitionMode = null;
        this.m_szDescription    = null;
        this.m_Faction          = null;
        this.m_iID              = null;
        this.m_szName           = null;
        this.m_Server           = null; // WCLOGSServer
        this.m_bStealthMode     = null;

        // TODO: Implement GuildTag array
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;
            
        var guild = new WCLOGSGuild();

        guild.m_iID              = Number(json["id"]);
        guild.m_szName           = json["name"];
        guild.m_Server           = WCLOGSServer.FromJSON(json["server"]);
        guild.m_bStealthMode     = json["stealthMode"];
        guild.m_bCompetitionMode = json["competitionMode"];
        guild.m_szDescription    = json["description"];
        guild.m_Faction          = WCLOGSGameFaction.FromJSON(json["faction"]);

        return guild;
    }
}


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
    constructor(byBracket = false,
                compare = WCLOGSRankingCompareType.Rankings,
                difficulty = 3,
                includeCombatantInfo = false,
                includePrivateLogs = false,
                metric = WCLOGSCharacterRankingMetricType.Default,
                partition = 0,                                     // looks like it means expansion kind of, 0 works for classic parses, 1 works for tbc, if the value is 0 or lower, it works for all
                role = WCLOGSRankingRoleType.Any,
                size = 0,                                          // 0 to get default or any, not sure, but works
                specName = "",                                     // leave empty or type invalid spec to get all specs
                timeframe = WCLOGSRankingTimeframeType.Historical,
                zoneId = 0)                                        // 0 to get default zone id, usually different every phase
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
        this.m_iZoneID = zoneId;
    }
}
 
 class WCLOGSEncounterRankingResult
 {
     constructor()
     {
         this.m_flBestAmount         = null;
         this.m_flMedianPerformance  = null;
         this.m_flAveragePerformance = null;
         this.m_iTotalKills          = null;
         this.m_iFastestKill         = null;
         this.m_iDifficulty          = null;
         this.m_szMetric             = null;
         this.m_iPartition           = null;
         this.m_iZone                = null;
         this.m_Ranks                = null;
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
         result.m_iDifficulty           = Number(json["difficulty"]);
         result.m_szMetric              = json["metric"];
         result.m_iPartition            = Number(json["partition"]);
         result.m_iZone                 = Number(json["zone"]);
 
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
     constructor()
     {
         this.m_bLockedIn              = null;
         this.m_flRankPercent          = null;
         this.m_flHistoricalPercent    = null;
         this.m_flTodayPercent         = null;
         this.m_iRankTotalParses       = null;
         this.m_iHistoricalTotalParses = null;
         this.m_iTodayTotalParses      = null;
         this.m_Guild                  = null;
         this.m_Report                 = null; // TODO: Implement WCLOGSReport
         this.m_iDuration              = null;
         this.m_iStartTime             = null;
         this.m_flAmount               = null;
         this.m_iBracketData           = null;
         this.m_szSpec                 = null;
         this.m_szBestSpec             = null;
         this.m_iFaction               = null;
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
         rank.m_Guild                   = WCLOGSGuild.FromJSON(json["guild"])
     //  rank.m_Report                  = json["zone"]; TODO: IMPLEMENT REPORT
         rank.m_iDuration               = Number(json["duration"]);
         rank.m_iStartTime              = Number(json["startTime"]);
         rank.m_flAmount                = json["amount"];
         rank.m_iBracketData            = json["bracketData"];
         rank.m_szSpec                  = json["spec"];
         rank.m_szBestSpec              = json["bestSpec"];
         rank.m_iFaction                = Number(json["faction"]);
 
         return rank;
     }
 }
 
 class WCLOGSZoneRankingResult
 {
     constructor()
     {
         this.m_flBestPerformanceAverage   = null;
         this.m_flMedianPerformanceAverage = null;
         this.m_iDifficulty                = null;
         this.m_szMetric                   = null;
         this.m_iPartition                 = null;
         this.m_iZone                      = null;
         this.m_Allstars                   = null;
         this.m_Rankings                   = null;
     }
  
     static FromJSON(json)
     {
         if(json == null)
             return null;
 
         var result = new WCLOGSZoneRankingResult();
 
         result.m_flBestPerformanceAverage     = json["bestPerformanceAverage"];
         result.m_flMedianPerformanceAverage   = json["medianPerformanceAverage"];
         result.m_iDifficulty                  = Number(json["difficulty"]);
         result.m_szMetric                     = json["metric"];
         result.m_iPartition                   = Number(json["partition"]);
         result.m_iZone                        = Number(json["zone"]);
 
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
     constructor()
     {
         this.m_iPartition      = null;
         this.m_szSpec          = null;
         this.m_flPoints        = null;
         this.m_iPossiblePoints = null;
         this.m_iRank           = null; // Current rank
         this.m_iRegionRank     = null; // Region rank (EU, NA, etc..)
         this.m_iServerRank     = null;
         this.m_flRankPercent   = null; 
         this.m_iTotal          = null; // Amount of ranked ppl
     }
  
     static FromJSON(json)
     {
         if(json == null)
             return null;
 
         var allstar = new WCLOGSAllstar();
 
         allstar.m_iPartition      = Number(json["partition"]);
         allstar.m_szSpec          = json["spec"];
         allstar.m_flPoints        = json["points"];
         allstar.m_iPossiblePoints = json["possiblePoints"];
         allstar.m_iRank           = Number(json["rank"]);
         allstar.m_iRegionRank     = Number(json["regionRank"]);
         allstar.m_flRankPercent   = json["rankPercent"];
         allstar.m_iTotal          = Number(json["total"]);
 
         return allstar;
     }
 }
 
 // Encounter (world) ranking of a player, with all specs
 class WCLOGSRanking
 {
     constructor()
     {
         this.m_Encounter       = null;
         this.m_flRankPercent   = null;
         this.m_flMedianPercent = null;
         this.m_bLockedIn       = null;
         this.m_iTotalKills     = null;
         this.m_iFastestKill    = null;
         this.m_Allstars        = null;
         this.m_szSpec          = null;
         this.m_szBestSpec      = null;
         this.m_flBestAmount    = null;
 
         this.m_Character       = null;
     }
  
     static FromJSON(json)
     {
         if(json == null)
             return null;
 
         var allstar = new WCLOGSRanking();
 
         allstar.m_Encounter        = WCLOGSEncounter.FromJSON(json["partition"]);
         allstar.m_flRankPercent    = json["rankPercent"];
         allstar.m_flMedianPercent  = json["medianPercent"];
         allstar.m_bLockedIn        = json["lockedIn"];
         allstar.m_iTotalKills      = Number(json["totalKills"]);
         allstar.m_iFastestKill     = Number(json["fastestKill"]);
         allstar.m_Allstars         = WCLOGSAllstar.FromJSON(json["allStars"]);
         allstar.m_szSpec           = json["spec"];
         allstar.m_szBestSpec       = json["bestSpec"];
         allstar.m_flBestAmount     = json["bestAmount"];
 
         return allstar;
     }
 }

 class WCLOGSCharacter
{
    constructor()
    {
        this.m_iCanonicalID      = null;
        this.m_iClassID          = null;
        this.m_Faction           = null;
        this.m_iGuildRank        = null;
        this.m_Guilds            = null; // Array of WCLOGSGuild
        this.m_bHidden           = null;
        this.m_iID               = null;
        this.m_iLevel            = null;
        this.m_szName            = null;
        this.m_Server            = null // WCLOGSServer
    }  

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var character = new WCLOGSCharacter();

        character.m_iCanonicalID = Number(json["canonicalID"]);
        character.m_iClassID     = Number(json["classID"]);
        character.m_Faction      = WCLOGSGameFaction.FromJSON(json["faction"]);
        character.m_iGuildRank   = json["guildRank"];
        character.m_bHidden      = json["hidden"];
        character.m_iID          = Number(json["id"]);
        character.m_iLevel       = Number(json["level"]);
        character.m_szName       = json["name"];
        character.m_Server       = WCLOGSServer.FromJSON(json["server"]);
        //character.m_Guilds     = json["guilds"];

        return character;
    }
}

class WCLOGSSpec
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
        this.m_szSlug = null;
    } 

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var spec = new WCLOGSSpec();

        spec.m_iID          = Number(json["id"]);
        spec.m_szName       = json["name"];
        spec.m_szSlug       = json["slug"];

        return spec;
    }
}

class WCLOGSClass
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
        this.m_szSlug = null;
        this.m_Specs  = null;
    }  

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var cls = new WCLOGSClass();

        cls.m_iID          = Number(json["id"]);
        cls.m_szName       = json["name"];
        cls.m_szSlug       = json["slug"];

        var specs = json["specs"];
        if(specs != null)
        {
            cls.m_Specs = [];
            specs.forEach(function(spec) {
                cls.m_Specs.push(WCLOGSSpec.FromJSON(spec));
            });
        }

        return cls;
    }
}

class WCLOGSZone
{
    constructor()
    {
        this.m_iID          = null;
        this.m_szName       = null;
        this.m_bFrozen      = null;
        this.m_Bracket      = null;
        this.m_Expansion    = null;
        this.m_Difficulties = null;
        this.m_Encounters   = null;
        this.m_Partitions   = null;
    }  

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var zone = new WCLOGSZone();

        zone.m_iID          = Number(json["id"]);
        zone.m_szName       = json["name"];
        zone.m_bFrozen      = json["frozen"];

        zone.m_Bracket      = WCLOGSBracket.FromJSON(json["brackets"]);
        zone.m_Expansion    = WCLOGSExpansion.FromJSON(json["expansion"]);

        var difficulties   = json["difficulties"];
        var encounters     = json["encounters"];
        var partitions     = json["partitions"];

        if(difficulties != null)
        {
            zone.m_Difficulties = [];
            difficulties.forEach(function(difficulty) {
                zone.m_Difficulties.push(WCLOGSDifficulty.FromJSON(difficulty));
            });
        }

        if(encounters != null)
        {
            zone.m_Encounters = [];
            encounters.forEach(function(encounter) {
                zone.m_Encounters.push(WCLOGSEncounter.FromJSON(encounter));
            });
        }

        if(partitions != null)
        {
            zone.m_Partitions = [];
            partitions.forEach(function(partition) {
                zone.m_Partitions.push(WCLOGSPartition.FromJSON(partition));
            });
        }
        return zone;
    }
}

class WCLOGSBracket
{
    constructor()
    {
        this.m_flMin     = null;
        this.m_flMax    = null;
        this.m_flBucket = null;
        this.m_szType   = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var bracket = new WCLOGSBracket();

        bracket.m_flMin    = json["min"];
        bracket.m_flMax    = json["nax"];
        bracket.m_flBucket = json["bucket"];
        bracket.m_szType   = json["type"];

        return bracket;
    }
}

class WCLOGSEncounter
{
    constructor()
    {
        this.m_iID        = null;
        this.m_szName     = null;
        this.m_Zone       = null;
        this.m_iJournalID = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var encounter = new WCLOGSEncounter();

        encounter.m_iID          = Number(json["id"]);
        encounter.m_szName       = json["name"];
        encounter.m_iJournalID   = Number(json["journalID"]);

        return encounter;
    }
}

class WCLOGSExpansion
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
        this.m_Zones  = null; // TODO fix later
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var expansion = new WCLOGSExpansion();

        expansion.m_iID    = Number(json["id"]);
        expansion.m_szName = json["name"];

        return expansion;
    }
}

class WCLOGSDifficulty
{
    constructor()
    {
        this.m_iID    = null;
        this.m_szName = null;
        this.m_Sizes  = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var difficulty = new WCLOGSDifficulty();

        difficulty.m_iID    = Number(json["id"]);
        difficulty.m_szName = json["name"];

        var sizes           = json["sizes"];

        if(sizes != null)
        {
            difficulty.m_Sizes = [];
            sizes.forEach(function(size) {
                difficulty.m_Sizes.push(size);
            });
        }

        return difficulty;
    }
}

class WCLOGSPartition
{
    constructor()
    {
        this.m_iID           = null;
        this.m_szName        = null;
        this.m_szCompactName = null;
        this.m_bDefault      = null;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var partition = new WCLOGSPartition();

        partition.m_iID           = Number(json["id"]);
        partition.m_szName        = json["name"];
        partition.m_szCompactName = json["compactName"];
        partition.m_bDefault      = json["default"];

        return partition;
    }
}

module.exports =
{
    // --- RANKINGS ---
    WCLOGSRankingCompareType,
    WCLOGSCharacterRankingMetricType,
    WCLOGSRankingTimeframeType,
    WCLOGSRankingRoleType,

    WCLOGSRankingOptions,

    // Encounter Rankings
    WCLOGSEncounterRankingResult,
    WCLOGSEncounterParse,

    // Zone Rankings
    WCLOGSZoneRankingResult,
    WCLOGSAllstar,
    WCLOGSRanking,

    // --- CHARACTER ---
    WCLOGSCharacter,
    WCLOGSRegion,
    WCLOGSSubRegion,
    WCLOGSServer,
    WCLOGSGameFaction,
    WCLOGSGuild,

    // --- CLASS ---
    WCLOGSSpec,
    WCLOGSClass,

    // --- ZONES ---
    WCLOGSZone,
    WCLOGSBracket,
    WCLOGSDifficulty,
    WCLOGSEncounter,
    WCLOGSExpansion,
    WCLOGSPartition
};