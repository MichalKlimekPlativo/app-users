import UserItem = api.security.UserItem;
import AuthConfig = api.security.AuthConfig;
import IdProviderMode = api.security.IdProviderMode;
import PrincipalType = api.security.PrincipalType;
import UserItemBuilder = api.security.UserItemBuilder;
import UserStoreKey = api.security.UserStoreKey;
import {ListPrincipalsRequest, ListPrincipalsResult} from '../../api/graphql/principal/ListPrincipalsRequest';
import {UserStoreAccessControlList} from '../access/UserStoreAccessControlList';
import {UserStoreJson} from './UserStoreJson';

export class UserStore
    extends UserItem {

    private authConfig: AuthConfig;

    private idProviderMode: IdProviderMode;

    private permissions: UserStoreAccessControlList;

    constructor(builder: UserStoreBuilder) {
        super(builder);
        this.authConfig = builder.authConfig;
        this.idProviderMode = builder.idProviderMode;
        this.permissions = builder.permissions || new UserStoreAccessControlList();
    }

    getAuthConfig(): AuthConfig {
        return this.authConfig;
    }

    getIdProviderMode(): IdProviderMode {
        return this.idProviderMode;
    }

    getPermissions(): UserStoreAccessControlList {
        return this.permissions;
    }

    isDeletable(): wemQ.Promise<boolean> {
        return new ListPrincipalsRequest()
            .setUserStoreKey(this.getKey())
            .setTypes([PrincipalType.USER, PrincipalType.GROUP])
            .sendAndParse()
            .then((result: ListPrincipalsResult) => (result.total === 0));
    }

    static checkOnDeletable(key: UserStoreKey): wemQ.Promise<boolean> {
        return key ? UserStore.create().setKey(key.toString()).build().isDeletable() : wemQ(false);
    }

    getKey(): UserStoreKey {
        return <UserStoreKey>super.getKey();
    }

    equals(o: api.Equitable): boolean {
        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, UserStore)) {
            return false;
        }

        let other = <UserStore> o;

        return super.equals(other) &&
               ((!this.authConfig && !other.authConfig) || (this.authConfig && this.authConfig.equals(other.authConfig))) &&
               this.permissions.equals(other.permissions);
    }

    clone(): UserStore {
        return this.newBuilder().build();
    }

    newBuilder(): UserStoreBuilder {
        return new UserStoreBuilder(this);
    }

    static create(): UserStoreBuilder {
        return new UserStoreBuilder();
    }

    static fromJson(json: UserStoreJson): UserStore {
        return new UserStoreBuilder().fromJson(json).build();
    }
}

export class UserStoreBuilder
    extends UserItemBuilder {

    authConfig: AuthConfig;

    idProviderMode: IdProviderMode;

    permissions: UserStoreAccessControlList;

    constructor(source?: UserStore) {
        if (source) {
            super(source);
            this.idProviderMode = source.getIdProviderMode();
            this.authConfig = !!source.getAuthConfig() ? source.getAuthConfig().clone() : null;
            this.permissions = !!source.getPermissions() ? source.getPermissions().clone() : null;
        }
    }

    fromJson(json: UserStoreJson): UserStoreBuilder {
        super.fromJson(json);
        this.key = new UserStoreKey(json.key);
        this.authConfig = json.authConfig ? AuthConfig.fromJson(json.authConfig) : null;
        this.idProviderMode = json.idProviderMode ? IdProviderMode[json.idProviderMode] : null;
        this.permissions = json.permissions ? UserStoreAccessControlList.fromJson(json.permissions) : null;
        return this;
    }

    setKey(key: string): UserStoreBuilder {
        this.key = UserStoreKey.fromString(key);
        return this;
    }

    setAuthConfig(authConfig: AuthConfig): UserStoreBuilder {
        this.authConfig = authConfig;
        return this;
    }

    setIdProviderMode(idProviderMode: IdProviderMode): UserStoreBuilder {
        this.idProviderMode = idProviderMode;
        return this;
    }

    setPermissions(permissions: UserStoreAccessControlList): UserStoreBuilder {
        this.permissions = permissions;
        return this;
    }

    setDisplayName(displayName: string): UserStoreBuilder {
        super.setDisplayName(displayName);
        return this;
    }

    setDescription(description: string): UserStoreBuilder {
        super.setDescription(description);
        return this;
    }

    build(): UserStore {
        return new UserStore(this);
    }
}