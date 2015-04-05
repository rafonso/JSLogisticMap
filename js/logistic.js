// 123

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

var flotChart, iteractionsChart;

var steps = [0.1, 0.01, 0.001, 0.0001];

function centralize() {
    $("#main").position({
        of : "body"
    });
}

function spinnerToValue(id) {
    var key = (id === "iteractionsValue")? "spinner": "logisticspinner";
    return $("#" + id)[key]("value");
}

function getData(x0, r, numberOfIteractions) {
    function f(x, r) {
        return (r * x * (1 - x));
    }

    var data = {
        parabol : {
            label : "R = " + formatValue(r, 4),
            labelIndex : 0,
            data : []
        },
        line : {
            data : [[0, 0], [1, 1]]
        },
        logistic : {
            label : "Iteractions = " + numberOfIteractions,
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
        var _data = data[dataIndex];
        var legend = $("#jqPlotChart .legend .legendLabel");
        if (_data.labelIndex !== undefined && legend.length) {
            legend[_data.labelIndex].innerHTML = _data.label;
        }
        return {
            color : colorIndex,
            data : _data.data,
            label : _data.label,
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
            legend : {
                position : "nw"
            }
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
    var initialData = getData(spinnerToValue("x0Value"), spinnerToValue("rValue"), spinnerToValue("iteractionsValue"));
    plotFlotchart(initialData);
});
