"use strict";

var values = {};

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

    var heatTrail = [
        "rgba(000, 255, 0, 0.30)",
        "rgba( 55, 200, 0, 0.45)",
        "rgba(128, 128, 0, 0.60)",
        "rgba(200,  55, 0, 0.75)",
        "rgba(255, 000, 0, 0.90)"];

    function drawSerie(serie, getX, getY, canTraceStage, serieName, svg, svgForeground) {

        function drawStage(heatColor, stage) {
            var startStage = stage * stageSize;
            var endStage = startStage + stageSize;
            var path = svg.createPath();

            path.moveTo(plot.xToChart(getX(startStage)), plot.yToChart(getY(startStage)));
            for (var i = startStage + 1; canTraceStage(i, endStage); i++) {
                path.line(plot.xToChart(getX(i)), plot.yToChart(getY(i)));
            }

            svg.path(svgForeground, path, {
                id : (serieName + stage),
                fill : 'none',
                stroke : heatColor,
                strokeWidth : 1,
                class : serieName
            });
        }

        var plot = svg.plot;
        var stageSize = parseInt(serie.length / heatTrail.length);
        heatTrail.forEach(drawStage);
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

        formatAxis("xAxisLabels", "y", posXLabels, "x", "23");
        formatAxis("yAxisLabels", "x", "20", "y", "381").each(function () {
            $(this).attr("y", parseInt($(this).attr("y")) + 5);
        });
        $(chartId + "g.background rect").appendTo(chartId + "g.background");
        $(chartId + 'path').appendTo(chartId + "g.foreground");
        $(chartId + "g.xAxis, " + chartId + "g.yAxis").remove();
    }

    function drawLogistic() {

        /*
         * Draw quadratic equation using quadratic Bézier curve.
         * The parabol extremities are the points (0,0) and (1, 0).
         *
         */
        function drawQuadratic() {
            var plot = svg.plot;
            var y0 = plot.yToChart(0);
            var x0 = plot.xToChart(0);
            var x1 = plot.xToChart(1);
            var x_5 = plot.xToChart(0.5);
            var y_5 = plot.yToChart(values.r / 2);

            var quadraticPath = svg.createPath();
            quadraticPath
            .move(x0, y0)
            .curveQ(x_5, y_5, x1, y0);
            svg.path(svgForeground,
                quadraticPath, {
                fill : 'none',
                stroke : "Blue",
                strokeWidth : 2,
                class : "quadratic"
            });
        }

        // Cleaning
        $("#logisticChart path").remove();
        var svg = $('#logisticChart').svg('get');
        var svgForeground = $("#logisticChart g.foreground").svg("get");

        drawQuadratic();

        drawSerie(data.logistic, function (i) {
            return data.logistic[i].x;
        }, function (i) {
            return data.logistic[i].y;
        }, function (i, endStage) {
            return i < endStage;
        }, "logistic", svg, svgForeground)

        svg.plot.redraw();
        adjustChart("logisticChart", 395, 13, function (index, element) {
            $(element).text($.number((1 + index) / 10, 1));
        });
    }

    function drawIteractions() {
        // Cleaning
        $("#iteractionsChart path").remove();
        var svg = $('#iteractionsChart').svg('get');
        var svgForeground = $("#iteractionsChart g.foreground").svg("get");

        var ticksDistance = values.iteractions / 10;
        svg.plot.xAxis.scale(0, values.iteractions).ticks(ticksDistance, 0, 0).title("");

        drawSerie(data.iteractions, function (i) {
            return i + 1;
        }, function (i) {
            return data.iteractions[i];
        }, function (i, endStage) {
            return i <= Math.min(endStage, data.iteractions.length - 1);
        }, "iteractions", svg, svgForeground)

        svg.plot.redraw();
        adjustChart("iteractionsChart", 99, 10, function (index, element) {
            var el = $(element);
            if (el.parent().attr("class") === "yAxisLabels") {
                el.text($.number(el.text(), 2));
            }
        });
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

    var steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];

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
