var crypto = require('crypto');

var Settings = require('./settings');
var Types = require('./types');

class DynamicCacheEntry
{
    constructor()
    {
        this.m_Data            = null;
        this.m_iLastUpdated    = -1;
        this.m_iUpdateInterval = -1;
        this.m_iQueryHash      = null;
        this.m_Character       = null;
        this.m_bExists         = null;
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
    static CacheCharacter(character, query, rawQuery)
    {
        var cacheEntry = new DynamicCacheEntry();

        cacheEntry.m_Data = character;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('sha1').update(rawQuery).digest('base64');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = character==null?Settings.CACHE_UPDATE_INTERVALS.NULL_VALUES:Settings.CACHE_UPDATE_INTERVALS.CHARACTER;
        cacheEntry.m_bExists = character!=null;

        var cacheKey = `${query.m_szName}${query.m_szServer}${query.m_szRegion}`;

        DynamicCache.s_CharacterCache.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, rawQuery);
    }

    // key: NameRealmRegionEncounterID<Options> (NotbaldFiremawEU613)
    static CacheEncounterRanking(encounterRanking, character, query, rawQuery)
    {
        var cacheEntry = new DynamicCacheEntry();
        cacheEntry.m_Data = encounterRanking;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('sha1').update(rawQuery).digest('base64');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = encounterRanking==null?Settings.CACHE_UPDATE_INTERVALS.NULL_VALUES:Settings.CACHE_UPDATE_INTERVALS.ENCOUNTER_RANKINGS;
        cacheEntry.m_bExists = encounterRanking!=null;

        var opt = JSON.stringify(query.m_RankingOptions);
        var cacheKey = `${query.m_szName}${query.m_szServer}${query.m_szRegion}${query.m_iEncounterID}${opt}`;
        cacheKey = crypto.createHash('sha1').update(cacheKey).digest('base64');

        DynamicCache.s_EncounterRankings.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, rawQuery);
    }

    // key: NameRealmRegionEncounterID (NotbaldFiremawEU)
    static CacheZoneRanking(zoneRanking, character, query, rawQuery)
    {
        var cacheEntry = new DynamicCacheEntry();
        cacheEntry.m_Data = zoneRanking;
        cacheEntry.m_iLastUpdated = Math.floor(Date.now() / 1000);
        cacheEntry.m_iQueryHash = crypto.createHash('sha1').update(rawQuery).digest('base64');
        cacheEntry.m_Character = character;
        cacheEntry.m_iUpdateInterval = zoneRanking==null?Settings.CACHE_UPDATE_INTERVALS.NULL_VALUES:Settings.CACHE_UPDATE_INTERVALS.ZONE_RANKINGS;
        cacheEntry.m_bExists = zoneRanking!=null;

        var opt = JSON.stringify(query.m_RankingOptions);
        var cacheKey = `${query.m_szName}${query.m_szServer}${query.m_szRegion}${opt}`;
        cacheKey = crypto.createHash('sha1').update(cacheKey).digest('base64');

        DynamicCache.s_ZoneRankings.set(cacheKey, cacheEntry);
        DynamicCache.s_QueryCache.set(cacheEntry.m_iQueryHash, rawQuery);
    }

    static GetZoneRankings(name, server, region, options = new Types.WCLOGSRankingOptions())
    {
        var opt = JSON.stringify(options);
        var cacheKey = `${name}${server}${region}${opt}`;
        cacheKey = crypto.createHash('sha1').update(cacheKey).digest('base64');

        return DynamicCache.s_ZoneRankings.get(cacheKey);
    }

    static GetEncounterRankings(name, server, region, encounterId, options = new Types.WCLOGSRankingOptions())
    {
        var opt = JSON.stringify(options);
        var cacheKey = `${name}${server}${region}${encounterId}${opt}`;
        cacheKey = crypto.createHash('sha1').update(cacheKey).digest('base64');

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