$(document).ready(function() {

  $('.resizable_e').resizable({
    handles: 'e'
  });

  $('.resizable_s').resizable({
    handles: 's'
  });

  // Hummingbird (list/tree of checkboxes) initialization
  $.fn.hummingbird.defaults.collapsedSymbol = "fa-arrow-circle-o-right";
  $.fn.hummingbird.defaults.expandedSymbol = "fa-arrow-circle-o-down";
  $.fn.hummingbird.defaults.checkDoubles = false;

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

  // Set event listener to checkboxes in Control panel
  $('#stack_plots_checkbox').change(function(event) {
    render_plots();
  });
  

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


  // function isNumeric(str) {
  //   return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  //          !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  // }

  var timeAxes = [];

  function plot(plotdata) {
    const nTimelines = plotdata.legends.length;
    // alert(plotdata.data_is_qualitative);
    // alert(plotdata.xydata.length + " " + plotdata.legends.length);
    // if (plotdata.xydata.length !== plotdata.legends.length) {
    //   throw new Error("Assertion failed");
    // }

    var is_stacked = document.getElementById('stack_plots_checkbox').checked;

    const chartstack = document.getElementById("chartstack");

    // Remove all divs inside <p id="chartstack">
    while (chartstack.firstChild) {
      chartstack.removeChild(chartstack.lastChild);
    }    
    
    let nCharts = 1;
    if (is_stacked) {
      nCharts = nTimelines;
    }

    let chartdata = plotdata.xydata;

    // Convert time string to Date-objects (e.g. from "1854" to new Date("1854"))
    // and find min and max
    minTime = Infinity;
    maxTime = -Infinity;
    for (let i = 0; i < chartdata.length; i++) {
      let dict = chartdata[i];
      for (let key in dict) {
        if (key.startsWith("time")) {
          chartdata[i][key] = new Date(chartdata[i][key]);
          if (chartdata[i][key] < minTime) {
            minTime = chartdata[i][key];
          }
          if (chartdata[i][key] > maxTime) {
            maxTime = chartdata[i][key];
          }
        }
      }
    }
    minTime = minTime.getTime();
    maxTime = maxTime.getTime();

    // anyQualitative = plotdata.data_is_qualitative.some(x => x);
    allQualitative = plotdata.data_is_qualitative.every(x => x);

    // Create divs inside <p id="chartstack"> that look like:
    // <div overflow="auto" class="row-md resizable_s" id="chartdiv" style="height:100px; border: 1px solid"></div>
    let charts = [];
    charts[nCharts - 1] = undefined;
    timeAxes[nCharts - 1] = undefined;
    for (let i = nCharts - 1; i >= 0; i--) {
      let chartdiv = document.createElement("div");
      chartdiv.style.height = "300px";
      // chartdiv.style.border = "1px solid black";
      chartdiv.style.overflow = "hidden";
      chartdiv.id = "chartdiv" + i;
      chartdiv.className = "row-md resizable_s";
      // chartdiv.innerHTML = "Chart " + i;
      chartstack.appendChild(chartdiv);

      let chart = am4core.create(chartdiv.id, am4charts.XYChart);
      charts[i] = chart;
      chart.paddingLeft = 0;
    
      chart.data = chartdata;
      
      let timeAxis = chart.xAxes.push(new am4charts.DateAxis());
      timeAxes[i] = timeAxis;
      if (i == 0) {
        timeAxis.title.text = "Time";
      }

      // Location of the grid item within cell, 0: Start, 0.5: Middle, 1: End
      timeAxis.renderer.grid.template.location = 0.001;

      timeAxis.renderer.labels.template.location = 0.001;

      // timeAxis.renderer.minGridDistance = 30;

      // 0: Full first cell is shown, 0.5: Half of first cell is shown, 1: None of the first cell is visible
      timeAxis.startLocation = 0;

      // 0: None of the last cell is shown (don't do that), 0.5: Half of the last cell is shown, 1: Full last cell is shown 
      timeAxis.endLocation = 1;

      timeInterval = maxTime - minTime;
      timeAxis.min = minTime - timeInterval * 0.05;
      timeAxis.max = maxTime + timeInterval * 0.05;
      //timeAxis.strictMinMax = true;

      // timeAxis.baseInterval = {
      //   "timeUnit": "month",
      //   "count": 1
      // };

      // timeAxis.layout = "none";

      timeAxis.events.on("startchanged", timeAxisChanged);
      timeAxis.events.on("endchanged", timeAxisChanged);

      // timeAxis.logarithmic = true;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.width = 40;

      if ((is_stacked && plotdata.data_is_qualitative[i]) || allQualitative) {
        // Make this chart qualitative-type

        // timeAxis.renderer.grid.template.disabled = true;
        // timeAxis.renderer.labels.template.disabled = true;
        timeAxis.tooltip.disabled = true;

        // valueAxis.min = 0;
        // valueAxis.strictMinMax = true;
        valueAxis.renderer.grid.template.disabled = true;
        valueAxis.renderer.labels.template.disabled = true;
        valueAxis.renderer.baseGrid.disabled = true;
        valueAxis.tooltip.disabled = true;        
      }
      else {
      // if ((is_stacked && !plotdata.data_is_qualitative[i]) ||
      //     (!is_stacked && anyQuantitative)) {
        // Add legend (with legend names being series.name) 
        chart.legend = new am4charts.Legend();
        chart.legend.position = "bottom";
        chart.legend.halign = "mid";
        // chart.legend.width = 150;
      }

      // Add cursor
      chart.cursor = new am4charts.XYCursor();
      chart.cursor.behavior = "none";  // Disable zoom since difficult to get synced DateAxes for stacked plots

      // Horizontal scrollbar (only to the bottom chart of stacked)
      if (!is_stacked || i == 0) {
        chart.scrollbarX = new am4core.Scrollbar();
        chart.scrollbarX.parent = chart.bottomAxesContainer;
        chart.scrollbarX.startGrip.icon.disabled = true;
        chart.scrollbarX.endGrip.icon.disabled = true;
        chart.scrollbarX.minHeight = 5;
      }

      // Vertical scrollbar
      chart.scrollbarY = new am4core.Scrollbar();
      chart.scrollbarY.parent = chart.leftAxesContainer;
      chart.scrollbarY.startGrip.icon.disabled = true;
      chart.scrollbarY.endGrip.icon.disabled = true;  
      chart.scrollbarY.minWidth = 5;    
      chart.scrollbarY.toBack();

      // Add export menu (in top right corner of chart)
      chart.exporting.menu = new am4core.ExportMenu();

    }

    for (let i = 0; i < nTimelines; i++) {
      let series;
      if (is_stacked) {
        series = charts[i].series.push(new am4charts.LineSeries());        
      }
      else {
        series = charts[0].series.push(new am4charts.LineSeries());
      }
      series.name = plotdata.legends[i];
      // series.stroke = am4core.color("#CDA2AB");
      // series.strokeWidth = 3;
      // series.tensionX = 0.8;
      var circleBullet = series.bullets.push(new am4charts.CircleBullet());
      circleBullet.circle.radius = 2;

      series.connect = false;
      series.autoGapCount = Infinity;
      series.dataFields.valueY = "value" + i;
      series.dataFields.dateX = "time" + i;    
      series.dataItems.template.locations.dateX = 0;

      // if ((is_stacked || nTimelines === 1) && plotdata.data_is_qualitative[i]) {
      if (plotdata.data_is_qualitative[i]) {
        var labelBullet = series.bullets.push(new am4charts.LabelBullet());
        labelBullet.label.text = "{text" + i + "}";
        labelBullet.label.maxWidth = 150;
        labelBullet.label.wrap = true;
        labelBullet.label.truncate = false;
        labelBullet.label.textAlign = "middle";
        labelBullet.label.verticalCenter = "bottom";
        labelBullet.label.paddingTop = 20;
        labelBullet.label.paddingBottom = 20;
        labelBullet.label.fill = am4core.color("#999");
      }
    }

    $('.resizable_s').resizable({
      handles: 's'
    });

  }

  function timeAxisChanged(ev) {
    var start = ev.target.minZoomed;
    var end = ev.target.maxZoomed;
    for (let j = timeAxes.length - 1; j >= 1; j--) {  // All charts except the bottom
      timeAxes[j].min = start;
      timeAxes[j].max = end;
      timeAxes[j].strictMinMax = true;
    }
  }  

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
