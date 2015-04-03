// 123

var jqPlotChart, flotChart;

function centralize() {
    function f(chart, plot) {
        $("#" + chart).position({
            my : "center center",
            at : "center center",
            of : "#" + plot
        });
    }

    //f("jqPlotChart", "plotJqPlot");
    f("flotChart", "plots")
}

function initRValue() {
    $("#rValue").spinner({
        min : 0.00,
        max : 4.00,
        step : 0.01,
        numberFormat : "n",
        spin : refreshCharts,
        change : refreshCharts
    }).focus();
}

function initX0Value() {
    $("#x0Value").spinner({
        min : 0.00,
        max : 1.00,
        step : 0.01,
        numberFormat : "n",
        spin : refreshCharts,
        change : refreshCharts
    });
}

function getData() {
    function f(x, r) {
        return (r * x * (1 - x));
    }

    var data = [[], [[0, 0], [1, 1]], [], []];

    var r = $("#rValue").spinner("value");
    for (var x = 0; x <= 1.02; x += 0.02) {
        data[0].push([x, f(x, r)]);
    }

    var x = $("#x0Value").spinner("value");;
    data[3].push(x);
    for (var it = 1; it < 100; it++) {
        x = f(x, r);
        data[3].push(x);
    }

    x =  data[3][0];
    var y = 0;
    data[2].push([x, y]);
    for(var it = 1; it < data[3].length; it++) {
        y = data[3][it];
        data[2].push([x, x]);
        data[2].push([x, y]);
        x = y;
    }
    data[2].splice(1, 1); // workaround 
//    console.debug(data[2]);

    return data;
}

function dataToFlotData(data) {
    function getData(colorIndex, dataIndex) {
        return {
            color : colorIndex,
            data : data[dataIndex],
            lines : {
                show : true,
            }
        };
    }

    return [getData(1, 0), getData(0, 1), getData(2, 2)];
}

function plotFlotchart(data) {
    var axisConfig = {
        min : 0.0,
        max : 1.0,
        ticks : 11,
        tickDecimals : 1,
    };
    flotChart = $.plot("#jqPlotChart", dataToFlotData(data), {
            xaxis : axisConfig,
            yaxis : axisConfig,
        });
}

function refreshCharts() {
    var data = getData();

    flotChart.setData(dataToFlotData(data));
    flotChart.draw();
}

$(document).ready(function () {
    $(window).resize(centralize);

    centralize();
    initRValue();
    initX0Value();
    var initialData = getData();
//    plotJqPlotChart(initialData);
    plotFlotchart(initialData);
});
