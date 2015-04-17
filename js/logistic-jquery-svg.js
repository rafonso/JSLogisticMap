"use strict";

var values = {};

var steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];

var heatTrail = [
    "rgba(255, 200, 0, 1.00)",
    "rgba(255, 150, 0, 0.90)",
    "rgba(255, 100, 0, 0.90)",
    "rgba(255, 050, 0, 0.90)",
    "rgba(255, 000, 0, 0.90)"];

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
    }
});

function redraw() {

    function drawLogistic() {

        /*
         * Draw quadratic equation using quadratic Bézier curve.
         * The parabol extremities are the points (0,0) and (1, 0).
         *
         */
        function drawQuadratic() {
            var y0 = plot.yToChart(0);
            var x0 = plot.xToChart(0);
            var x1 = plot.xToChart(1);
            var x_5 = plot.xToChart(0.5);
            var y_5 = plot.yToChart(values.r / 2);

            var quadraticPath = svgLogistic.createPath();
            quadraticPath
            .move(x0, y0)
            .curveQ(x_5, y_5, x1, y0);
            svgLogistic.path(svgLogisticForeground,
                quadraticPath, {
                fill : 'none',
                stroke : "Blue",
                strokeWidth : 2,
                class : "quadratic"
            });
        }

        function drawLogistic(heatColor, stage) {
            var startStage = stage * stageSize;
            var endStage = startStage + stageSize;
            var path = svgLogistic.createPath();
            path.moveTo(plot.xToChart(data.logistic[startStage].x), plot.yToChart(data.logistic[startStage].y));
            for (var i = startStage + 1; i < endStage; i++) {
                var point = data.logistic[i];
                path.line(plot.xToChart(point.x), plot.yToChart(point.y));
            }
            svgLogistic.path(svgLogisticForeground, path, {
                id : ("logistic" + stage),
                fill : 'none',
                stroke : heatColor,
                strokeWidth : 1,
                class : "logistic"
            });
        }

        // Cleaning
        $("#logisticChart path.logistic, #logisticChart path.quadratic").remove();

        var svgLogistic = $('#logisticChart').svg('get');
        var svgLogisticForeground = $("#logisticChart g.foreground").svg("get");
        var plot = svgLogistic.plot;

        drawQuadratic();

        var stageSize = parseInt(data.logistic.length / heatTrail.length);
        heatTrail.forEach(drawLogistic);

        plot.redraw();
        $("#logisticChart g.background rect").appendTo("#logisticChart g.background");
        $('#logisticChart path.quadratic, #logisticChart path.logistic').appendTo("#logisticChart g.foreground");
    }

    function drawIteractions() {

        function drawSeries(heatColor, stage) {
            var startStage = stage * stageSize;
            var endStage = startStage + stageSize;
            var path = svg.createPath();
            console.debug(startStage, endStage);
            
            
            path.moveTo(plot.xToChart(startStage + 1), plot.yToChart(data.iteractions[startStage]));
            for (var i = startStage + 1; i < endStage; i++) {
                path.line(plot.xToChart(i + 1), plot.yToChart(data.iteractions[i]));
            }
            svg.path(svgForeground, path, {
                id : ("iteractions" + stage),
                fill : 'none',
                stroke : heatColor,
                strokeWidth : 1,
                class : "iteractions"
            });
        }

        // Cleaning
        $("#iteractionsChart path.iteractons").remove();

        var svg = $('#iteractionsChart').svg('get');
        var svgForeground = $("#iteractionsChart g.foreground").svg("get");
        var plot = svg.plot;

        var ticksDistance = values.iteractions / 10;
        plot.xAxis.scale(0, values.iteractions).ticks(ticksDistance, 0, 0).title("");

        var stageSize = parseInt(data.iteractions.length / heatTrail.length);
        heatTrail.forEach(drawSeries);

        plot.redraw();
        $("#iteractionsChart g.background rect").appendTo("#iteractionsChart g.background");
        $('#iteractionsChart path.iteractions').appendTo("#iteractionsChart g.foreground");
    }

    function adjustChart(chartId, posXLabels, fontSize, adjustLabels) {
        var chartId = "#" + chartId + " ";

        function formatAxis(idAxis, axisType, pos, axis0Type, _0Type) {
            var axis = $(chartId + "g." + idAxis);
            axis.appendTo(chartId + "g.background");

            return axis.children("text")
            .attr(axisType, pos)
            .css("font-size", fontSize + "px")
            .css("font-family", 'Tahoma, Geneva, sans-serif')
            .attr("z-index", "10")
            .each(adjustLabels);
        }

        var xAxis = formatAxis("xAxisLabels", "y", posXLabels, "x", "23");
        formatAxis("yAxisLabels", "x", "20", "y", "381").each(function () {
            $(this).attr("y", parseInt($(this).attr("y")) + 5);
        });
        $(chartId + "g.background rect").appendTo(chartId + "g.background");
        $(chartId + "g.xAxis, " + chartId + "g.yAxis").remove();
    }

    function generateData() {
        var data = {
            logistic : [],
            iteractions : []
        };

        var x = values.x0;
        data.iteractions.push(x);
        for (var it = 1; it < values.iteractions; it++) {
            x = (values.r * x * (1 - x));
            data.iteractions.push(x);
        }

        x = data.iteractions[0];
        var y = 0;
        data.logistic.push({
            x : x,
            y : y
        });
        for (var it = 1; it < data.iteractions.length; it++) {
            y = data.iteractions[it];
            data.logistic.push({
                x : x,
                y : x
            });
            data.logistic.push({
                x : x,
                y : y
            });
            x = y;
        }
        data.logistic.splice(1, 1); // workaround


        return data;
    }

    var data = generateData();
    drawLogistic();
    drawIteractions();
    adjustChart("logisticChart", 395, 13, function (index, element) {
        $(element).text($.number((1 + index) / 10, 1));
    });
    adjustChart("iteractionsChart", 99, 10, function (index, element) {
        var el = $(element);
        if (el.parent().attr("class") === "yAxisLabels") {
            el.text($.number(el.text(), 2));
        }
    });
}

