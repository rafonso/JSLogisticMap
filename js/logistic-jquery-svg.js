"use strict";

let parameters = {}; //toObservable(new LogisticParameters());

let generator = {}; //toObservable(new LogisticGenerator(parameters));

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
	
	const heatTrace = new Map([
		[0, { // From Indigo [rgb( 75,   0, 130)] to Blue [rgb(  0,   0, 255)]
			r: (pos) => (75 * (- pos + 1)),
			g: (pos) => 0,
			b: (pos) => (125 * pos + 130)
		}]
		,
		[1, { // From Blue [rgb(  0,   0, 255)] to Green [rgb(  0, 255,   0)]
			r: (pos) => 0,
			g: (pos) => (255 * (+ pos - 1)),
			b: (pos) => (255 * (- pos + 2))
		}],
		[2, { // From Green [rgb(  0, 255,   0)] to Yellow [rgb(255, 255,   0)]
			r: (pos) => (255 * (pos - 2)),
			g: (pos) => 255,
			b: (pos) => 0
		}],
		[3, { // From Yellow [rgb(255, 255,   0)] to Orange [rgb(222, 127,   0)] 
			r: (pos) => (- 33 * pos + 354),
			g: (pos) => 255 * (- pos + 5) / 2,
			b: (pos) => 0
		}],
		[4, { // From Orange [rgb(222, 127,   0)] to Red [rgb(255,   0,   0)]
			r: (pos) => (33 * pos + 90),
			g: (pos) => 255 * (- pos + 5) / 2,
			b: (pos) => 0
		}],
		[5, { // Red [rgb(255,   0,   0)]
			r: (pos) => 255,
			g: (pos) => 0,
			b: (pos) => 0
		}]
	]);
	
	function drawSerie(serie, getX, getY, alpha, serieName, svg, svgForeground) {
		
		function calculateColor(i) {
			const stage = Math.floor(i / stageSize);
			const color = heatTrace.get(stage);
			const pos = (i / stageSize);
			
			const r = Math.floor(color.r(pos));
			const g = Math.floor(color.g(pos));
			const b = Math.floor(color.b(pos));
			const a = s.numberFormat(alpha(i), 3); 
			
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
		
		_.range(1, serie.length).forEach(plot);
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
	
	function prepareChart(id) {
        $(`#${id}Chart path`).remove();
		
		return {svg: $(`#${id}Chart`).svg('get'), svgForeground: $(`#${id}Chart g.foreground`).svg("get")};
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
            let y_5 = plot.yToChart(generator.parameters.r / 2);
			
            let quadraticPath = svg.createPath();
            quadraticPath
            .move(x0, y0)
            .curveQ(x_5, y_5, x1, y0);
            svg.path(svgForeground,
			quadraticPath, {
				id: 'parabol',
                fill : 'none',
                stroke : "Violet",
                strokeWidth : 2,
                class : "quadratic"
			});
		}
		
		function writeLegends() {
			$("#legends").remove();
			let g = svg.group("legends");
			svg.text(g, 30, 20, `Iteractions = ${generator.parameters.iteractions}`); 
			svg.text(g, 30, 32, `R = ${generator.parameters.r}`);
			svg.text(g, 30, 44, `x0 = ${generator.parameters.x0}`);
			$("#logisticChart .foreground").prepend($("#legends"));
		}
		
		let {svg, svgForeground} = prepareChart("logistic");
		
        drawQuadratic();
		
		const a0 = 0.5;
		const aMax = 0.95;
        drawSerie(data.logistic, 
		(i) => data.logistic[i].x, 
		(i) => data.logistic[i].y, 
		(i) => a0 + (aMax - a0) * (i / data.logistic.length),
		"logistic", svg, svgForeground);
		
        svg.plot.redraw();
		
		writeLegends();
        adjustChart("logisticChart", 395, 13, function (index, element) {
            $(element).text($.number((1 + index) / 10, 1));
		});
	}
	
    function drawIteractions() {
		let {svg, svgForeground} = prepareChart("iteractions");
		
        let ticksDistance = generator.parameters.iteractions? (generator.parameters.iteractions / 10): 1;
        svg.plot.xAxis
        .scale(0, generator.parameters.iteractions ? generator.parameters.iteractions : 1)
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
		
        let x = generator.parameters.x0;
        data.iteractions.push(x);
		_.range(1, generator.parameters.iteractions).forEach((it) => {
            x = (generator.parameters.r * x * (1 - x));
            data.iteractions.push(x);
		});
		
        x = data.iteractions[0];
        let y = 0;
        data.logistic.push({x, y});
		_.range(1, data.iteractions.length).forEach((it) => {
            y = data.iteractions[it];
            data.logistic.push({x, y : x});
            data.logistic.push({x, y});
            x = y;
		});
        data.logistic.splice(1, 1); // workaround
		
        return data;
	}
	
	// console.time(`redraw ${generator.parameters.iteractions}`);
	
	// console.time(`\tgenerateData ${generator.parameters.iteractions}`);
    var data = generateData();
	// console.timeEnd(`\tgenerateData ${generator.parameters.iteractions}`);
	
	// console.time(`\tdrawLogistic ${generator.parameters.iteractions}`);
    drawLogistic();
	// console.timeEnd(`\tdrawLogistic ${generator.parameters.iteractions}`);
	
	// console.time(`\tdrawIteractions ${generator.parameters.iteractions}`);
    drawIteractions();
	// console.timeEnd(`\tdrawIteractions ${generator.parameters.iteractions}`);
	
	// console.timeEnd(`redraw ${generator.parameters.iteractions}`);
	// console.log("");
}

