var flotChart, iteractionsChart;

var steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];

var heatTrail = [
    "rgba(255, 0, 0, 0.20)",
    "rgba(255, 0, 0, 0.40)",
    "rgba(255, 0, 0, 0.50)",
    "rgba(255, 0, 0, 0.75)",
    "rgba(255, 0, 0, 0.90)"];

function formatValue(value, precision) {
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

$.widget("ui.logisticspinner", $.ui.spinner, {
    _format : function (value) {
        return formatValue(value, this._precision());
    }
});

function centralize() {
    $("#main").position({
        of : "body"
    });
}

function spinnerToValue(id) {
    var key = (id === "iteractionsValue") ? "spinner" : "logisticspinner";
    return $("#" + id)[key]("value");
}

function getData(x0, r, numberOfIteractions) {
    function f(x, r) {
        return (r * x * (1 - x));
    }

    var data = {
        parabol : {
            label : "R = " + formatValue(r, 5),
            labelIndex : 0,
            data : []
        },
        line : {
            data : [[0, 0], [1, 1]]
        },
        logistic : {
            labelIndex : 1,
            data : []
        },
        iteractions : {
            data : []
        }
    };

    for (var x = 0; x <= 1.02; x += 0.02) {
        data.parabol.data.push([x, f(x, r)]);
    }

    var x = x0;
    data.iteractions.data.push(x);
    for (var it = 0; it < numberOfIteractions; it++) {
        x = f(x, r);
        data.iteractions.data.push(x);
    }

    x = data.iteractions.data[0];
    var y = 0;
    data.logistic.data.push([x, y]);
    for (var it = 1; it < data.iteractions.data.length; it++) {
        y = data.iteractions.data[it];
        data.logistic.data.push([x, x]);
        data.logistic.data.push([x, y]);
        x = y;
    }
    data.logistic.data.splice(1, 1); // workaround

    for (var it = 0; it < data.iteractions.data.length; it++) {
        data.iteractions.data[it] = [it, data.iteractions.data[it]];
    }

    return data;
}

function refreshCharts(event, ui) {
    var data = {};
    var t0 = Date.now();
    if (!ui.value) {
        data = getData(spinnerToValue("x0Value"), spinnerToValue("rValue"), spinnerToValue("iteractionsValue"));
    } else if (event.target.id === "rValue") {
        data = getData(spinnerToValue("x0Value"), ui.value, spinnerToValue("iteractionsValue"));
    } else if (event.target.id === "x0Value") {
        data = getData(ui.value, spinnerToValue("rValue"), spinnerToValue("iteractionsValue"));
    } else if (event.target.id === "iteractionsValue") {
        data = getData(spinnerToValue("x0Value"), spinnerToValue("rValue"), ui.value);
    } else {
        throw new Error("Unknown origin: " + event.target);
    }
    console.debug(ui.value + ": " + (Date.now() - t0));

    t0 = Date.now();
    flotChart.setData(dataToFlotData(data));
    flotChart.draw();
    console.debug("\tPlotting: " + (Date.now() - t0));
/*
    // Drawing iteractons
    console.debug(data.iteractions.data);
    iteractionsChart.setData(data.iteractions.data);
    iteractionsChart.getOptions().xaxes[0].max = data.iteractions.data.length;
    iteractionsChart.setupGrid();
    iteractionsChart.draw();
*/
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
    var flotData = [];

    // parabol
    flotData.push({
        color : 1,
        shadowSize : 0,
        data : data.parabol.data,
        label : data.parabol.label,
        lines : {
            show : true,
            lineWidth : 2,
        }
    });
    var legend = $("#jqPlotChart .legend .legendLabel");
    if (legend.length) {
        legend[0].innerHTML = data.parabol.label;
    }

    // line
    flotData.push({
        color : 0,
        shadowSize : 0,
        data : data.line.data,
        lines : {
            show : true,
            lineWidth : 2,
        }
    });

    // logistic
    var stageSize = data.logistic.data.length / heatTrail.length;
    for (var stage = 0; stage < heatTrail.length; stage++) {
        var startStage = stage * stageSize;
        var endStage = startStage + stageSize;
        flotData.push({
            color : heatTrail[stage],
            shadowSize : 0,
            data : data.logistic.data.slice(startStage, endStage),
            lines : {
                show : true,
                lineWidth : 1,
            }
        });
    }

    return flotData;
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
            legend : {
                position : "nw"
            }
        });
/*
    iteractionsChart = $.plot("#iteractionsChart", data.iteractions.data, {
            color : "green",
            xaxis : {
                min : 0,
                max : data.iteractions.data.length,
            },
            yaxis : {
                min : 0.0,
                max : 1.0,
            },
            points : {
                show : true,
                lineWidth : 1,
            }
        });
*/
}

$(document).ready(function () {
    $(window).resize(centralize);

    centralize();
    initFloatSpinner("rValue", 4.00).focus();
    initFloatSpinner("x0Value", 1.00);
    initIteractionsValue();
    var initialData = getData(spinnerToValue("x0Value"), spinnerToValue("rValue"), spinnerToValue("iteractionsValue"));
    plotFlotchart(initialData);
});
