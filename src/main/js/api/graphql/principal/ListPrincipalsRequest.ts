import UserStoreListResult = api.security.UserStoreListResult;
import UserStore = api.security.UserStore;
import UserStoreJson = api.security.UserStoreJson;
import {ListGraphQlRequest} from '../ListGraphQlRequest';
import Principal = api.security.Principal;
import PrincipalJson = api.security.PrincipalJson;
import PrincipalListJson = api.security.PrincipalListJson;
import PrincipalType = api.security.PrincipalType;
import UserStoreKey = api.security.UserStoreKey;

export class ListPrincipalsRequest
    extends ListGraphQlRequest<any, any> {

    private types: PrincipalType[];
    private userStoreKey: UserStoreKey;
    private searchQuery: string;

    private static readonly listQuery = `query($userstore: String, $types: [PrincipalType], $query: String, $start: Int, $count: Int, $sort: SortMode) {
                    principalsConnection (userstore: $userstore, types: $types, query: $query, start: $start, count: $count, sort: $sort) {
                        totalCount
                        edges {
                            node {
                                key,
                                name,
                                path,
                                description,
                                displayName,
                                permissions {
                                    principal {
                                        displayName
                                        key
                                    }
                                    allow,
                                    deny
                                }
                            }
                        }
                    }
                }`;

    setTypes(types: PrincipalType[]): ListPrincipalsRequest {
        this.types = types;
        return this;
    }

    setUserStoreKey(key: UserStoreKey): ListPrincipalsRequest {
        this.userStoreKey = key;
        return this;
    }

    setQuery(query: string): ListPrincipalsRequest {
        this.searchQuery = query;
        return this;
    }

    getVariables(): { [key: string]: any } {
        let vars = super.getVariables();
        if (this.types && this.types.length > 0) {
            vars['types'] = this.types.map(type => PrincipalType[type]);
        }
        if (!!this.userStoreKey) {
            vars['userstore'] = this.userStoreKey.toString();
        }
        if (!!this.searchQuery) {
            vars['query'] = this.searchQuery;
        }
        return vars;
    }

    sendAndParse(): wemQ.Promise<any> {
        return this.query(ListPrincipalsRequest.listQuery).then((response: any) => {
            let data = response.principalsConnection;
            return {
                principals: data.edges.map((edge: any) => Principal.fromJson(edge.node)),
                total: data.totalCount
            }
        });
    }
}