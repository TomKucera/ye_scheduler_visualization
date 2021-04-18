import { tBatch, tJob, tBatchJob, tBatchJobRelation, SchedulerData } from './Types';

import scheduler_data from './scheduler_data.json';

class DataProvider {

  static getFirstBatch(withRelations: boolean = true): tBatch | undefined {

    if (!scheduler_data.tBatch.length) {
      return undefined;
    }

    if (!withRelations) {
      return scheduler_data.tBatch[0];
    }

    const batch_id = (scheduler_data.tBatchJobRelation.length) ? scheduler_data.tBatchJobRelation[0].BatchId : undefined;
    const batches = scheduler_data.tBatch.filter(b=> b.BatchId === batch_id);
    return (batches.length) ? batches[0] : undefined;
  }

  static getData():SchedulerData {
    return scheduler_data;
  }

}

export default DataProvider;