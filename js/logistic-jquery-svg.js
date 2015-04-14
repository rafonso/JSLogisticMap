//var logisticChart, iteractionsChart;
var values = {};

var steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];

var heatTrail = [
    "rgba(255, 0, 0, 0.20)",
    "rgba(255, 0, 0, 0.40)",
    "rgba(255, 0, 0, 0.50)",
    "rgba(255, 0, 0, 0.75)",
    "rgba(255, 0, 0, 0.90)"];

$.widget("ui.logisticspinner", $.ui.spinner, {
    _format : function (value) {
        return (value === "") ? "" : $.number(value, this._precision());
    }
});

/**
 * Workaround to add functionality to SVGPlot.
 */
$.extend($.svg._extensions[0][1].prototype, {
    xToChart : function (x) {
        return (x - this.xAxis._scale.min) * this._getScales()[0] + this._getDims()[this.X];
    },
    yToChart : function (y) {
        return this._getDims()[this.H] - ((y - this.yAxis._scale.min) * this._getScales()[1]) + this._getDims()[this.Y];
    },
    addSeries : function (points, settings) {
        var dims = this._getDims();
        var scales = this._getScales();
        var path = this._wrapper.createPath();
        /*
        var range = fn._range || [this.xAxis._scale.min, this.xAxis._scale.max];
        var xScale = (range[1] - range[0]) / fn._points;
         */
        var first = true;
        for (var i = 0; i < points.length; i++) {
            var px = (points[i][0] - this.xAxis._scale.min) * scales[0] + dims[this.X];
            var py = dims[this.H] - ((points[i][1] - this.yAxis._scale.min) * scales[1]) + dims[this.Y];
            path[(first ? 'move' : 'line') + 'To'](px, py);
            first = false;
        }
        /*
        for (var i = 0; i <= fn._points; i++) {
        var x = range[0] + i * xScale;
        if (x > this.xAxis._scale.max + xScale) {
        break;
        }
        if (x < this.xAxis._scale.min - xScale) {
        continue;
        }
        var px = (x - this.xAxis._scale.min) * scales[0] + dims[this.X];
        var py = dims[this.H] - ((fn._fn(x) - this.yAxis._scale.min) * scales[1]) + dims[this.Y];
        path[(first ? 'move' : 'line') + 'To'](px, py);
        first = false;
        }
         */
        var p = this._wrapper.path(this._plot, path)
            /*, $.extend({
            class_ : 'fnserie',
            fill : 'none',
            stroke : "red",
            strokeWidth : 1
            }, settings || {}));
             */
            this._showStatus(p, "fnserie");
    }
});

function centralize() {
    $("#main").position({
        of : "body"
    });
}
/*
function spinnerToValue(id) {
var key = (id === "iteractionsValue") ? "spinner" : "logisticspinner";
return $("#" + id)[key]("value");
}
 */

function spinnerToValueName(id) {
    var key = (id === "iteractionsValue") ? "spinner" : "logisticspinner";
    return $("#" + id)[key]("option").valueName;
}

function linear(x) {
    return x;
}

function parabol(x) {
    return (values.r * x * (1 - x));
}

function adjustChart() {

    function formatAxis(idAxis, axisType, pos, axis0Type, _0Type) {
        var axis = $("g." + idAxis);
        //axis.prepend(jQuery('<text/>').attr(axisType, pos).attr(axis0Type, _0Type).text("0.0"))
        axis.appendTo("g.background");

        return axis.children("text")
        .attr(axisType, pos)
        .css("font-size", "13px")
        .css("font-family", 'Tahoma, Geneva, sans-serif')
        .attr("z-index", "10")
        .each(function (index, element) {
            $(element).text($.number((1 + index) / 10, 1));
        });
    }

    formatAxis("xAxisLabels", "y", "395", "x", "23");
    formatAxis("yAxisLabels", "x", "20", "y", "381")
    .each(function () {
        $(this).attr("y", parseInt($(this).attr("y")) + 5);
    });
    $("g.background rect").appendTo("g.background");
    $("g.xAxis, g.yAxis").remove();
}

