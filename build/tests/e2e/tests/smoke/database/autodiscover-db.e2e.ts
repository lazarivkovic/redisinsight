import { t } from 'testcafe';
import { DatabaseHelper } from '../../../helpers/database';
import {
    commonUrl,
    redisEnterpriseClusterConfig,
    cloudDatabaseConfig
} from '../../../helpers/conf';
import { rte } from '../../../helpers/constants';
import { MyRedisDatabasePage } from '../../../pageObjects';

const myRedisDatabasePage = new MyRedisDatabasePage();
const databaseHelper = new DatabaseHelper();

let databaseName: string;

fixture `Add database`
    .meta({ type: 'smoke' })
    .page(commonUrl)
    .beforeEach(async() => {
        await databaseHelper.acceptLicenseTerms();
    });
test
    .meta({ rte: rte.reCluster })
    .after(async() => {
        await databaseHelper.deleteDatabase(redisEnterpriseClusterConfig.databaseName);
    })('Verify that user can add database from RE Cluster via auto-discover flow', async() => {
        await databaseHelper.addNewREClusterDatabase(redisEnterpriseClusterConfig);
        // Verify that user can see an indicator of databases that are added using autodiscovery and not opened yet
        // Verify new connection badge for RE cluster
        await myRedisDatabasePage.verifyDatabaseStatusIsVisible(redisEnterpriseClusterConfig.databaseName);
    });
test
    .meta({ rte: rte.reCloud })
    .after(async() => {
        await databaseHelper.deleteDatabase(cloudDatabaseConfig.databaseName);
    })('Verify that user can add database from RE Cloud', async() => {
        await databaseHelper.addRECloudDatabase(cloudDatabaseConfig);
        // Verify new connection badge for RE cloud
        await myRedisDatabasePage.verifyDatabaseStatusIsVisible(cloudDatabaseConfig.databaseName);
        // Verify redis stack icon for RE Cloud with all 5 modules
        await t.expect(myRedisDatabasePage.redisStackIcon.visible).ok('Redis Stack icon not found for RE Cloud db with all 5 modules');
    });
test
    .meta({ rte: rte.reCloud })
    .after(async() => {
        // await deleteDatabase(databaseName);
    })('Verify that user can connect to the RE Cloud database via auto-discover flow', async t => {
        // Verify that user can see the Cloud auto-discovery option selected by default when switching to the auto-discovery of databases
        databaseName = await databaseHelper.autodiscoverRECloudDatabase(cloudDatabaseConfig.accessKey, cloudDatabaseConfig.secretKey);
        // uncomment when fixed db will be added to cloud subscription
        // await myRedisDatabasePage.clickOnDBByName(databaseName);
        // // Verify that user can add database from fixed subscription
        // await t.expect(Common.getPageUrl()).contains('browser', 'The added RE Cloud database not opened');
    });
