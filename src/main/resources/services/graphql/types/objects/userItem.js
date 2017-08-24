var graphQl = require('/lib/graphql');

module.exports = graphQl.createInterfaceType({
    name: 'UserItem',
    description: 'User item is a base entity for every principal or user store',
    typeResolver: function() {
        return null;
    },
    fields: {
        id: {
            type: graphQl.GraphQLID
        },
        key: {
            type: graphQl.GraphQLString
        },
        name: {
            type: graphQl.GraphQLString
        },
        path: {
            type: graphQl.GraphQLString
        },
        displayName: {
            type: graphQl.GraphQLString
        },
        description: {
            type: graphQl.GraphQLString
        },
        modifiedTime: {
            type: graphQl.GraphQLString
        }
    }
});