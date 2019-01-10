import {GraphQlRequest} from '../GraphQlRequest';
import {DeleteIdProviderResult} from './DeleteIdProviderResult';
import {DeleteIdProviderResultJson} from './DeleteIdProviderResultJson';
import IdProviderKey = api.security.IdProviderKey;

type DeleteIdProvidersResult = {
    deleteUserStores: DeleteIdProviderResultJson[]
};

export class DeleteIdProviderRequest
    extends GraphQlRequest<any, DeleteIdProviderResult[]> {

    private keys: IdProviderKey[];

    setKeys(keys: IdProviderKey[]): DeleteIdProviderRequest {
        this.keys = keys.slice(0);
        return this;
    }

    getVariables() {
        let vars = super.getVariables();
        vars['keys'] = this.keys.map(memberKey => memberKey.toString());
        return vars;
    }

    getMutation() {
        return `mutation ($keys: [String]!) {
            deleteUserStores(keys: $keys) {
                userStoreKey
                deleted
                reason
            }
        }`;
    }

    sendAndParse(): wemQ.Promise<DeleteIdProviderResult[]> {
        return this.mutate().then((response: DeleteIdProvidersResult) => {
            return response.deleteUserStores.map(DeleteIdProviderResult.fromJson);
        });
    }

}
