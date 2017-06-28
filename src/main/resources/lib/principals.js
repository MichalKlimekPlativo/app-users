var common = require('./common');
var authLib = require('/lib/xp/auth');

var PrincipalType = {
    ROLE: 'ROLE',
    USER: 'USER',
    GROUP: 'GROUP',
    all: function () {
        return [PrincipalType.ROLE, PrincipalType.USER, PrincipalType.GROUP];
    }
};

function isUser(key) {
    return common.typeFromKey(key).toUpperCase() === PrincipalType.USER;
}
function isGroup(key) {
    return common.typeFromKey(key).toUpperCase() === PrincipalType.GROUP;
}
function isRole(key) {
    return common.typeFromKey(key).toUpperCase() === PrincipalType.ROLE;
}

module.exports = {
    getByKeys: function (keys, includeMemberships) {
        // users and groups have their keys as _id, but roles have them stored as key
        var principals = common.queryAll({
            query: common.createQueryByField('_id', keys) + ' OR ' + common.createQueryByField('key', keys)
        }).hits;
        if (includeMemberships && principals) {
            // principals may be object so make sure we have array
            [].concat(principals).forEach(function (p) {
                var key = p.key || p._id;
                if (isUser(key)) {
                    p["memberships"] = module.exports.getMemberships(key);
                } else if (isGroup(key) || isRole(key)) {
                    // uncomment to return principals instead of their keys
                    // p["member"] = common.getByIds(p.member);
                }
            });
        }
        return common.singleOrArray(principals);
    },
    getMemberships: function (key) {
        return authLib.getMemberships(key);
    },
    addMemberships: function (key, memberships) {
        var addMms = [].concat(memberships).map(function (current) {
            module.exports.addMembers(current, key);
            return current;
        });
        log.info('Added memberships of [' + key + '] in: ' + JSON.stringify(addMms));
        return addMms;
    },
    removeMemberships: function (key, memberships) {
        var removeMms = [].concat(memberships).map(function (current) {
            module.exports.removeMembers(current, key);
            return current;
        });
        log.info('Removed memberships of [' + key + '] from: ' + JSON.stringify(removeMms));
        return removeMms;
    },
    updateMemberships: function (key, addMms, removeMms) {
        if (addMms && addMms.length > 0) {
            module.exports.addMemberships(key, addMms);
        }
        if (removeMms && removeMms.length > 0) {
            module.exports.removeMemberships(key, removeMms);
        }
    },
    getMembers: function (key) {
        return authLib.getMembers(key);
    },
    addMembers: function (key, members) {
        try {
            authLib.addMembers(key, members);
            log.info('Added members to [' + key + ']: ' + JSON.stringify(members));
            return members;
        } catch (e) {
            log.error('Could not add members ' + JSON.stringify(members) + ' to [' + key + ']', e);
        }
    },
    removeMembers: function (key, members) {
        try {
            authLib.removeMembers(key, members);
            log.info('Removed members from [' + key + ']: ' + JSON.stringify(members));
            return members;
        } catch (e) {
            log.error('Could not remove members ' + JSON.stringify(members) + ' from [' + key + ']', e);
        }
    },
    updateMembers: function (key, addMs, removeMs) {
        if (addMs && addMs.length > 0) {
            module.exports.addMembers(key, addMs);
        }
        if (removeMs && removeMs.length > 0) {
            module.exports.removeMembers(key, removeMs);
        }
    },
    list: function (userStoreKey, types, query, start, count, sort) {
        return common.queryAll({
            query: createPrincipalQuery(userStoreKey, types, query),
            start: start,
            count: count,
            sort: sort
        });
    },
    delete: function (keys) {
        // convert keys to paths because userstores and roles
        // can't have custom ids and thus be deleted by keys
        var results = common.delete(keysToPaths(keys));
        log.info('Delete result for keys ' + JSON.stringify(keys) + ': ' + JSON.stringify(results));

        keys.forEach(function (key) {
            var memberships = module.exports.getMemberships(key);
            log.info('Got memberships for key ' + key + ': ' + JSON.stringify(memberships));
            module.exports.removeMemberships(key, memberships.map(function (membership) {
                return membership.key;
            }));
        });

        return keys.map(function (key) {
            return {
                key: key,
                deleted: true,
                reason: ''
            }
        });
    },
    Type: PrincipalType
};

function keysToPaths(keys) {
    return keys.map(function (key) {
        if (isUser(key)) {
            return '/identity/' + common.userStoreFromKey(key) + '/users/' + common.nameFromKey(key);
        }
        if (isGroup(key)) {
            return '/identity/' + common.userStoreFromKey(key) + '/groups/' + common.nameFromKey(key);
        }
        if (isRole(key)) {
            return '/identity/roles/' + common.nameFromKey(key);
        }
    });
}

function createPrincipalQuery(userStoreKey, types, query) {

    var q = !!query ? textQuery(query) : '';
    if (!types) {
        q += (q ? ' AND ' : '') + userStoreQuery(userStoreKey);
    } else {
        var tq = '';
        types.forEach(function (type, index) {
            var add;
            switch (type) {
            case PrincipalType.ROLE:
                add = rolesQuery();
                break;
            case PrincipalType.GROUP:
            case PrincipalType.USER:
                add = userStoreQuery(userStoreKey, type);
                break;
            }
            tq += (index > 0 ? ' OR ' : '') + add;
        });
        q += (q ? ' AND (' + tq + ')' : tq);
    }
    return q;
}

function textQuery(query) {
    var q = '"_allText,displayName","' + query + '","AND"';
    return '(fulltext(' + q + ') OR ngram(' + q + '))';
}

function rolesQuery() {
    return '_parentPath="/identity/roles"'
}

function userStoreQuery(key, type) {
    return '(userStoreKey="' + key + '"' + (type ? 'AND principalType="' + type + '")' : ')');
}
