import { tBatch, tJob, tBatchJob, tBatchJobRelation, SchedulerData } from './Types';

import so from './scheduler_options.json';

type BatchColors = { jobToBatch: string, jobToJob: string };
type JobInBatch = 'InNone' | 'InFiltered' | 'InAnyOther';

type RootJob = { job: tJob, batch_ids: Array<string>};
type ParentJob = {batch_id: string, job_id: string};
type ChildJob = { job: tJob, parents: Array<ParentJob>};

class DataTransformator {

  private static DefaultBatchLevel = 1;
  private static DefaultRootJobLevel = 2;

  private static batchToNode(batch: tBatch, node_id: number, colors: BatchColors, level: number): vis.Node {
    const node = {
      ...so.node.batch,
      id: node_id,
      label: batch.BatchName,
      level: level
    };
    node.color = { ...node.color, background: colors.jobToJob };
    return node;
  };

  // private static jobToNode(job: tJob, node_id: number, inBatch: JobInBatch): vis.Node {
  //   const level = (inBatch === 'InFiltered') ? 2 : 5;
  //   const node: vis.Node = { ...so.node.job, id: node_id, label: job.JobName, level };
  //   return node;
  // };

  private static jobToNode(job: tJob, node_id: number, level: number): vis.Node {
    const node: vis.Node = { ...so.node.job, id: node_id, label: job.JobName, level };
    return node;
  };

  private static toBatchIds(data: SchedulerData): Array<string> {
    return data.tBatch.map(b => b.BatchId);
  }

  private static filterByBatches(data: SchedulerData, batch_ids: Array<string>): SchedulerData {
    const tBatch = data.tBatch.filter(b => batch_ids.indexOf(b.BatchId) >= 0);
    const tBatchJob = data.tBatchJob.filter(bj => batch_ids.indexOf(bj.BatchId) >= 0);
    const tBatchJobRelation = data.tBatchJobRelation.filter(bj => batch_ids.indexOf(bj.BatchId) >= 0);

    return { tBatch, tBatchJob, tBatchJobRelation, tJob: data.tJob };
  }

  private static findRootJobs(data: SchedulerData, batchIds: Array<string>): Array<RootJob> {
    const batchJob = data.tBatchJob.filter(bj => batchIds.indexOf(bj.BatchId) >= 0);
    const childJobIds = data.tBatchJobRelation.filter(bjr => batchIds.indexOf(bjr.BatchId) >= 0).map(bjr => bjr.JobId);

    const rootJobs : Array<RootJob> = [];

    data.tJob.forEach(j => {
      const isChildJob = (childJobIds.indexOf(j.JobId) >= 0);
      if (isChildJob) {
        return;
      }
      const isInBatchIds = batchJob.filter(bj => bj.JobId === j.JobId).map(bj => bj.BatchId);
      if (isInBatchIds.length){
        rootJobs.push({ job: j, batch_ids: isInBatchIds});
      }
    });

    return rootJobs;
  }

  private static findChildJobs(data: SchedulerData, batchIds: Array<string>, parentJobIds: Array<string>): Array<ChildJob> {
    const batchJobRelation = data.tBatchJobRelation.filter(bjr => (batchIds.indexOf(bjr.BatchId) >= 0) && (parentJobIds.indexOf(bjr.ParentJobId) >=0));
    const childJobIds = batchJobRelation.map(bjr => bjr.JobId);
    const childJobs = data.tJob.filter(j=> childJobIds.indexOf(j.JobId) >= 0);

    return childJobs.map((j):ChildJob=>{
      return {
        job: j,
        parents: batchJobRelation.filter(bjr => bjr.JobId === j.JobId).map((bjr):ParentJob =>{ 
          return {  batch_id: bjr.BatchId, job_id: bjr.ParentJobId};
         })
      };
    });
  }

