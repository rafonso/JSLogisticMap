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
	
	const colorsByStage = new Map([
		[0, { // From Indigo [rgb( 75,   0, 130)] to Blue [rgb(  0,   0, 255)]
			r: (i, interval) => (75 * (- (i / interval) + 1)),
			g: (i, interval) => 0,
			b: (i, interval) => (125 *  (i / interval) + 130)
		}]
		,
		[1, { // From Blue [rgb(  0,   0, 255)] to Green [rgb(  0, 255,   0)]
			r: (i, interval) => 0,
			g: (i, interval) => (255 * (+ (i / interval) - 1)),
			b: (i, interval) => (255 * (- (i / interval) + 2))
		}],
		[2, { // From Green [rgb(  0, 255,   0)] to Yellow [rgb(255, 255,   0)]
			r: (i, interval) => (255 * ((i / interval) - 2)),
			g: (i, interval) => 255,
			b: (i, interval) => 0
		}],
		[3, { // From Yellow [rgb(255, 255,   0)] to Orange [rgb(222, 127,   0)] 
			r: (i, interval) => (- 33 * (i / interval) + 354),
			g: (i, interval) => 255 * (- (i / interval) + 5) / 2,
			b: (i, interval) => 0
		}],
		[4, { // From Orange [rgb(222, 127,   0)] to Red [rgb(255,   0,   0)]
			r: (i, interval) => (33 * (i / interval) + 90),
			g: (i, interval) => 255 * (- (i / interval) + 5) / 2,
			b: (i, interval) => 0
		}],
		[5, { // Red [rgb(255,   0,   0)]
			r: (i, interval) => 255,
			g: (i, interval) => 0,
			b: (i, interval) => 0
		}]
	]);
	
	function drawSerie(serie, getX, getY, alpha, serieName, svg, svgForeground) {
		
		function calculateColor(i) {
			const stage = Math.floor(i / stageSize);
			const color = colorsByStage.get(stage);
			
			const r = Math.floor(color.r(i, stageSize));
			const g = Math.floor(color.g(i, stageSize));
			const b = Math.floor(color.b(i, stageSize));
			const a = alpha(i);
			
			return `rgba(${r}, ${g}, ${b}, ${a})`;
		}
		
		function plot(i) {
			const path = svg.createPath();
			const plot = svg.plot;
			const color = calculateColor(i);
			
			path.moveTo(plot.xToChart(getX(i-1)), plot.yToChart(getY(i-1)));
            path.line(plot.xToChart(getX(i)), plot.yToChart(getY(i)));
            svg.path(svgForeground, path, {
                id : (serieName + i),
                fill : 'none',
                stroke : color,
                strokeWidth : 1,
                class : serieName
			});
		}
		
		var stageSize = parseInt(serie.length / 5);
		
		for(let i = 1; i < serie.length; i ++) {
			plot(i);
		}
	}
	
    /**
		* Make adjusts on charts which can not be done using the JQuary.SVG.plot API.
	*/
    function adjustChart(chartId, posXLabels, fontSize, adjustLabels) {
		
        function formatAxis(idAxis, axisType, pos, axis0Type, _0Type) {
            const axis = $(`#${chartId} g.${idAxis}`);
            axis.appendTo(`#${chartId} g.background`);
			
            return axis.children("text")
            .attr(axisType, pos)
            .css("font-size", fontSize + "px")
            .each(adjustLabels);
		}
		
        formatAxis("xAxisLabels", "y", posXLabels, "x", "23");
        formatAxis("yAxisLabels", "x", 20, "y", "381").each(function () {
            $(this).attr("y", parseInt($(this).attr("y")) + 5);
		});
        $(`#${chartId} g.background rect`).appendTo(`#${chartId} g.background`);
        $(`#${chartId} path`).appendTo(`#${chartId} g.foreground`);
        $(`#${chartId} g.xAxis, #${chartId} g.yAxis`).remove();
	}
	
    function drawLogistic() {
		
        /*
			* Draw quadratic equation using quadratic Bézier curve.
			* The parabol extremities are the points (0,0) and (1, 0).
			*
		*/
        function drawQuadratic() {
            let plot = svg.plot;
            let y0 = plot.yToChart(0);
            let x0 = plot.xToChart(0);
            let x1 = plot.xToChart(1);
            let x_5 = plot.xToChart(0.5);
            let y_5 = plot.yToChart(values.r / 2);
			
            let quadraticPath = svg.createPath();
            quadraticPath
            .move(x0, y0)
            .curveQ(x_5, y_5, x1, y0);
            svg.path(svgForeground,
			quadraticPath, {
                fill : 'none',
                stroke : "Violet",
                strokeWidth : 2,
                class : "quadratic"
			});
		}
		
        // Cleaning
        $("#logisticChart path").remove();
        let svg = $('#logisticChart').svg('get');
        let svgForeground = $("#logisticChart g.foreground").svg("get");
		
        drawQuadratic();
		
        drawSerie(data.logistic, 
		(i) => data.logistic[i].x, 
		(i) => data.logistic[i].y, 
		(i) => 0.5 + (1 - 0.5) * i / data.logistic.length,
		"logistic", svg, svgForeground)
		
        svg.plot.redraw();
        adjustChart("logisticChart", 395, 13, function (index, element) {
            $(element).text($.number((1 + index) / 10, 1));
		});
	}
	
    function drawIteractions() {
        // Cleaning
        $("#iteractionsChart path").remove();
        let svg = $('#iteractionsChart').svg('get');
        let svgForeground = $("#iteractionsChart g.foreground").svg("get");
		
        let ticksDistance = values.iteractions? (values.iteractions / 10): 1;
        svg.plot.xAxis
        .scale(0, values.iteractions ? values.iteractions : 1)
        .ticks(ticksDistance, 0, 0)
        .title("");
		
        drawSerie(data.iteractions, 
		(i) =>  i + 1,
		(i) => data.iteractions[i],
		(i) => 1,
		"iteractions", svg, svgForeground)
		
        svg.plot.redraw();
        adjustChart("iteractionsChart", 99, 10, function (index, element) {
            let el = $(element);
            if (el.parent().attr("class") === "yAxisLabels") {
                el.text($.number(el.text(), 2));
			}
		});
	}
	
    function generateData() {
		
        let data = {
            logistic : [],
            iteractions : []
		};
		
        let x = values.x0;
        data.iteractions.push(x);
        for (let it = 1; it < values.iteractions; it++) {
            x = (values.r * x * (1 - x));
            data.iteractions.push(x);
		}
		
        x = data.iteractions[0];
        let y = 0;
        data.logistic.push({
            x : x,
            y : y
		});
        for (let it = 1; it < data.iteractions.length; it++) {
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
    if ($.isNumeric(ui.value)) {
        values[$(`#${event.target.id}`).data("valueName")] = ui.value;
        redraw();
	}
}

function init() {
	
    const steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];
	
    function centralize() {
        $("#main").position({
            of : "body"
		});
	}
	
    function initFloatSpinner(id, valueName, max) {
		
        function changeStep(id, decreaseStep) {
            let stepPos = $("#" + id).logisticspinner("option", "stepPos");
            let delta = 0;
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
		
        const spinnerOptions = {
            min : 0.00,
            max : max,
            stepPos : 1,
            step : steps[1],
            numberFormat : "n",
            spin : refreshCharts,
            change : refreshCharts,
		};
		
        return $("#" + id)
        .logisticspinner(spinnerOptions)
        .mousedown(handleMouse)
        .keydown(handleKey)
        .bind("contextmenu", () => false)
		.data("valueName", valueName);
	}
	
    function initIteractionsSpinner() {
        $("#iteractionsValue").spinner({
            min : 0,
            max : 2000,
            step : 50,
            spin : refreshCharts,
            change : refreshCharts,
		}).data("valueName", "iteractions");
	}
	
    function initChart(svg, left, top, right, bottom, equalXY, yTicks) {
        return svg.plot
        .area(left, top, right, bottom)
        .equalXY(equalXY)
        .legend.show(false).end()
        .gridlines('lightgrey', 'lightgrey')
        .yAxis.scale(0.0, 1.0).ticks(yTicks, 0, 0).title("").end();
	}
	
    function initLogisticChart(svg) {
        initChart(svg, 0.06, 0.02, 0.98, 1.00, true, 0.1)
        .xAxis.scale(0.0, 1.0).ticks(0.1, 0, 0).title("").end()
        .addFunction("linear", (x) =>  x, [0, 1], 1, "GoldenRod", 2);
	}
	
    function initIteractonsChart(svg) {
        initChart(svg, 0.06, 0.05, 0.98, 0.90, false, 0.25);
	}
	
    $(window).resize(centralize);
	
    centralize();
    initFloatSpinner("rValue", "r", 4.00).focus();
    initFloatSpinner("x0Value", "x0", 1.00);
    initIteractionsSpinner();
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
