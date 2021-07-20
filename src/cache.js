var crypto = require('crypto');

var Settings = require('./settings');

class DynamicCacheEntry
{
    constructor()
    {
        this.m_Data            = null;
        this.m_iLastUpdated    = -1;
        this.m_iUpdateInterval = -1;
        this.m_iQueryHash      = null;
        this.m_Character       = null;
    }

    NeedsUpdate()
    {
        var diff = Math.floor(Date.now() / 1000) - this.m_iLastUpdated;
        return diff >= this.m_iUpdateInterval;
    }
}

// Data that might change, direct access of this data may or may not be up to date
class DynamicCache
{
    constructor()
    {
    }

    // key: NameRealmRegion (NotbaldFiremawEU)
    static CacheCharacter(character, query)
    {
        var cacheEntry = new DynamicCacheEntry();
        cacheEntry.m_Data = character;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('md5').update(query).digest('hex');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = Settings.CACHE_UPDATE_INTERVALS.CHARACTER;

        var cacheKey = `${character.m_szName}${character.m_Server.m_szName}${character.m_Server.m_Region.m_szCompactName}`;

        DynamicCache.s_CharacterCache.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, query);
    }

    // key: NameRealmRegionEncounterID (NotbaldFiremawEU613)
    static CacheEncounterRanking(encounterRanking, encounterId, character, query)
    {
        var cacheEntry = new DynamicCacheEntry();
        cacheEntry.m_Data = encounterRanking;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('md5').update(query).digest('hex');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = Settings.CACHE_UPDATE_INTERVALS.ENCOUNTER_RANKINGS;

        var cacheKey = `${character.m_szName}${character.m_Server.m_szName}${character.m_Server.m_Region.m_szCompactName}${encounterId}`;

        DynamicCache.s_EncounterRankings.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, query);
    }

    // key: NameRealmRegionEncounterID (NotbaldFiremawEU)
    static CacheZoneRanking(zoneRanking, character, query)
    {
        var cacheEntry = new DynamicCacheEntry();
        cacheEntry.m_Data = zoneRanking;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('md5').update(query).digest('hex');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = Settings.CACHE_UPDATE_INTERVALS.ZONE_RANKINGS;
        
        var cacheKey = `${character.m_szName}${character.m_Server.m_szName}${character.m_Server.m_Region.m_szCompactName}`;
        
        DynamicCache.s_ZoneRankings.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, query);
    }

    static GetZoneRankings(name, server, region)
    {
        var cacheKey = `${name}${server}${region}`;
        return DynamicCache.s_ZoneRankings.get(cacheKey);
    }

    static GetEncounterRankings(name, server, region, encounterId)
    {
        var cacheKey = `${name}${server}${region}${encounterId}`;
        return DynamicCache.s_EncounterRankings.get(cacheKey);
    }

    static GetCharacter(name, realm, region)
    {
        var cacheKey = `${name}${realm}${region}`;
        return DynamicCache.s_CharacterCache.get(cacheKey);
    }

    static s_CharacterCache = new Map();
    static s_EncounterRankings = new Map();
    static s_ZoneRankings = new Map();

    static s_QueryCache = new Map();
    
}

// Data that never has to change
class StaticCache
{
    static CacheClass(cls)
    {
        StaticCache.s_ClassCache.set(cls.m_szName, cls);
    }

    static GetClass(cls)
    {
        if(typeof cls === 'string')
        {
            return s_ClassCache.get(cls.toLowerCase());
        }
        else if(typeof cls === 'number')
        {
            for (const [key, value] of StaticCache.s_ClassCache.entries()) {
                if(value.m_iID == cls)
                    return value;
            }
        }

        return null;
    }

    static s_ClassCache = new Map();
}

module.exports =
{
    StaticCache,
    DynamicCache,

    DynamicCacheEntry,
}