function saveLogisticChart() {
	let logisticChart = $("#logisticChart");
	let filename = encodeURIComponent(`r=${generator.parameters.r},x0=${generator.parameters.x0},iteractions=${generator.parameters.iteractions}.png`);
	let code = `<meta http-equiv="content-type" content="image/svg+xml"/>
	<meta name="content-disposition" content="inline; filename=${filename}">
	<link rel="stylesheet" type="text/css" href="css/style.css">
	${logisticChart.svg('get').toSVG()}`;
	let uriContent = "data:image/svg+xml"; //," + filename;
	
	let chartWindow = window.open(filename, filename, `left=0,top=0,menubar=1,titlebar=0,width=${logisticChart.width() + 50},height=${logisticChart.height() +50},toolbar=0,scrollbars=0,status=0`);
	chartWindow.document.write(code);
	chartWindow.document.close();
	chartWindow.focus();
}

function init() {
	
    function centralize() {
        $("#main").position({
            of : "body"
		});
	}
	
	function initControls() {
		
		function refreshCharts(event, ui) {
			if (_.isNumber(ui.value)) {
				generator.parameters[$(`#${event.target.id}`).data("valueName")] = ui.value;
			}
		}
		
		const steps = [0.1, 0.01, 0.001, 0.0001, 0.00001];
		
		const actionsByKey = new Map([
			['E', (hasShift) => {
				if(hasShift) {
					changeStep("rValue", false);
					} else {
					$('#rValue').logisticspinner( "stepDown" );
				}
			}],
			['T', (hasShift) => {
				if(hasShift) {
					changeStep("rValue", true);
					} else {
					$('#rValue').logisticspinner( "stepUp" );
				}
			}],
			['U', (hasShift) => {
				$('#iteractionsValue').spinner( "stepDown" );
			}],
			['O', (hasShift) => {
				$('#iteractionsValue').spinner( "stepUp" );
			}],
			['Z', (hasShift) => {
				if(hasShift) {
					changeStep("x0Value", false);
					} else {
					$('#x0Value').logisticspinner( "stepDown" );
				}
			}],
			['C', (hasShift) => {
				if(hasShift) {
					changeStep("x0Value", true);
					} else {
					$('#x0Value').logisticspinner( "stepUp" );
				}
			}]
		]);
		
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
		
		function initFloatSpinner(id, valueName, max) {
			
			function handleStep(event, incrementEvent, decrementEvent) {
				if (!event.ctrlKey) {
					return;
				}
				
				if (incrementEvent(event)) { 
					changeStep(event.target.id, false);
					} else if (decrementEvent(event)) { 
					changeStep(event.target.id, true);
				}
			}
			
			let handleMouse = (event) => handleStep(event, 
			(e) => (e.which === 1), // Left Button
			(e) => (e.which === 3)); // Right Button
			
			let handleKey = (event) =>  handleStep(event, 
			(e) => (e.keyCode === 37), // Left Arrow
			(e) => (e.keyCode === 39)); // Right Arrow
			
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
		
		
		initFloatSpinner("rValue", "r", 4.00).focus();
		initFloatSpinner("x0Value", "x0", 1.00);
		initIteractionsSpinner();
		
		$(window).keypress(function(event) {
			let key = event.key.toUpperCase();
			if(actionsByKey.has(key)) {
				actionsByKey.get(key)(event.shiftKey);
			}});
	}
	
	
	function initCharts() {
		
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
		
		$('#logisticChart').svg(initLogisticChart).dblclick(saveLogisticChart);
		$('#iteractionsChart').svg(initIteractonsChart);
	}
	
	function initGenerator() {
		generator = toObservable(new LogisticGenerator(new LogisticParameters(
		$("#rValue").logisticspinner("value"),
		$("#x0Value").logisticspinner("value"),
		$("#iteractionsValue").spinner("value"))));
		generator.parameters.addObserver((evt) => redraw());
//		generator.values.addObserver((evt) => console.debug(evt));
	}
	
	$(window).resize(centralize);
	
	initControls();
	initCharts();
	initGenerator()
	
	centralize();
	redraw();
}

$(document).ready(init);