  private static toVis(data: SchedulerData, batch_ids: Array<string>): vis.Data {
    const nodes: Array<vis.Node> = [];
    const edges: Array<vis.Edge> = [];

    const entityMap = {};

    const all_batch_ids = this.toBatchIds(data);
    const showJobBatchEdges = (batch_ids.length > 1);

    const addChildJobs = (parentJobIds: Array<string>, level: number) => {
      const childJobs = this.findChildJobs(data, batch_ids, parentJobIds);
      // console.log('addChildJobs batch_ids', batch_ids);
      // console.log('addChildJobs parentJobIds', parentJobIds);
      // console.log('addChildJobs childJobs', childJobs);
      // console.log('addChildJobs entityMap', entityMap);

      childJobs.forEach(j=>{
        // node
        const node_id = nodes.length + 1;
        entityMap[j.job.JobId] = { entity: j.job, node_id };
        nodes.push(DataTransformator.jobToNode(j.job, node_id, level));
        // edges
        j.parents.forEach(parent => {
          const batch_index = all_batch_ids.indexOf(parent.batch_id);
          const batch_colors = so.edge.colors[batch_index];
          const batch_node_id = entityMap[parent.batch_id].node_id;
          // toBatch
          if (showJobBatchEdges){
            edges.push({
              color: batch_colors.jobToBatch,
              width: so.edge.width.jobToBatch,
              from: node_id,
              to: batch_node_id
            });
          }
          // toJobs
          const parent_node_id = entityMap[parent.job_id].node_id;
          edges.push({
            color: batch_colors.jobToJob,
            width: so.edge.width.jobToJob,
            from: node_id,
            to: parent_node_id
          });

        });
      });

      if (childJobs.length) {
        const childJobIds = childJobs.map(j => j.job.JobId);
        addChildJobs(childJobIds, level + 1);
      }
    };

    // batches
    data.tBatch.forEach((b, i) => {
      if (batch_ids.indexOf(b.BatchId)<0){
        return;
      }
      const batch_index = all_batch_ids.indexOf(b.BatchId);
      const batch_colors = so.edge.colors[batch_index];
      const node_id = nodes.length + 1;
      entityMap[b.BatchId] = { entity: b, node_id };
      nodes.push(this.batchToNode(b, node_id, batch_colors, this.DefaultBatchLevel));
    });

    // root jobs
    const rootJobs = this.findRootJobs(data, batch_ids);
    rootJobs.forEach(rj =>{
      // node
      const node_id = nodes.length + 1;
      entityMap[rj.job.JobId] = { entity: rj.job, node_id };
      nodes.push(DataTransformator.jobToNode(rj.job, node_id, this.DefaultRootJobLevel));
      // edges
      const batch_job_edges = rj.batch_ids.map(batchId => {
        const batch_index = all_batch_ids.indexOf(batchId);
        const batch_colors = so.edge.colors[batch_index];
        const batch_node_id = entityMap[batchId].node_id;
        return {
          color: batch_colors.jobToBatch,
          width: so.edge.width.jobToBatch,
          from: node_id,
          to: batch_node_id
        };
      });
      edges.push(...batch_job_edges);
    });

    // child jobs
    const rootJobIds = rootJobs.map(rj=> rj.job.JobId);
    addChildJobs( rootJobIds, this.DefaultRootJobLevel + 1);

    return { nodes, edges };
  };

  private static toVisOld(data: SchedulerData, data_full: SchedulerData): vis.Data {

    const nodes: Array<vis.Node> = [];
    const edges: Array<vis.Edge> = [];

    const entityMap = {};

    const all_batch_ids = data_full.tBatch.map(b => b.BatchId);

    // batch nodes
    data.tBatch.forEach((b, i) => {
      const batch_index = all_batch_ids.indexOf(b.BatchId);
      const batch_colors = so.edge.colors[batch_index];

      console.log("batch_colors", batch_colors);
      const node_id = nodes.length + 1;
      entityMap[b.BatchId] = { entity: b, node_id };
      nodes.push(this.batchToNode(b, node_id, batch_colors, 1));
    });

    // job nodes (with edges to batches)
    const batch_job_ids = data.tBatchJob.map(bj => bj.JobId);
    //const jobsInBatch = data.tJob.filter(j => batch_job_ids.indexOf(j.JobId) >= 0);
    //const jobsSingle = data.tJob.filter(j => batch_job_ids.indexOf(j.JobId) >= 0);

    data_full.tJob.forEach(j => {
      const isInBatch = batch_job_ids.indexOf(j.JobId) >= 0; // in filtered batches
      let jobInBatch: JobInBatch = isInBatch ? 'InFiltered' : 'InNone';
      if (jobInBatch === 'InNone') {
        // is in any other batch?
        const all_batch_job_ids = data_full.tBatchJob.map(bj => bj.JobId);
        if (all_batch_job_ids.indexOf(j.JobId) >= 0) {
          jobInBatch = 'InAnyOther';
        }
      }

      const node_id = nodes.length + 1;
      entityMap[j.JobId] = { entity: j, node_id }
      //nodes.push(DataTransformator.jobToNode(j, node_id, jobInBatch));
      nodes.push(DataTransformator.jobToNode(j, node_id, 2));

      if (isInBatch) {
        const batch_job_edges = data.tBatchJob
          .filter(bj => bj.JobId === j.JobId)
          .map(bj => {
            const batch_index = all_batch_ids.indexOf(bj.BatchId);
            const batch_colors = so.edge.colors[batch_index];
            const batch_node_id = entityMap[bj.BatchId].node_id;
            return {
              color: batch_colors.jobToBatch,
              width: so.edge.width.jobToBatch,
              from: node_id,
              to: batch_node_id
            };
          });

        edges.push(...batch_job_edges);

      }

    });

    // batch job relation edges
    data.tBatchJobRelation.forEach(bjr => {
      const batch_index = all_batch_ids.indexOf(bjr.BatchId);
      const batch_colors = so.edge.colors[batch_index];

      const node_id_job = entityMap[bjr.JobId].node_id;
      const node_id_parent_job = entityMap[bjr.ParentJobId].node_id;

      edges.push({
        color: batch_colors.jobToJob,
        width: so.edge.width.jobToJob,
        from: node_id_job,
        to: node_id_parent_job
      });
    })

    return { nodes, edges };
  }

  static transformToVis(data: SchedulerData, batch_ids: Array<string>): vis.Data {
    return this.toVis(data, batch_ids);
    //const dataFilteredByBatches = DataTransformator.filterByBatches(data, batch_ids);
    //return DataTransformator.toVis(dataFilteredByBatches, data);
  };

  static getBatchColors(data: SchedulerData, batch_id: string): BatchColors {
    const batch_index = this.toBatchIds(data).indexOf(batch_id);
    return so.edge.colors[batch_index];
  }

};

export default DataTransformator;