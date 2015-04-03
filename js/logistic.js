// 123

var jqPlotChart, flotChart;

function centralize() {
    function f(chart, plot) {
        $("#" + chart).position({
            my : "center bottom-10",
            at : "center bottom",
            of : "#" + plot
        });
    }

    f("jqPlotChart", "plotJqPlot");
    f("flotChart", "plotFlot")
}

function initRValue() {
    var refresh = function (event, ui) {
        var r = $(this).spinner("value");
        refreshCharts(r);
    }

    var spinner = $("#rValue").spinner({
            min : 0.00,
            max : 4.00,
            step : 0.01,
            numberFormat : "n",
            spin : refresh,
            change : refresh
        });

    spinner.focus();
    return spinner.spinner("value");
}

function getData(r) {
    var data = [[], [[0, 0], [1, 1]]];
    for (var x = 0; x <= 1.02; x += 0.02) {
        data[0].push([x, (r * x * (1 - x))]);
    }

    return data;
}

function plotJqPlotChart(data) {
    jqPlotChart = $.jqplot('jqPlotChart', data, {
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
        });
}

function dataToFlotData(data) {
    return [{
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
    ];
}

function plotFlotchart(data) {
    var axisConfig = {
        min : 0.0,
        max : 1.0,
        ticks : 11,
        tickDecimals : 1,
    };
    flotChart = $.plot("#flotChart", dataToFlotData(data), {
            xaxis : axisConfig,
            yaxis : axisConfig,
        });
}

function refreshCharts(r) {
    var t0 = Date.now();
    var data = getData(r);
    var dataTime = (Date.now() - t0);

    // FLOT - Average time = 6 ms
    var t0 = Date.now();
    flotChart.setData(dataToFlotData(data));
    flotChart.draw();
    var flotTime = (Date.now() - t0);

    // JQPLOT - Average time = 54 ms
    var t0 = Date.now();
    jqPlotChart.series[0].data = data[0];
    jqPlotChart.series[1].data = data[1];
    jqPlotChart.replot();
    var plotTime = (Date.now() - t0);

    console.debug(r + "\t" + dataTime + "\t" + flotTime + "\t" + plotTime);
}

$(document).ready(function () {

    $(window).resize(centralize);

    centralize();

    var r = initRValue();
    var initialData = getData(r);
    plotJqPlotChart(initialData);
    plotFlotchart(initialData);
});
