const webDriverHelper = require('./../libs/WebDriverHelper');
const appConst = require('./../libs/app_const');
const path = require('path');

function Page() {
}

Page.prototype.getBrowser = function () {
    return webDriverHelper.browser;
};

Page.prototype.numberOfElements = function (selector) {
    return this.getBrowser().elements(selector).then(res => {
        return res.value.filter(el => {
            return this.getBrowser().elementIdDisplayed(el.ELEMENT);
        })
    }).then(result => {
        return Object.keys(result).length;
    });
};

Page.prototype.getTitle = function () {
    return this.getBrowser().getTitle();
};

Page.prototype.keys = function (value) {
    return this.getBrowser().keys(value);
};
Page.prototype.isVisible = function (selector) {
    return this.getBrowser().isVisible(selector);
};

Page.prototype.isEnabled = function (selector) {
    return this.getBrowser().isEnabled(selector);
};

Page.prototype.waitForVisible = function (selector, ms) {
    return this.getBrowser().waitForVisible(selector, ms);
};

Page.prototype.waitForNotVisible = function (selector, ms) {
    return this.getBrowser().waitForVisible(selector, ms, true);
};
Page.prototype.waitForSpinnerNotVisible1 = function () {
    return this.getBrowser().waitForVisible(`//div[@class='spinner']`, appConst.TIMEOUT_4, true).catch(err => {
        console.log('spinner is still visible after a the interval ');
        throw Error('spinner is still visible after a the interval ' + ` ` + appConst.TIMEOUT_3);
    })
};
Page.prototype.waitForSpinnerNotVisible = function () {
    let message = "Spinner still displayed! timeout is " + appConst.TIMEOUT_7;
    return this.getBrowser().waitUntil(() => {
        return this.isElementNotDisplayed(`//div[@class='spinner']`);
    }, appConst.TIMEOUT_7, message);
};
Page.prototype.waitForSpinnerVisible = function () {
    return this.getBrowser().waitForVisible(`//div[@class='spinner']`, appConst.TIMEOUT_3).catch(err => {
        console.log('spinner should be visible in 3 sec');
        throw Error('spinner should visible in 3 sec ' + ` ` + appConst.TIMEOUT_3);
    })
};

Page.prototype.doClick = function (selector) {
    return this.getBrowser().element(selector).then(result => {
        return this.getBrowser().click(selector);
    }).catch(function (err) {
        throw Error(err.message + ` ` + selector);
    })
};
//TODO workaround for issue in WebdriverIO
Page.prototype.typeTextInInput = function (selector, text) {
    return this.getBrowser().setValue(selector, text).then(() => {
        return this.getTextFromInput(selector).then(result => {
            if (!result || 0 === result.length) {
                return this.getBrowser().setValue(selector, text);
            }
        })
    }).catch(err => {
        throw new Error('text was not set in the input ' + err);
    })
};

Page.prototype.clearElement = function (selector) {
    return this.getBrowser().clearElement(selector);
};
Page.prototype.elements = function (selector) {
    return this.getBrowser().elements(selector);
};
Page.prototype.element = function (selector) {
    return this.getBrowser().element(selector);
};

Page.prototype.getText = function (selector) {
    return this.getBrowser().getText(selector);
};
Page.prototype.waitForExist = function (selector, ms) {
    return this.getBrowser().waitForExist(selector, ms);
};

Page.prototype.waitForEnabled = function (selector, ms) {
    return this.getBrowser().waitForEnabled(selector, ms);
};

Page.prototype.waitForDisabled = function (selector, ms) {
    return this.getBrowser().waitForEnabled(selector, ms, true);
};

Page.prototype.getText = function (selector) {
    return this.getBrowser().getText(selector);
};

Page.prototype.getElementId = function (ele) {
    return ele.value.ELEMENT;
};
Page.prototype.isAttributePresent = function (selector, atrName) {
    return this.getBrowser().getAttribute(selector, atrName).then(result => {
        return result != null;
    })
};

Page.prototype.getDisplayedElements = function (selector) {
    return this.getBrowser().elements(selector).then(elems => {
        let pr = elems.value.map(el => this.getBrowser().elementIdDisplayed(el.ELEMENT));
        return Promise.all(pr).then(result => elems.value.filter((el, i) => result[i].value));
    })
};

Page.prototype.getTextFromElements = function (selector) {
    let json = [];
    return this.getBrowser().elements(selector).then(result => {
        result.value.forEach((val) => {
            json.push(this.getBrowser().elementIdText(val.ELEMENT));
        });
        return Promise.all(json).then((p) => {
            return p;
        });
    }).then(responses => {
        let res = [];
        responses.forEach((str) => {
            return res.push(str.value);
        });
        return res;
    });
};

Page.prototype.getTextFromInput = function (selector) {
    return this.getBrowser().getAttribute(selector, 'value');
};

Page.prototype.saveScreenshot = function (name) {
    let screenshotsDir = path.join(__dirname, '/../build/screenshots/');
    return this.getBrowser().saveScreenshot(screenshotsDir + name + '.png').then(() => {
        console.log('screenshot is saved ' + name);
    }).catch(err => {
        console.log('screenshot was not saved ' + screenshotsDir + ' ' + err);
    })
};

Page.prototype.getAttribute = function (selector, attributeName) {
    return this.getBrowser().getAttribute(selector, attributeName);
};

Page.prototype.waitForNotificationMessage = function () {
    return this.getBrowser().waitForVisible(`//div[@class='notification-content']/span`, appConst.TIMEOUT_3).catch(err => {
        throw new Error('Error when wait for notification message: ' + err);
    }).then(() => {
        return this.getBrowser().getText(`//div[@class='notification-content']/span`);
    })
};
Page.prototype.waitForExpectedNotificationMessage = function (expectedMessage) {
    let selector = `//div[contains(@id,'NotificationMessage')]//div[contains(@class,'notification-content')]//span[contains(.,'${expectedMessage}')]`;
    return this.getBrowser().waitForVisible(selector, appConst.TIMEOUT_3).catch((err) => {
        this.saveScreenshot('err_notification_mess');
        throw new Error('expected notification message was not shown! ' + err);
    })
};

Page.prototype.waitForErrorNotificationMessage = function () {
    var selector = `//div[contains(@id,'NotificationMessage') and @class='notification error']//div[contains(@class,'notification-content')]/span`;
    return this.getBrowser().waitForVisible(selector, appConst.TIMEOUT_3).then(() => {
        return this.getBrowser().getText(selector);
    })
};
Page.prototype.doRightClick = function (selector) {
    return this.getBrowser().element(selector).then(result => {
        return this.getBrowser().rightClick(selector, 0, 0);
    }).catch(function (err) {
        throw Error(err.message + ` ` + selector);
    })
};
Page.prototype.scroll = function (xoffset, yoffset) {
    return this.getBrowser().scroll("//div[contains(@id,'UserItemsTreeGrid') and not(contains(@style,'hidden'))]", xoffset, yoffset).catch(
        function (err) {
            throw Error(err.message + ` when scroll`);
        })
};

Page.prototype.isElementDisplayed = function (selector) {
    return this.getDisplayedElements(selector).then(result => {
        return result.length > 0;
    })
};
Page.prototype.isElementNotDisplayed = function (selector) {
    return this.getDisplayedElements(selector).then(result => {
        return result.length == 0;
    })
};
module.exports = new Page();
