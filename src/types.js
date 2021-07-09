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

class WCLOGSCharacter
{
    constructor(canonicalId = -1,
                classId = -1,
                faction = new WCLOGSGameFaction(),
                guildRank = -1,
                guilds = null,
                hidden = false,
                id = -1,
                name = null,
                server = new WCLOGSServer())
    {
        this.m_iCanonicalID = canonicalId;
        this.m_iClassID = classId;
        this.m_Faction = faction;
        this.m_iGuildRank = guildRank;
        this.m_Guilds = guilds;// Array of WCLOGSGuild
        this.m_bHidden = hidden;
        this.m_iID = id;
        this.m_szName = name;

        this.m_Server = server // WCLOGSServer 
    }  

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var character = new WCLOGSCharacter();

        character.m_iID          = json["id"];
        character.m_szName       = json["name"];
        character.m_iCanonicalID = json["canonicalID"];
        character.m_Server       = WCLOGSServer.FromJSON(json["server"]);
        character.m_iClassID     = json["classID"];
        character.m_Faction      = WCLOGSGameFaction.FromJSON(json["faction"]);
        character.guildRank      = json["guildRank"];
        //character.m_Guilds     = json["guilds"];

        return character;
    }
}

class WCLOGSEncounter
{
    constructor(id = -1,
                name = null)
    {
        this.m_iID = id;
        this.m_szName = name;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var encounter = new WCLOGSEncounter();

        encounter.m_iID          = json["id"];
        encounter.m_szName       = json["name"];

        return encounter;
    }
}

class WCLOGSRegion
{
    constructor(id = -1,
                compName = null,
                name = null,
                slug = null,
                subRegions = null)
    {
        this.m_iID = id;
        this.m_szCompactName = compName;
        this.m_szName = name;
        this.m_szSlug = slug;

        this.m_SubRegions = subRegions; // Array of SubRegions
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var region = new WCLOGSRegion();

        region.m_iID           = json["id"];
        region.m_szCompactName = json["compactName"];
        region.m_szName        = json["name"];
        region.m_szSlug        = json["slug"];

        return region;
    }
}

class WCLOGSSubRegion
{
    constructor(id = -1,
                name = null,
                region = null)
    {
        this.m_iID = id;
        this.m_szName = name;

        this.m_Region = region;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var subRegion = new WCLOGSSubRegion();

        subRegion.m_iID           = json["id"];
        subRegion.m_szName        = json["name"];

        subRegion.m_Region        = WCLOGSRegion.FromJSON(json["region"]);

        return subRegion;
    }
}

class WCLOGSServer
{
    constructor(id = -1,
                name = null,
                normName = null,
                slug = null,
                region = new WCLOGSRegion(),
                subRegion = new WCLOGSSubRegion()
                )
    {
        this.m_iID = id;
        this.m_szName = name;
        this.m_szNormalizedName = normName;
        this.m_szSlug = slug;
        this.m_Region = region;
        this.m_SubRegion = subRegion;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var server = new WCLOGSServer();

        server.m_iID              = json["id"];
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
    constructor(id = -1,  name = null)
    {
        this.m_iID = id;
        this.m_szName = name;
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var faction = new WCLOGSGameFaction();

        faction.m_iID     = json["id"];
        faction.m_szName  = json["name"];

        return faction;
    }
}

class WCLOGSGuild
{
    constructor(competitionMode = false,
                desc = null,
                faction = null,
                id = -1,
                name = null,
                server = null,
                stealth = false)
    {
        this.m_bCompetitionMode = competitionMode;
        this.m_szDescription = desc;
        this.m_Faction = faction;
        this.m_iID = id;
        this.m_szName = name;
        this.m_Server = server; // WCLOGSServer
        this.m_bStealthMode = stealth;

        // TODO: Implement GuildTag array
    }

    static FromJSON(json)
    {
        if(json == null)
            return null;
            
        var guild = new WCLOGSGuild();

        guild.m_iID              = json["id"];
        guild.m_szName           = json["name"];
        guild.m_Server           = WCLOGSServer.FromJSON(json["server"]);
        guild.m_bStealthMode     = json["stealthMode"];
        guild.m_bCompetitionMode = json["competitionMode"];
        guild.m_szDescription    = json["description"];
        guild.m_Faction          = WCLOGSGameFaction.FromJSON(json["faction"]);

        return guild;
    }
}

module.exports =
{
    WCLOGSRankingCompareType,
    WCLOGSCharacterRankingMetricType,
    WCLOGSRankingTimeframeType,
    
    WCLOGSCharacter,
    WCLOGSRegion,
    WCLOGSSubRegion,
    WCLOGSServer,
    WCLOGSGameFaction,
    WCLOGSGuild,
    WCLOGSEncounter
};