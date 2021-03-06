/**
 * Created on 12.04.2018.
 */

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const userWizard = require('../page_objects/wizardpanel/user.wizard');
const changePasswordDialog = require('../page_objects/wizardpanel/change.password.dialog');
const testUtils = require('../libs/test.utils');
const userItemsBuilder = require('../libs/userItems.builder.js');
const appConst = require('../libs/app_const');

describe('User Wizard generate password spec', function () {
    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();
    let testUser;


    it('WHEN `User` wizard is opened THEN `generate` and `show` links should be displayed',
        () => {
            return testUtils.clickOnSystemOpenUserWizard().then(()=> {
                return userWizard.isGenerateDisplayed();
            }).then((result)=> {
                testUtils.saveScreenshot('generate_password_link');
                return assert.isTrue(result, "generate password link should be displayed");
            }).then(()=> {
                return userWizard.isShowLinkDisplayed();
            }).then((result)=> {
                return assert.isTrue(result, "show-link should be displayed");
            })
        });

    it('GIVEN user-wizard is opened WHEN `Generate` link has been pressed THEN password should be generated',
        () => {
            return testUtils.clickOnSystemOpenUserWizard().then(()=> {
                return userWizard.clickOnGenerateLink();
            }).then(()=> {
                testUtils.saveScreenshot('generate_password_link_clicked');
                return userWizard.clickOnShowLink();
            }).then(()=> {
                return userWizard.getTextInPasswordInput();
            }).then((result)=> {
                return assert.isTrue(result.length > 0, "new password should be generated");
            })
        });

    it('GIVEN user-wizard is opened WHEN `Show` password link has been clicked THEN `Hide` link should appear',
        () => {
            return testUtils.clickOnSystemOpenUserWizard().then(()=> {
                return userWizard.clickOnShowLink();
            }).then(()=> {
                testUtils.saveScreenshot('show_password_link_clicked');
                return userWizard.isHidePasswordLinkDisplayed();
            }).then(result=> {
                return assert.isTrue(result, "`Hide` link is getting displayed");
            })
        });


    beforeEach(() => testUtils.navigateToUsersApp());
    afterEach(() => testUtils.doCloseUsersApp());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
