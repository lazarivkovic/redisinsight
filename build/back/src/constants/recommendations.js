"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDIS_STACK = exports.ONE_NODE_RECOMMENDATIONS = exports.RECOMMENDATION_NAMES = void 0;
exports.RECOMMENDATION_NAMES = Object.freeze({
    LUA_SCRIPT: 'luaScript',
    LUA_TO_FUNCTIONS: 'luaToFunctions',
    BIG_HASHES: 'bigHashes',
    BIG_STRINGS: 'bigStrings',
    BIG_SETS: 'bigSets',
    BIG_AMOUNT_OF_CONNECTED_CLIENTS: 'bigAmountOfConnectedClients',
    USE_SMALLER_KEYS: 'useSmallerKeys',
    AVOID_LOGICAL_DATABASES: 'avoidLogicalDatabases',
    COMBINE_SMALL_STRINGS_TO_HASHES: 'combineSmallStringsToHashes',
    INCREASE_SET_MAX_INTSET_ENTRIES: 'increaseSetMaxIntsetEntries',
    HASH_HASHTABLE_TO_ZIPLIST: 'hashHashtableToZiplist',
    COMPRESS_HASH_FIELD_NAMES: 'compressHashFieldNames',
    COMPRESSION_FOR_LIST: 'compressionForList',
    ZSET_HASHTABLE_TO_ZIPLIST: 'zSetHashtableToZiplist',
    SET_PASSWORD: 'setPassword',
    RTS: 'RTS',
    REDIS_VERSION: 'redisVersion',
    SEARCH_INDEXES: 'searchIndexes',
    SEARCH_JSON: 'searchJSON',
    STRING_TO_JSON: 'stringToJson',
    SEARCH_VISUALIZATION: 'searchVisualization',
    SEARCH_HASH: 'searchHash',
    FUNCTIONS_WITH_KEYSPACE: 'functionsWithKeyspace',
    FUNCTIONS_WITH_STREAMS: 'functionsWithStreams',
});
exports.ONE_NODE_RECOMMENDATIONS = [
    exports.RECOMMENDATION_NAMES.LUA_SCRIPT,
    exports.RECOMMENDATION_NAMES.AVOID_LOGICAL_DATABASES,
    exports.RECOMMENDATION_NAMES.REDIS_VERSION,
    exports.RECOMMENDATION_NAMES.SET_PASSWORD,
];
exports.REDIS_STACK = [
    exports.RECOMMENDATION_NAMES.BIG_HASHES,
    exports.RECOMMENDATION_NAMES.BIG_SETS,
    exports.RECOMMENDATION_NAMES.RTS,
    exports.RECOMMENDATION_NAMES.REDIS_VERSION,
    exports.RECOMMENDATION_NAMES.SEARCH_INDEXES,
    exports.RECOMMENDATION_NAMES.SEARCH_JSON,
    exports.RECOMMENDATION_NAMES.STRING_TO_JSON,
];
