var APIKey = require('../apikey');
var Types = require('./types');
var Cache = require('./cache');

/**
 * Cache Warcraft Logs zone data (zone name, id, encounters)
 * InitAPI() calls this
 *
 * @returns           - Promise
 */
function LoadZoneData()
{
    var promise = new Promise((resolve, reject) =>
    {

        // getting expansion throws internal server error, so leaving that field out
        var body = `
                {
                    worldData
                    {
                        zones
                        {
                            id
                            name
                            frozen
                            brackets
                            {
                                min
                                max
                                bucket
                                type
                            }
                            difficulties
                            {
                                id
                                name
                                sizes
                            }
                            encounters
                            {
                                id
                                name
                                journalID
                            }
                            partitions
                            {
                                id
                                name
                                compactName
                                default
                            }
                        }
                    }
                }
                    `
        APIKey.ApiRequest(body).then((result) => 
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

            if(result.data.data.worldData == null || result.data.data.worldData.zones == null)
            {
                console.log("LoadClassData(): worldData.zones was null");
                resolve(null);
                return promise;
            }

            var zoneData = result.data.data.worldData.zones;
            if(zoneData != null)
            {
                zoneData.forEach(function(cls) {
                    var neZone = Types.WCLOGSZone.FromJSON(cls);
                    Cache.StaticCache.CacheZone(neZone);
                });
            }

            resolve({raw:result.data.data.worldData, classes:zoneData});
        });
    });

    return promise;
}

function GetZone(zone)
{
    return Cache.StaticCache.GetZone(zone);
}

function FindZone(zone)
{
    return Cache.StaticCache.FindZone(zone);
}

function GetZoneEntries()
{
    return Cache.StaticCache.s_ZoneCache.entries();
}

module.exports =
{
    LoadZoneData,

    GetZone,
    GetZoneEntries,

    FindZone,
};