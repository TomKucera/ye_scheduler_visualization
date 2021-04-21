import styled from "styled-components";
import React, { useCallback, useState } from "react";
import "./App.css";
import VisNetworkReactComponent from "vis-network-react";

import DataProvider from './DataProvider';
import DataTransformator from './DataTransformator';
import { SchedulerData } from "./Types";

//#region Options
const options = {
  layout: {
    randomSeed: undefined,
    improvedLayout:true,
    clusterThreshold: 150,
    hierarchical: {
      enabled:true,
      levelSeparation: 150,
      nodeSpacing: 100,
      treeSpacing: 100,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
      direction: 'UD',        // UD, DU, LR, RL
      sortMethod: 'hubsize',  // hubsize, directed
      shakeTowards: 'leaves'  // roots, leaves
    }
  },
  nodes : {
    // shape : 'dot',
    // size : 100,
    // color : '#ECBF26', // select color

    // font : {
    //     size : 16,
    //     color : '#ffffff'
    // },
    // borderWidth : 2
  },
  edges: {
    arrows:{
      to: {
        enabled: true,
        imageHeight: 1,
        imageWidth: 1,
        scaleFactor: 1,
        //src: undefined,
        type: "arrow"
      },
    }
  }
}
//#endregion


const data_scheduler = DataProvider.getData();

const VisBar = styled.div`
  width: 15%; 
  height: 100%; 
  float: left;
  border: 3px solid #ECEFF1;
`;

const BatchListItem = styled.div`
  text-align: left;
  padding: 10px;
  margin: 10px;
`;

const BatchListItemCheckbox = styled.input.attrs({ type: 'checkbox' })`
  text-align: left;
  padding: 10px;
  padding-left: 20px;
`;

function Vis() {

  const [data, setData] = useState<SchedulerData>(data_scheduler);
  const [batchIds, setBatchIds] = useState<Array<string>>([]);
  const [dataVis, setDataVis] = useState<vis.Data>(DataTransformator.transformToVis(data, batchIds));

  const onSelectNode = (params: any) => {
    //const node_data = dataVis.get(5);
    console.log("selectNode params", params);
    //console.log("selectNode node_data", node_data);    
  };

  const handleBatchCheck = (event: any) => {
    const batch_id = event.target.value;
    console.log('handleBatchCheck batchId', batch_id);

    const newBatchIds = [...batchIds];
    const index = newBatchIds.indexOf(batch_id);

    if (index !== -1) {
      newBatchIds.splice(index, 1);
    }
    else {
      newBatchIds.push(batch_id);
    }
    setBatchIds(newBatchIds);
    setDataVis(DataTransformator.transformToVis(data, batchIds));
  }

  const renderBatchSelector = () => {
    console.log("renderBatchSelector", data.tBatch);
    return(
    <div>
      {
        data.tBatch.map(b => {
          const colors = DataTransformator.getBatchColors(data, b.BatchId);
          const checked= batchIds.indexOf(b.BatchId) >= 0;
          return (
            <BatchListItem style={{ backgroundColor: colors.jobToJob }} key={b.BatchId} >
              <BatchListItemCheckbox value={b.BatchId} onChange={handleBatchCheck} checked={checked} />
              {b.BatchName}
            </BatchListItem>
          );
        })
      }
    </div>);
  };

  return (
    <div className="App">
      <VisBar>
        {renderBatchSelector()}
      </VisBar>
      {/* <button onClick={handleLoadData}>Load data</button>
      <button onClick={handleAddNode}>add random node</button>
      <button onClick={handleGetNodes}>get nodes</button> */}
      <VisNetworkReactComponent className="vis_component" style={{width: '80%', height: '100%', float: 'left'}}
        data={DataTransformator.transformToVis(data, batchIds)}
        // data = {dataVis}
        options={options}
        // events={{selectNode: function (params) {
        //   console.log("selectNode Event:", params);
        // }}}
        events={{selectNode: onSelectNode}}
        //getNodes={getNodes}
      />
    </div>
  );
}

export default Vis;