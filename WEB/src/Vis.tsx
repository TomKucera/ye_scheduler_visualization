import React, { useCallback, useState } from "react";
import "./App.css";
import VisNetworkReactComponent from "vis-network-react";

import DataProvider from './DataProvider';
import DataTransformator from './DataTransformator';

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

const batch_id = DataProvider.getFirstBatch(true)?.BatchId;
const data_scheduler = DataProvider.getData();
const data_vis = DataTransformator.transformToVis(data_scheduler, batch_id);

function Vis() {

  const [data, setData] = useState(data_vis);
  const [networkNodes, setNetwortNodes] = useState([]);

  const handleLoadData = () => {
    console.log('load data');
    console.log('data', data);
    // getInputData().then((val: any) =>{ 

    // }) ;
  };

  const handleAddNode = useCallback(() => {
    // const id = data.nodes.length + 1;
    // setData({
    //   ...data,
    //   nodes: [...data.nodes, { id, label: `Node ${id}` }],
    // });
  }, [setData, data]);

  const getNodes = useCallback((a) => {
    setNetwortNodes(a);
  }, []);

  const handleGetNodes = useCallback(() => {
    console.log(networkNodes);
  }, [networkNodes]);

  return (
    <div className="App">
      <button onClick={handleLoadData}>Load data</button>
      <button onClick={handleAddNode}>add random node</button>
      <button onClick={handleGetNodes}>get nodes</button>
      <VisNetworkReactComponent
        data={data}
        options={options}
        //events={events}
        getNodes={getNodes}
      />
    </div>
  );
}

export default Vis;