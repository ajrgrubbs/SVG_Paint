/**
 * @param target A CSS selector or element referencing the target canvas
 */
function SVGPaint(target) {
	var canvas = $(target);
	var color = "red";
	var width = "2px";
	
	// Public Methods
	this.setColor = function(col) {
		color = col;
	}
	this.setWidth = function(w) {
		width = w;
	}
	
	// Private methods
	var makeSVG = function(tag) {
		return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
	}
	
	var getX = function(e) {
		return e.clientX || e.originalEvent.touches[0].clientX;
	}
	
	var getY = function(e) {
		return e.clientY || e.originalEvent.touches[0].clientY;
	}

	var line, flag;
	canvas.on("mousedown touchstart", function(e) {
		var x = getX(e);
		var y = getY(e);
		
		var svg = makeSVG('svg').css({
			position: 'absolute',
			width: '100%',
			height: '100%'
		});
		line = makeSVG("line").attr({
			x1: x,
			x2: x,
			y1: y,
			y2: y,
			stroke: color,
			'stroke-width': width
		});
		canvas.append(svg.append(line));
		flag = true;
	});
	
	canvas.on("mousemove touchmove", function(e) {
		if (flag) {
			line.attr({
				x2: getX(e),
				y2: getY(e)
			})
		}
	});
	
	canvas.on("mouseup touchend", function() {
		flag = false;
	});
}