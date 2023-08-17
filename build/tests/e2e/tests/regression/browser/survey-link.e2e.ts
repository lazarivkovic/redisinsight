import { DatabaseHelper } from '../../../helpers/database';
import { env, rte } from '../../../helpers/constants';
import { BrowserPage, MyRedisDatabasePage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
// import { Common } from '../../../helpers/common';
import { DatabaseAPIRequests } from '../../../helpers/api/api-database';

const browserPage = new BrowserPage();
const myRedisDatabasePage = new MyRedisDatabasePage();
const databaseHelper = new DatabaseHelper();
const databaseAPIRequests = new DatabaseAPIRequests();

// const externalPageLink = 'https://www.surveymonkey.com/r/redisinsight';

fixture `User Survey`
    .meta({
        type: 'regression',
        rte: rte.standalone,
        env: env.web
    })
    .page(commonUrl)
    .beforeEach(async() => {
        await databaseHelper.acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig);
    });
test('Verify that user can use survey link', async t => {
    // Verify that user can see survey link on any page inside of DB
    // Browser page
    await t.expect(browserPage.userSurveyLink.visible).ok('Survey Link is not displayed');
    // update after resolving testcafe Native Automation mode limitations
    // await t.click(browserPage.userSurveyLink);
    // // Verify that when users click on RI survey, they are redirected to https://www.surveymonkey.com/r/redisinsight
    // await Common.checkURL(externalPageLink);
    // await t.switchToParentWindow();
    // Workbench page
    await t.click(myRedisDatabasePage.NavigationPanel.workbenchButton);
    await t.expect(browserPage.userSurveyLink.visible).ok('Survey Link is not displayed');
    // Slow Log page
    await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
    await t.expect(browserPage.userSurveyLink.visible).ok('Survey Link is not displayed');
    // PubSub page
    await t.click(myRedisDatabasePage.NavigationPanel.pubSubButton);
    await t.expect(browserPage.userSurveyLink.visible).ok('Survey Link is not displayed');
    // Verify that user cannot see survey link for list of databases page
    await t.click(myRedisDatabasePage.NavigationPanel.myRedisDBButton);
    await t.expect(browserPage.userSurveyLink.exists).notOk('Survey Link is visible');
    // Verify that user cannot see survey link for welcome page
    await databaseAPIRequests.deleteAllDatabasesApi();
    await browserPage.reloadPage();
    await t.expect(browserPage.userSurveyLink.exists).notOk('Survey Link is visible');
});
