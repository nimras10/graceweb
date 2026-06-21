declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
}
declare module 'react-plotly.js' {
  const Plot: any;
  export default Plot;
}
declare module 'react-plotly.js/factory' {
  export default function createPlotlyComponent(plotly: any): any;
}