function refreshCharts(event, ui) {
    if (!ui.value) {
        return;
    }

    var id = event.target.id;
    var key = (id === "iteractionsValue") ? "spinner" : "logisticspinner";
    var valueName = $("#" + id)[key]("option").valueName;
    values[valueName] = ui.value;

    redraw();
}

function init() {

    function centralize() {
        $("#main").position({
            of : "body"
        });
    }

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
        //        .tooltip()
    ;
    }

    function initIteractionsValue() {
        $("#iteractionsValue").spinner({
            min : 0,
            max : 2000,
            step : 50,
            spin : refreshCharts,
            change : refreshCharts,
            valueName : "iteractions"
        });
    }

    function initLogisticChart(svg) {
        svg.plot
        .area(0.06, 0.02, 0.98, 1.00)
        .equalXY(true)
        .legend.show(false).end()
        .gridlines('lightgrey', 'lightgrey')
        .xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
        .yAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
        .addFunction("linear", function (x) {
            return x;
        }, [0, 1], 1, "GoldenRod", 2)
        .redraw();
    }

    function initIteractonsChart(svg) {
        var ticksDistance = values.iteractions / 10;
        svg.plot
        .area(0.06, 0.05, 0.98, 0.90)
        .equalXY(false)
        .legend.show(false).end()
        .gridlines('lightgrey', 'lightgrey')
        .yAxis.scale(0.0, 1.0).ticks(0.25, 0, 0).title("").end()
        .redraw();
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
    $('#logisticChart').svg(initLogisticChart);
    $('#iteractionsChart').svg(initIteractonsChart);
    redraw();
}

$(document).ready(init);
