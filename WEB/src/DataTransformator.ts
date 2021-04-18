import { tBatch, tJob, tBatchJob, tBatchJobRelation, SchedulerData } from './Types';

import so from './scheduler_options.json';

class DataTransformator {

  private static batchToNode(batch: tBatch, node_id: number): vis.Node {
    return { ...so.node.batch, id: node_id, label: batch.BatchName, level: 1 };
  };

  private static jobToNode(job: tJob, node_id: number): vis.Node {
    return { ...so.node.job, id: node_id, label: job.JobName, level: 2 };
  };

  private static toBatchIds (data: SchedulerData): Array<string> {
    return data.tBatch.map(b => b.BatchId);
  }

  private static filterByBatches (data: SchedulerData, batch_ids:Array<string>):SchedulerData{
    const tBatch = data.tBatch.filter(b => batch_ids.indexOf(b.BatchId) >= 0);
    const tBatchJob = data.tBatchJob.filter(bj => batch_ids.indexOf(bj.BatchId) >= 0);
    const tBatchJobRelation = data.tBatchJobRelation.filter(bj => batch_ids.indexOf(bj.BatchId) >= 0);

    return {tBatch, tBatchJob, tBatchJobRelation, tJob: data.tJob};
  }

  private static toVis(data: SchedulerData): vis.Data{
    
    const nodes: Array<vis.Node> = [];
    const edges: Array<vis.Edge> = [];

    const entityMap = {};

    // batch nodes
    data.tBatch.forEach((b, i) => {
      const node_id = nodes.length + 1;
      entityMap[b.BatchId] = {entity: b, node_id};
      nodes.push(DataTransformator.batchToNode(b, node_id));
    });
    
    // job nodes (with edges to batches)
    const batch_job_ids = data.tBatchJob.map(bj => bj.JobId);
    const jobs = data.tJob.filter(j => batch_job_ids.indexOf(j.JobId) >= 0);
    jobs.forEach(j => {
      const node_id = nodes.length + 1;
      entityMap[j.JobId] = {entity: j, node_id}
      nodes.push(DataTransformator.jobToNode(j, node_id));

      const batch_job_edges = data.tBatchJob
        .filter(bj => bj.JobId === j.JobId)
        .map(bj => {
          const batch_node_id = entityMap[bj.BatchId].node_id;
          return { ...so.edge.jobToBatch, from: node_id, to: batch_node_id };
        });

      edges.push(...batch_job_edges);
    });

    // batch job relation edges
    data.tBatchJobRelation.forEach(bjr => {
      const node_id_job = entityMap[bjr.JobId].node_id;
      const node_id_parent_job = entityMap[bjr.ParentJobId].node_id;
      edges.push({ ...so.edge.jobToJob, from: node_id_job, to: node_id_parent_job });
    })

    return { nodes, edges };
  }

  static transformToVis(data: SchedulerData, batch_id?: string): vis.Data {
    const batch_ids: Array<string> = batch_id ? [batch_id] : DataTransformator.toBatchIds(data);
    const dataFilteredByBatches = DataTransformator.filterByBatches(data, batch_ids);
    return DataTransformator.toVis(dataFilteredByBatches);
  };

};

export default DataTransformator;