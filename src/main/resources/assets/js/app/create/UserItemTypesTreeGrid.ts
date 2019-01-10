import {UserTypeTreeGridItem, UserTypeTreeGridItemBuilder} from './UserTypeTreeGridItem';
import {UserItemTypesRowFormatter} from './UserItemTypesRowFormatter';
import {NewPrincipalEvent} from '../browse/NewPrincipalEvent';
import {UserTreeGridItemBuilder, UserTreeGridItemType} from '../browse/UserTreeGridItem';
import {ListIdProvidersRequest} from '../../api/graphql/userStore/ListIdProvidersRequest';
import {IdProvider, IdProviderBuilder} from '../principal/IdProvider';
import {User, UserBuilder} from '../principal/User';
import {Group, GroupBuilder} from '../principal/Group';
import {Role, RoleBuilder} from '../principal/Role';
import TreeGrid = api.ui.treegrid.TreeGrid;
import TreeNode = api.ui.treegrid.TreeNode;
import TreeGridBuilder = api.ui.treegrid.TreeGridBuilder;
import PrincipalKey = api.security.PrincipalKey;
import PrincipalType = api.security.PrincipalType;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import IsAuthenticatedRequest = api.security.auth.IsAuthenticatedRequest;
import i18n = api.util.i18n;
import IdProviderKey = api.security.IdProviderKey;

export class UserItemTypesTreeGrid extends TreeGrid<UserTypeTreeGridItem> {

    private userStores: IdProvider[];

    private manualUserStore: boolean;

    constructor() {
        const builder = new TreeGridBuilder<UserTypeTreeGridItem>().setColumnConfig([{
            name: i18n('field.name'),
            id: 'name',
            field: 'displayName',
            formatter: UserItemTypesRowFormatter.nameFormatter,
            style: {}
        }]).setPartialLoadEnabled(false)
            .setShowToolbar(false)
            .disableMultipleSelection(true)
            .setCheckableRows(false)
            .setToggleClickEnabled(false)
            .prependClasses('user-types-tree-grid');

        super(builder);

        this.manualUserStore = false;

        this.initEventHandlers();
    }

    fetchUserStores(): wemQ.Promise<IdProvider[]> {
        if (this.userStores) {
            return wemQ.resolve(this.userStores);
        }

        return new ListIdProvidersRequest().sendAndParse().then((userStores: IdProvider[]) => {
            this.userStores = userStores;
            this.toggleClass('flat', this.userStores.length === 1);
            return userStores;
        });
    }

    fetchRoot(): wemQ.Promise<UserTypeTreeGridItem[]> {
        return wemQ.spread(
            [new IsAuthenticatedRequest().sendAndParse(), this.fetchUserStores()],
            result => result.isUserAdmin(),
            reason => !api.DefaultErrorHandler.handle(reason)
        ).then(userIsAdmin => [
            new UserTypeTreeGridItemBuilder()
                .setUserItem(new UserBuilder()
                    .setKey(new PrincipalKey(IdProviderKey.SYSTEM, PrincipalType.USER, 'user'))
                    .setDisplayName(i18n('field.user'))
                    .build()).build(),
            new UserTypeTreeGridItemBuilder()
                .setUserItem(new GroupBuilder()
                    .setKey(new PrincipalKey(IdProviderKey.SYSTEM, PrincipalType.GROUP, 'user-group'))
                    .setDisplayName(i18n('field.userGroup'))
                    .build()).build(),
            ...((this.manualUserStore || !userIsAdmin) ? [] : [
                    new UserTypeTreeGridItemBuilder()
                        .setUserItem(new IdProviderBuilder()
                            .setKey(IdProviderKey.SYSTEM.toString())
                            .setDisplayName(i18n('field.userStore'))
                            .build()).build(),
                    new UserTypeTreeGridItemBuilder()
                        .setUserItem(new RoleBuilder()
                            .setKey(new PrincipalKey(IdProviderKey.SYSTEM, PrincipalType.ROLE, 'role'))
                            .setDisplayName(i18n('field.role'))
                            .build()).build(),
                ])
        ]);
    }

    getDataId(data: UserTypeTreeGridItem): string {
        return data.getId();
    }

    hasChildren(item: UserTypeTreeGridItem): boolean {
        return item.hasChildren();
    }

    fetchChildren(parentNode: TreeNode<UserTypeTreeGridItem>): wemQ.Promise<UserTypeTreeGridItem[]> {

        return this.fetchUserStores().then((userStores: IdProvider[]) => {
            if (userStores.length > 1) {
                return userStores.map((userStore: IdProvider) => new UserTypeTreeGridItemBuilder()
                    .setUserItem(new IdProviderBuilder()
                        .setKey(userStore.getKey().toString())
                        .setDisplayName(userStore.getDisplayName())
                        .build()).build());
            } else if (userStores.length === 1) {
                const userItem = parentNode.getData().getUserItem();
                if (userItem instanceof User) {
                    const item = new UserTreeGridItemBuilder().setUserStore(userStores[0]).setType(UserTreeGridItemType.USERS).build();
                    new NewPrincipalEvent([item]).fire();
                } else if (userItem instanceof Group) {
                    const item = new UserTreeGridItemBuilder().setUserStore(userStores[0]).setType(UserTreeGridItemType.GROUPS).build();
                    new NewPrincipalEvent([item]).fire();
                }
            }
            return [];
        });
    }

    setUserStore(userStore: IdProvider) {
        this.userStores = [userStore];
        this.manualUserStore = true;
        this.addClass('flat');
    }

    private initEventHandlers() {
        this.getGrid().subscribeOnClick((event, data) => {
            event.preventDefault();
            event.stopPropagation();

            const node = this.getGrid().getDataView().getItem(data.row);
            const userItem = node.getData().getUserItem();
            if (node.getData().hasChildren()) {
                this.toggleNode(node);
                ResponsiveManager.fireResizeEvent();
            } else {
                const isRootNode = node.calcLevel() === 1;
                if (userItem instanceof IdProvider) {
                    if (isRootNode) {
                        new NewPrincipalEvent([new UserTreeGridItemBuilder().setType(UserTreeGridItemType.USER_STORE).build()]).fire();
                    } else if (node.getParent().getData().getUserItem() instanceof User) {
                        const item = new UserTreeGridItemBuilder().setUserStore(userItem).setType(UserTreeGridItemType.USERS).build();
                        new NewPrincipalEvent([item]).fire();
                    } else if (node.getParent().getData().getUserItem() instanceof Group) {
                        const item = new UserTreeGridItemBuilder().setUserStore(userItem).setType(UserTreeGridItemType.GROUPS).build();
                        new NewPrincipalEvent([item]).fire();
                    }
                } else if (userItem instanceof Role) {
                    new NewPrincipalEvent([new UserTreeGridItemBuilder().setType(UserTreeGridItemType.ROLES).build()]).fire();
                }
            }
        });
    }

    clearUserStores() {
        this.userStores = null;
        this.manualUserStore = false;
        this.removeClass('flat');
    }
}
