// 123

var flotChart, iteractionsChart;

function centralize() {
    $("body > *").position({
        of : "body"
    });
}

function getData() {
    function f(x, r) {
        return (r * x * (1 - x));
    }

    var data = {
        parabol : [],
        line : [[0, 0], [1, 1]],
        logistic : [],
        iteractions : []
    };

    var r = $("#rValue").spinner("value");
    for (var x = 0; x <= 1.02; x += 0.02) {
        data.parabol.push([x, f(x, r)]);
    }

    var x = $("#x0Value").spinner("value"); 
    var numberOfIeractions = $("#iteractionsValue").spinner("value");;
    data.iteractions.push(x);
    for (var it = 0; it < numberOfIeractions; it++) {
        x = f(x, r);
        data.iteractions.push(x);
    }

    x = data.iteractions[0];
    var y = 0;
    data.logistic.push([x, y]);
    for (var it = 1; it < data.iteractions.length; it++) {
        y = data.iteractions[it];
        data.logistic.push([x, x]);
        data.logistic.push([x, y]);
        x = y;
    }
    data.logistic.splice(1, 1); // workaround

    for (var it = 0; it < data.iteractions.length; it++) {
        data.iteractions[it] = [it, data.iteractions[it]];
    }

    return data;
}

function refreshCharts() {
    var data = getData();

    flotChart.setData(dataToFlotData(data));
    flotChart.draw();
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

function initIteractionsValue() {
    $("#iteractionsValue").spinner({
        max : 2000,
        spin : refreshCharts,
        change : refreshCharts
    });
}

function dataToFlotData(data) {
    function getData(colorIndex, dataIndex) {
        return {
            color : colorIndex,
            data : data[dataIndex],
            lines : {
                show : true,
                lineWidth: 2,
            }
        };
    }

    return [getData(1, "parabol"), getData(0, "line"), getData(2, "logistic")];
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
    /*
    var iteractionsAxisConfig = {
    min : 0,
    max : data[3].lenght,
    //        ticks : 11,
    //        tickDecimals : 1,
    };
    iteractionsChart = $.plot("#iteractionsChart", data[3], {
    xaxis : iteractionsAxisConfig,
    yaxis : iteractionsAxisConfig,
    });
     */
}

$(document).ready(function () {
    $(window).resize(centralize);

    centralize();
    initRValue();
    initX0Value();
    initIteractionsValue();
    var initialData = getData();
    //    plotJqPlotChart(initialData);
    plotFlotchart(initialData);
});
