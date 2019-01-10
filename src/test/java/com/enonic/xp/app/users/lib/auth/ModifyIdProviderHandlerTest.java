package com.enonic.xp.app.users.lib.auth;

import java.util.Optional;

import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;

import com.enonic.xp.security.EditableIdProvider;
import com.enonic.xp.security.IdProvider;
import com.enonic.xp.security.IdProviderEditor;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.UpdateIdProviderParams;
import com.enonic.xp.security.acl.IdProviderAccess;
import com.enonic.xp.security.acl.IdProviderAccessControlEntry;
import com.enonic.xp.security.acl.IdProviderAccessControlList;
import com.enonic.xp.testing.ScriptTestSupport;

import static org.junit.Assert.*;

public class ModifyIdProviderHandlerTest
    extends ScriptTestSupport
{
    private SecurityService securityService;

    @Override
    public void initialize()
        throws Exception
    {
        super.initialize();
        this.securityService = Mockito.mock( SecurityService.class );
        addService( SecurityService.class, this.securityService );
    }

    @Test
    public void testModifyUserStore()
    {
        Mockito.when( securityService.getIdProvider( Mockito.any() ) ).thenReturn( TestDataFixtures.getTestBlankUserStore() );
        Mockito.when( securityService.getPrincipal( Mockito.any() ) ).thenReturn( Optional.empty() ).thenReturn(
            (Optional) Optional.of( TestDataFixtures.getTestGroup() ) );
        Mockito.when( securityService.updateIdProvider( Mockito.isA( UpdateIdProviderParams.class ) ) ).thenAnswer(
            invocationOnMock -> invokeUpdate( (UpdateIdProviderParams) invocationOnMock.getArguments()[0] ) );

        runFunction( "/com/enonic/xp/app/users/lib/auth/modifyUserStore-test.js", "modifyUserStore" );
    }

    private IdProvider invokeUpdate( final UpdateIdProviderParams params )
    {
        final IdProviderEditor editor = params.getEditor();
        Assert.assertNotNull( editor );

        final IdProviderAccessControlList permissions = params.getIdProviderPermissions();
        Assert.assertNotNull( "Permissions should not be empty", permissions );
        final IdProviderAccessControlEntry entry = permissions.getEntry( PrincipalKey.from( "group:myUserStore:group" ) );
        assertNotNull( entry );
        assertEquals( entry.getAccess(), IdProviderAccess.CREATE_USERS );
        assertEquals( params.getIdProviderPermissions().getAllPrincipals().getSize(), 1 );

        final EditableIdProvider editable = new EditableIdProvider( TestDataFixtures.getTestBlankUserStore() );

        editor.edit( editable );
        return editable.build();
    }

    @Test
    public void testModifyUserStoreWithNullValues()
    {
        Mockito.when( securityService.getIdProvider( Mockito.any() ) ).thenReturn( TestDataFixtures.getTestUserStore() );
        Mockito.when( securityService.updateIdProvider( Mockito.isA( UpdateIdProviderParams.class ) ) ).thenAnswer(
            invocationOnMock -> invokeUpdateWithNullValues( (UpdateIdProviderParams) invocationOnMock.getArguments()[0] ) );

        runFunction( "/com/enonic/xp/app/users/lib/auth/modifyUserStore-test.js", "modifyUserStoreWithNullValues" );
    }

    private IdProvider invokeUpdateWithNullValues( final UpdateIdProviderParams params )
    {
        final IdProviderEditor editor = params.getEditor();
        Assert.assertNotNull( editor );

        final EditableIdProvider editable = new EditableIdProvider( TestDataFixtures.getTestUserStore() );

        editor.edit( editable );
        return editable.build();
    }
}
