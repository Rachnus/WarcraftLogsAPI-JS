var LOG_PREFIX = "[WarcraftLogsAPI]"

/**
 * The amount of time in seconds a cached value remains until it will be queried again
 * 
 * The lower the value, the more precise data from the API, but more API calls
 */
const CACHE_UPDATE_INTERVALS =
{
    CHARACTER:          21600,  // (21600) every 6 hours by default, only thing that changes for characters really is level
    ENCOUNTER_RANKINGS: 3600,   // (3600) every hour by default, these calls automatically updates character aswell
    ZONE_RANKINGS:      3600,   // (3600) every hour by default, these calls automatically updates character aswell

    NULL_VALUES:        3600    // (3600) every hour by default, invalid queries, a name that doesnt exist for example
}

module.exports =
{
  LOG_PREFIX,
  CACHE_UPDATE_INTERVALS,
};