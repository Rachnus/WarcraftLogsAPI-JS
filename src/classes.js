var APIKey = require('../apikey');
var Axios = require('axios');
var Types = require('./types');
var Cache = require('./cache');

/**
 * Cache Warcraft Logs class data (class names, ids, specs)
 * InitAPI() calls this
 *
 * @returns           - Promise
 */
function LoadClassData()
{
    var promise = new Promise((resolve, reject) =>
    {

        var body = `
                {
                    gameData{
                    classes{
                        id
                        name
                        slug
                        specs{
                            id
                            class{
                                id
                            }
                            name
                            slug
                        }
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

            if(result.data.data.gameData == null || result.data.data.gameData.classes == null)
            {
                console.log("LoadClassData(): gameData.classes was null");
                resolve(null);
                return promise;
            }

            var classData = result.data.data.gameData.classes;
            if(classData != null)
            {
                classData.forEach(function(cls) {
                    var newClass = Types.WCLOGSClass.FromJSON(cls);
                    Cache.StaticCache.CacheClass(newClass);
                });
            }

            resolve({raw:result.data.data.gameData, classes:classData});
        });
    });

    return promise;
}

function GetClass(cls)
{
    return Cache.StaticCache.GetClass(cls);
}

function GetClassEntries()
{
    return Cache.StaticCache.s_ClassCache.entries();
}

module.exports =
{
    LoadClassData,

    GetClass,
    GetClassEntries,
};