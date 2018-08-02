import {GraphQlRequest} from '../GraphQlRequest';
import PrincipalKey = api.security.PrincipalKey;
import Principal = api.security.Principal;
import PrincipalJson = api.security.PrincipalJson;
import Role = api.security.Role;
import RoleJson = api.security.RoleJson;
import Group = api.security.Group;
import GroupJson = api.security.GroupJson;
import User = api.security.User;
import UserJson = api.security.UserJson;
import PrincipalType = api.security.PrincipalType;

export class GetPrincipalByKeyRequest
    extends GraphQlRequest<any, Principal> {

    private key: PrincipalKey;
    private transitive: boolean;

    constructor(key: PrincipalKey) {
        super();
        this.key = key;
    }

    setTransitiveMemberships(flag: boolean): GetPrincipalByKeyRequest {
        this.transitive = flag;
        return this;
    }

    getVariables(): { [key: string]: any } {
        let vars = super.getVariables();
        if (this.key) {
            vars['key'] = this.key.toString();
        }
        vars['transitive'] = this.transitive;
        return vars;
    }

    getQuery(): string {
        return `query (${this.getParamsByKey(this.key)}) {
                    principal (key: $key) {
                        key
                        name
                        path
                        description
                        displayName
                        ${this.getFieldsByKey(this.key)}
                        permissions {
                            principal {
                                key
                                displayName
                            }
                            allow
                            deny
                        }
                    }
                }`;
    }

    private getParamsByKey(key: PrincipalKey): string {
        const params = ['$key: String!'];
        if (!key.isRole()) {
            params.push('$transitive: Boolean');
        }
        return params.join(', ');
    }

    private getFieldsByKey(key: PrincipalKey): string {
        let fields = '';
        switch (key.getType()) {
        case PrincipalType.USER:
            fields = `email
                      login
                      memberships (transitive: $transitive) {
                          key
                          displayName
                          description
                      }`;
            break;
        case PrincipalType.GROUP:
            fields = `members
                      memberships (transitive: $transitive) {
                          key
                          displayName
                          description
                      }`;
            break;
        case PrincipalType.ROLE:
            fields = `members`;
            break;
        }
        return fields;
    }

    sendAndParse(): wemQ.Promise<Principal> {
        return this.query().then(result => this.fromJsonToPrincipal(result.principal));
    }

    fromJsonToPrincipal(json: PrincipalJson): Principal {
        if (!json) {
            throw `Principal[${this.key.toString()}] not found`;
        }
        if (!json.key) {
            return null;
        }
        let pKey: PrincipalKey = PrincipalKey.fromString(json.key);
        if (pKey.isRole()) {
            return Role.fromJson(<RoleJson>json);

        } else if (pKey.isGroup()) {
            return Group.fromJson(<GroupJson>json);

        } else if (pKey.isUser()) {
            return User.fromJson(<UserJson>json);
        }
    }
}