function generateData() {
    var data = {
        logistic : [],
        iteractions : []
    };

    var x = values.x0;
    data.iteractions.push(x);
    for (var it = 1; it < values.iteractions; it++) {
        x = parabol(x);
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


    return data;
}

function drawIteractions() {
    $("path.iteractions").remove();
    var data = generateData();

    var svg = $('#logisticChart').svg('get');
    var plot = svg.plot;
    var path = svg.createPath();
    path.moveTo(plot.xToChart(data.logistic[0][0]), plot.yToChart(data.logistic[0][1]));
    for (var i = 1; i < data.logistic.length; i++) {
        path.line(plot.xToChart(data.logistic[i][0]), plot.yToChart(data.logistic[i][1]));
    }
    svg.path($("g.foreground").svg("get"), path, {
        fill : 'none',
        stroke : 'red',
        strokeWidth : 1,
        class : "iteractions"
    });

    $("g.background rect").appendTo("g.background");
    plot.redraw();
    $('path.iteractions').appendTo("g.foreground");
}

function refreshCharts(event, ui) {
    if (!!ui.value) {
        values[spinnerToValueName(event.target.id)] = ui.value;
        drawIteractions();
        adjustChart();
    }
}

function init() {

    function initFloatSpinner(id, valueName, max) {

        function changeStep(id, decreaseStep) {
            var stepPos = $("#" + id).logisticspinner("option", "stepPos");
            var delta = 0;
            if (!decreaseStep && (stepPos > 0)) {
                delta = -1;
            } else if (decreaseStep && (stepPos < (steps.length - 1))) {
                delta = +1;
            }

            if (!!delta) {
                stepPos += delta;
                $("#" + id)
                .logisticspinner("option", "step", steps[stepPos])
                .logisticspinner("option", "stepPos", stepPos);
            }
        }

        function handleMouse(event) {
            if (!event.ctrlKey) {
                return;
            }

            if (event.which === 1) { // Left Button
                changeStep(event.target.id, false);
            } else if (event.which === 3) { // Right Button
                changeStep(event.target.id, true);
            }
        }

        function handleKey(event) {
            if (!event.ctrlKey) {
                return;
            }

            if (event.keyCode === 37) { // Arrow Left
                changeStep(event.target.id, false);
            } else if (event.keyCode === 39) { // Arrow Right
                changeStep(event.target.id, true);
            }
        }

        var spinnerOptions = {
            min : 0.00,
            max : max,
            stepPos : 1,
            step : steps[1],
            numberFormat : "n",
            spin : refreshCharts,
            change : refreshCharts,
            valueName : valueName
        };

        return $("#" + id)
        .logisticspinner(spinnerOptions)
        .mousedown(handleMouse)
        .keydown(handleKey)
        .bind("contextmenu", function () {
            return false;
        })
        .tooltip();
    }

    function initIteractionsValue() {
        $("#iteractionsValue").spinner({
            min : 0,
            max : 2000,
            step : 25,
            spin : refreshCharts,
            change : refreshCharts,
            valueName : "iteractions"
        });
    }

    function initChart(svg) {
        svg.plot
        .area(0.06, 0.02, 0.98, 1.00)
        .legend.show(false).end()
        .gridlines('lightgrey', 'lightgrey')
        .xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
        .yAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
        .addFunction("linear", linear, [0, 1], 1, "GoldenRod", 2)
        .addFunction("parabol", parabol, [0, 1], 50, "LightBlue", 2)
        .redraw();

        drawIteractions();
        adjustChart();
    }

    $(window).resize(centralize);

    centralize();
    initFloatSpinner("rValue", "r", 4.00).focus();
    initFloatSpinner("x0Value", "x0", 1.00);
    initIteractionsValue();
    values = {
        r : $("#rValue").logisticspinner("value"),
        x0 : $("#x0Value").logisticspinner("value"),
        iteractions : $("#iteractionsValue").spinner("value")
    };
    $('#logisticChart').svg(initChart);
}

$(document).ready(init);
