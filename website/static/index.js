$(document).ready(function() {

  // Hummingbird (list/tree of checkboxes) initialization
  $.fn.hummingbird.defaults.collapsedSymbol = "fa-arrow-circle-o-right";
  $.fn.hummingbird.defaults.expandedSymbol = "fa-arrow-circle-o-down";
  $.fn.hummingbird.defaults.checkDoubles = false;

  // $("#treeview").hummingbird('addNode', {pos:['after'], anchor_sel:['id'], anchor_vals:['xnode-0'], text:['New Node1'],
  //                                        the_id:['new_id'], data_id:['new_data_id']});
  $("#treeview").hummingbird();

  // amCharts configuration
//  am4core.useTheme(am4themes_animated);
  am4core.options.autoDispose = true;

  // Set event listener to checkboxes in "My datasets" list
  $('.my_datasets_list').change(function(event) {
    render_plots();
  });

  // Set event listener to checkboxes in "Predefined datasets" tree

  // This does not work for some reason
  // $("#treeview").on("nodeChecked", function(){
  //   alert("jjj");
  //   render_plots();
  // });
  // $("#treeview").on("nodeUnchecked", render_plots);

  // so we do this instead
  $('.hummingbird-treeview').change(function(event) {
    render_plots();
  });

  // let tree_checkboxes = $('input:checkbox.hummingbird-end-node');
  // for (let i = 0; i < tree_checkboxes.length; i++) {
  //   tree_checkboxes[i].change(function(event) {
  //     render_plots();
  //   });
  // }


//  async function render_plots() {
  function render_plots() {
    // if (event.target.checked) {   // Or event.target.value
    //   // The checkbox is now checked 
    // } else {
    //   // The checkbox is now no longer checked
    // }

    let checked_ids = [];
    let checked_checkboxes = $('input:checkbox.my_datasets_checkbox:checked');
    for (let i = 0; i < checked_checkboxes.length; i++) {
      checked_ids.push(checked_checkboxes[i].id);
    }

    var predef_checked_ids = {"id": checked_ids, "dataid": [], "text": []};
    $("#treeview").hummingbird("getChecked", {list:predef_checked_ids, onlyEndNodes:true, onlyParents:false, fromThis:false});
    checked_ids = predef_checked_ids.id.join(",");

    am4core.disposeAllCharts();
    if (checked_ids.length > 0) {
      fetch("/get_for_plot/" + checked_ids).then(response => response.json()).then(plotdata => plot(plotdata));
      // const plotdata = await fetch("/get_for_plot_predef/" + checked_ids).then(response => response.json());
      
    }
  }


  function plot(plotdata) {
    // alert(plotdata.xydata.length + " " + plotdata.legends.length);
    // if (plotdata.xydata.length !== plotdata.legends.length) {
    //   throw new Error("Assertion failed");
    // }

    let chart = am4core.create("chartdiv", am4charts.XYChart);
    // chart.paddingRight = 20;

    let chartdata = plotdata.xydata;

    // Convert time string to Date-objects (e.g. from "1854" to new Date("1854"))
    for (let i = 0; i < chartdata.length; i++) {
      let dict = chartdata[i];
      for (let key in dict) {
        if (key.startsWith("time")) {
          chartdata[i][key] = new Date(chartdata[i][key]);
        }
      }
    }

    chart.data = chartdata;
    let timeAxis = chart.xAxes.push(new am4charts.DateAxis());
    timeAxis.title.text = "Time";

    // Location of the grid item within cell, 0: Start, 0.5: Middle, 1: End
    timeAxis.renderer.grid.template.location = 0.001;

    timeAxis.renderer.labels.template.location = 0.001;

    // timeAxis.renderer.minGridDistance = 30;

    // 0: Full first cell is shown, 0.5: Half of first cell is shown, 1: None of the first cell is visible
    timeAxis.startLocation = 1;

    // 0: None of the last cell is shown (don't do that), 0.5: Half of the last cell is shown, 1: Full last cell is shown 
    timeAxis.endLocation = 1;

    // timeAxis.baseInterval = {
    //   "timeUnit": "month",
    //   "count": 1
    // };

    // timeAxis.layout = "none";

    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    
    for (let i = 0; i < plotdata.legends.length; i++) {
      let series = chart.series.push(new am4charts.LineSeries());
      series.name = plotdata.legends[i];
      // series.stroke = am4core.color("#CDA2AB");
      // series.strokeWidth = 3;
      // series.tensionX = 0.8;
      series.bullets.push(new am4charts.CircleBullet());
      series.connect = false;
      series.autoGapCount = Infinity;
      series.dataFields.valueY = "value" + i;
      series.dataFields.dateX = "time" + i;    
      series.dataItems.template.locations.dateX = 0;
    }

    // Add legend (with legend names being series.name)
    chart.legend = new am4charts.Legend();

    // Add cursor
    chart.cursor = new am4charts.XYCursor();

    // Vertical scrollbar
    chart.scrollbarX = new am4core.Scrollbar();
    chart.scrollbarX.parent = chart.bottomAxesContainer;

    // Horizontal scrollbar
    chart.scrollbarY = new am4core.Scrollbar();
    chart.scrollbarY.parent = chart.leftAxesContainer;
    chart.scrollbarY.toBack();

    // Add export menu (in top right corner of chart)
    chart.exporting.menu = new am4core.ExportMenu();

    // chart.series.getIndex(0).dataItems.template.locations.dateX = 0;
  }

  // /* Create chart instance */
  // var chart = am4core.create("chartdiv", am4charts.XYChart);
  // chart.data = []

  // /* Create axes */
  // // var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
  // // categoryAxis.dataFields.category = "year";
  // var timeAxis = chart.xAxes.push(new am4charts.DateAxis());
  // timeAxis.renderer.grid.template.location = 0;
  // timeAxis.renderer.minGridDistance = 30;

  // // /* Create value axis */
  // var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

  /* The plotting function. */
  function plot_old(plotdata) {

    let series = [];
    for (let i = 0; i < plotdata.legends.length; i++) {
      series.push({
        "type": "LineSeries",
        "dataFields": {
          "valueY": "value" + i,
          "dateX": "time" + i
        },
        "connect": false,
        "name": plotdata.legends[i],  // Used in legend
        "tooltipText": "{value" + i + "}",
        "strokeWidth": 3,
        "bullets": [
          {
            "type": "CircleBullet",
          },
        ],
        "callback": function() {  // Workaround for https://github.com/amcharts/amcharts4/issues/1415
          this.dataItems.template.locations.dateX = 0;
        }
      });
    }

    // Create chart instance
    let plotConfigJSON = {
      // "series": [
      //   {
      //     "type": "LineSeries",
      //     "dataFields": {
      //       "valueY": "value0",
      //       "dateX": "time0"
      //     },
      //     "name": "Population",  // Used in legend
      //     "tooltipText": "{value0}",
      //     "strokeWidth": 3,
      //     "bullets": [
      //       {
      //         "type": "CircleBullet",
      //       },
      //     ],
      //   },
      //   {
      //     "type": "LineSeries",
      //     "dataFields": {
      //       "valueY": "value1",
      //       "dateX": "time1"
      //     },
      //     "name": "Population2",  // Used in legend
      //     "tooltipText": "{value1}",
      //     "strokeWidth": 3,
      //     "bullets": [
      //       {
      //         "type": "CircleBullet",
      //       },
      //     ],
      //   }
      // ],


      "series": series,
      "data": plotdata.xydata,


      // "data":  [
      //   {
      //     "time0": new Date(1850, 1, 1),
      //     "value0": "0.11"
      //   }, 
      //   {
      //     "time0": new Date(1900, 1, 1),
      //     "value0": "0.2"
      //   }, 
      //   {
      //     "time0": new Date(1950, 1, 1),
      //     "value0": "0.3"
      //   }, 
      //   {
      //     "time0": new Date(2000, 1, 1),
      //     "value0": "0.4"
      //   }, 
      //   {
      //     "time1": new Date(1800, 1, 1),
      //     "value1": "0.1"
      //   }, 
      //   {
      //     "time1": new Date(1850, 1, 1),
      //     "value1": "0.2"
      //   }, 
      //   {
      //     "time1": new Date(1900, 1, 1),
      //     "value1": "0.3"
      //   }, 
      //   {
      //     "time1": new Date(1950, 1, 1),
      //     "value1": "0.4"
      //   },
      //   {
      //     "time1": new Date(1975, 1, 1),
      //     "value1": "0.5"
      //   }
      // ],





      "legend": {},

      "xAxes": [
        {
          "type": "DateAxis",
          "renderer": {
            // "tooltipLocation": 0,
            "grid": {
              "template": {
                "location": 0
              }
            }
          },
          "minGridDistance": 10
        }
      ],

      "yAxes": [
        {
          "type": "ValueAxis"
          // "title": {
          //   "text": "Foo",
          //   "fontWeight": "bold"
          // }
        }
      ]
    };

  //var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    //  series.bullets.push(new am4charts.CircleBullet());
    let chart = am4core.createFromConfig(plotConfigJSON, "chartdiv", am4charts.XYChart);
    
    // Workaround for https://github.com/amcharts/amcharts4/issues/1415
    chart.series.getIndex(0).dataItems.template.locations.dateX = 0;
  





//   // Add data
//   chart.data = [
//     {
//       value: 424,
//       date: '2018-07-16T07:28:13.000Z'
//     },
 
//     {
//       value: 40,
//       date: '2018-07-17T17:01:13.000Z'
//     },
 
//     {
//      value: 8,
//      date: '2018-07-18T12:39:08.000Z'
//     },
  
//    {
//      value: 88,
//      date: '2018-07-19T15:47:31.000Z'
//    },

//    {
//     value: 4,
//     date: '2018-07-20T12:50:56.000Z'
//   },

//   {
//     value: 82,
//     date: '2018-07-21T22:11:43.000Z'
//   },

//  {
//      value: 128,
//      date: '2018-07-23T11:16:22'
//    },
      
//    {
//      value: 316,
//      date: '2018-07-24T07:12:02.000Z'
//    }
//  ];

    // Create axes
    // var timeAxis = chart.xAxes.push(new am4charts.DateAxis());
    // timeAxis.renderer.grid.template.location = 0;
    // timeAxis.renderer.minGridDistance = 30;

    // var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

    // // Create series
    // var series = chart.series.push(new am4charts.LineSeries());
    // series.name = "Population";  // Used in legend
    // series.dataFields.valueY = "value";
    // series.dataFields.dateX = "date";
    // series.tooltipText = "{value}";
    // series.strokeWidth = 3;
    // series.bullets.push(new am4charts.CircleBullet());

    chart.cursor = new am4charts.XYCursor();

    // Create vertical scrollbar and place it before the value axis
    chart.scrollbarY = new am4core.Scrollbar();
    chart.scrollbarY.parent = chart.leftAxesContainer;
    chart.scrollbarY.toBack();

    // Create a horizontal scrollbar with previe and place it underneath the time axis
    // chart.scrollbarX = new am4charts.XYChartScrollbar();
    chart.scrollbarX = new am4core.Scrollbar();
    // chart.scrollbarX.series.push(series);
    chart.scrollbarX.parent = chart.bottomAxesContainer;

    // Enable export (the three dots in the upper right corner of the graph)
    chart.exporting.menu = new am4core.ExportMenu();




    // // Needed if array in chart.data is not ordered w.r.t. time
    // chart.events.on("beforedatavalidated", function(ev) {
    //   chart.data.sort(function(a, b) {
    //     return (new Date(a.date)) - (new Date(b.date));
    //   });
    // });

  }


  // And, for a good measure, let's add a legend
  // chart.legend = new am4charts.Legend();

  // XXX disable and hide the checkbox
  // $("#xnode-0").hide();
  // $("#xnode-0").prop('disabled', true);

  $("#treeview").hummingbird("expandAll");  // XXX temporary

});








function deleteNote(noteId) {
  fetch("/delete-note", {
    method: "POST",
    body: JSON.stringify({ noteId: noteId }),
  }).then((_res) => {
    window.location.href = "/";
  });
}
