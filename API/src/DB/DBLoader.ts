const sql = require('mssql');

const sqlConfigMigration = {
  user: 'sa',//process.env.DB_USER,
  password: 'RoTo3402',//process.env.DB_PWD,
  database: 'MIGRATION',//process.env.DB_NAME,
  server: 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    //encrypt: true, // for azure
    //trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};

// Server=tcp:yedevsqlsrvr.database.windows.net,1433;Initial Catalog=yedevsqldb;Persist Security Info=False;User ID=yedevsqluser;Password= 11pAeH22;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;';

const sqlConfigYE = {
  user: 'yedevsqluser',//process.env.DB_USER,
  password: '11pAeH22',//process.env.DB_PWD,
  database: 'yedevsqldb',//process.env.DB_NAME,
  server: 'yedevsqlsrvr.database.windows.net',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: false // change to true for local dev / self-signed certs
  }
};

class DBLoader {

  connect() {

  };

  private async execQuery(cmdText: string): Promise<any> {
    let data: any = undefined;
    try {
      await sql.connect(sqlConfigYE);
      const result = await sql.query(cmdText);
      data = result.recordset;
    } catch (err) {
      console.dir(err)
      // ... error checks
    }
    return data;
  }

  async loadBatch():Promise<Array<any>> {
    return await this.execQuery(`select BatchId, BatchName from scheduler.tBatch`);
  }

  async loadJob():Promise<Array<any>> {
    return await this.execQuery(`select JobId, JobName from scheduler.tJob`);
  }

  async loadBatchJob():Promise<Array<any>> {
    return await this.execQuery(`select BatchId, JobId from scheduler.tBatchJob`);
  }

  async loadBatchJobRelation():Promise<Array<any>> {
    return await this.execQuery(`select BatchId, JobId, ParentJobId from scheduler.tBatchJobRelation`);
  }
  
}

export default DBLoader;


// const sql = require('mssql')
// 

// export const getInputData = async  () => {
//  try {
//   // make sure that any items are correctly URL encoded in the connection string
//   await sql.connect(sqlConfig)
//   const result = await sql.query`select * from dbo.INPUT`;
//   console.dir(result)
//  } catch (err) {
//   console.dir(err)
//   // ... error checks
//  }
// }