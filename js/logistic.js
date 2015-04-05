// 123
$.widget("ui.logisticspinner", $.ui.spinner, {
    _format : function (value) {
        function repeat0(times) {
            var zeros = "";
            while (zeros.length < times) {
                zeros += "0";
            }
            return zeros;
        }

        if (value === "") {
            return "";
        }

        var precision = this._precision();
        var strValue = value.toString();
        var posDecimal = strValue.indexOf(".");
        if (posDecimal < 0) {
            return value + "." + repeat0(precision);
        }

        var intValue = strValue.substring(0, posDecimal);
        var decimalValue = strValue.substring(posDecimal + 1);
        if (decimalValue.length === precision) {
            return value.toString();
        }

        return intValue + "."
         + decimalValue
         + repeat0(precision - decimalValue.length);
    }
});

var flotChart, iteractionsChart;

var steps = [0.1, 0.01, 0.001, 0.0001];

function centralize() {
    $("#main").position({
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

    var r = $("#rValue").logisticspinner("value");
    for (var x = 0; x <= 1.02; x += 0.02) {
        data.parabol.push([x, f(x, r)]);
    }

    var x = $("#x0Value").logisticspinner("value");
    var numberOfIeractions = $("#iteractionsValue").spinner("value"); ;
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

function initFloatSpinner(id, max) {
    var spinnerOptions = {
        min : 0.00,
        max : max,
        stepPos : 1,
        step : steps[1],
        numberFormat : "n",
        spin : refreshCharts,
        change : refreshCharts
    };
    var changeStep = function (event) {
        if (!event.ctrlKey) {
            return;
        }

        var stepPos = $(this).logisticspinner("option", "stepPos");

        var delta = 0;
        if ((event.which === 1) && (stepPos > 0)) {
            // Left Button
            delta = -1;
        } else if ((event.which === 3) && (stepPos < (steps.length - 1))) {
            // Right Button
            delta = +1;
        }

        if (!!delta) {
            stepPos += delta;
            $(this)
            .logisticspinner("option", "step", steps[stepPos])
            .logisticspinner("option", "stepPos", stepPos);
        }
    };

    return $("#" + id)
    .logisticspinner(spinnerOptions)
    .mousedown(changeStep)
    .bind("contextmenu", function () {
        return false;
    })
//    .tooltip()
    ;
}

function initIteractionsValue() {
    $("#iteractionsValue").spinner({
        min : 0,
        max : 2000,
        step : 25,
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
                lineWidth : 2,
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
    initFloatSpinner("rValue", 4.00).focus();
    initFloatSpinner("x0Value", 1.00);
    initIteractionsValue();
    var initialData = getData();
    //    plotJqPlotChart(initialData);
    plotFlotchart(initialData);
});
