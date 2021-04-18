export type tBatch = { BatchId: string, BatchName: string };
export type tJob = { JobId: string, JobName: string };
export type tBatchJob = { BatchId: string, JobId: string };
export type tBatchJobRelation = { BatchId: string, JobId: string, ParentJobId: string };
export type SchedulerData = { tBatch: Array<tBatch>, tJob: Array<tJob>, tBatchJob: Array<tBatchJob>, tBatchJobRelation: Array<tBatchJobRelation> };
