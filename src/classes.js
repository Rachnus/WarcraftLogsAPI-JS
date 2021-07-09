var APIKey = require('../apikey');
var Axios = require('axios');

var g_Classes = new Map();

class WCLOGSSpec
{
    constructor(id = null,
                name = null,
                slug = null)
    {
        this.m_iID = id;
        this.m_szName = name;
        this.m_szSlug = slug;
    } 

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var spec = new WCLOGSSpec();

        spec.m_iID          = json["id"];
        spec.m_szName       = json["name"];
        spec.m_szSlug       = json["slug"];

        return spec;
    }
}

class WCLOGSClass
{
    constructor(id = null,
                name = null,
                slug = null,
                specs = null)
    {
        this.m_iID = id;
        this.m_szName = name;
        this.m_szSlug = slug;
        this.m_Specs = specs;
    }  

    static FromJSON(json)
    {
        if(json == null)
            return null;

        var cls = new WCLOGSClass();

        cls.m_iID          = json["id"];
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

function GetClass(cls)
{
    if(typeof cls === 'string')
    {
        return g_Classes.get(cls.toLowerCase());
    }
    else if(typeof cls === 'number')
    {
        for (const [key, value] of g_Classes.entries()) {
            if(value.m_iID == cls)
                return value;
          }
    }

    return null;
}


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
                //throw new Error("No response data from API request");
                resolve(null);
                return promise;
            }

            if(result.data.errors != null)
            {
                console.log(result.data.errors);
                //throw new Error("Invalid request to API");
                resolve(null);
                return promise;
            }

            if(result.data.data.gameData == null || result.data.data.gameData.classes == null)
            {
                console.log("LoadClassData(): gameData.character was null");
                resolve(null);
                return promise;
            }

            var classData = result.data.data.gameData.classes;
            if(classData != null)
            {
                classData.forEach(function(cls) {
                    var newClass = WCLOGSClass.FromJSON(cls);
                    g_Classes.set(newClass.m_szName, newClass);
                });
            }

            resolve({raw:result.data.data.gameData, classes:classData});
        });
    });

    return promise;
}

module.exports =
{
    WCLOGSSpec,
    WCLOGSClass,

    LoadClassData,
    GetClass,
};