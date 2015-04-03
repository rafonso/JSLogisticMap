// 123

var jqPlotChart, flotChart;

function centralize() {
    $("#jqPlotChart").position({
        my : "center bottom-10",
        at : "center bottom",
        of : "#plotJqPlot"
    });
    $("#flotChart").position({
        my : "center bottom-10",
        at : "center bottom",
        of : "#plotFlot"
    });
}

function initRValue() {
    var spinner = $("#rValue").spinner({
        min : 0.00,
        max : 4.00,
        step : 0.01,
        numberFormat : "n",
        spin : function (event, ui) {
            var r = $(this).spinner("value");
            console.debug(r);
           plotJqPlotChart(r);
           plotFlotchart(r);
        }
    });

    return spinner.spinner("value");
}

function getData(r) {
    var data = [[], []];
    for (var x = 0; x <= 1.01; x += 0.01) {
        data[0].push([x, (r * x * (1 - x))]);
        data[1].push([x, x]);
    }
    return data;
}

function plotJqPlotChart(r) {
    jqPlotChart = $.jqplot('jqPlotChart', [], {
            axesDefaults : {
                min : 0.0,
                max : 1.0,
                tickInterval : 0.1
            },
            seriesDefaults : {
                showMarker : false,
                lineWidth : 1.5,
                markerOptions : {
                    lineWidth : 1,
                },
            },
            dataRenderer : function () {
                return getData(r);
            }
        });
}

function plotFlotchart(r) {
    var data = getData(r);
    flotChart = $.plot("#flotChart", [{
                    color : 1,
                    data : data[0],
                    lines : {
                        show : true,
                    }
                }, {
                    color : 0,
                    data : data[1],
                    lines : {
                        show : true
                    }
                }
            ], {
            xaxis : {
                min : 0.0,
                max : 1.0,
                ticks : 11,
                tickDecimals : 1,
            },
            yaxis : {
                min : 0.0,
                max : 1.0,
                ticks : 11,
                tickDecimals : 1,
            },
        });
}

$(document).ready(function () {

    $(window).resize(centralize);

    centralize();

    var r = initRValue();
    plotJqPlotChart(r);
    plotFlotchart(r);
});

function refreshCharts(r) {
    var data = getData(r);

    jqPlotChart.dataRenderer = function () {
        return data;
    }
    jqPlotChart.replot();
    
    flotChart.getData()[0] = data[0];
    flotChart.getData()[1] = data[1];
}