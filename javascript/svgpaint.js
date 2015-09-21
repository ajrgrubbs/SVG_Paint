/**
 * @param target A CSS selector or element referencing the target canvas
 */
function SVGPaint(target) {
	var canvas = $(target);
	var color = "red";
	var width = "2px";
	var mode;
	var valid_modes = ['line'];
	var registry = {};
	
	// Public Methods
	this.setColor = function(col) {
		color = col;
	}
	this.setWidth = function(w) {
		width = w;
	}
	this.setMode = function(m) {
		var behavior = registry[m];
		if (!behavior) {
			throw "Mode '" + m + "' is not recognized.";
		}
		$.each(["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend"], function(i, eventType) {
			canvas.off(eventType);
			var handlers = behavior[eventType];
			if (handlers) {
				$.each(handlers, function(j, handler) {
					canvas.on(eventType, handler);
				});
			}
		});
	}
	
	// Private helper methods
	var makeSVG = function(tag) {
		return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
	}
	
	var getX = function(e) {
		return e.clientX || e.originalEvent.touches[0].clientX;
	}
	
	var getY = function(e) {
		return e.clientY || e.originalEvent.touches[0].clientY;
	}
	
	// Different Mode Behaviors
	var Line = function() {
		var lineFlag = false, line;
		
		var create = function(e) {
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
			lineFlag = true;
		};
		
		var update = function(e) {
			if (lineFlag) {
				line.attr({
					x2: getX(e),
					y2: getY(e)
				})
			}
		}
		
		var finalize = function(e) {
			lineFlag = false;
		}
		
		this.mousedown = [create];
		this.mousemove = [update];
		this.mouseup = [finalize];
		this.touchstart = [create];
		this.touchmove = [update];
		this.touchend = [finalize];
	}
	registry.line = new Line();
	
	this.setMode('line'); // Default behavior
	
	
	var Path = function() {
		var pathFlag = false, newPointFlag = false, path, directives = [];
		
		var parseDirectives = function() {
			var result = "";
			$.each(directives, function(i, directive) {
				if (directive.t == "M" || directive.t == "m" || directive.t == "L" || directive.t == "l") {
					result += directive.t + " " + directive.x + "," + directive.y + " ";
				}
			});
			return result;
		};
		
		var interval;
		
		var create = function(e) {
			var x = getX(e);
			var y = getY(e);
			directives = [{
				t: "M",
				x: x,
				y: y
			}];
			
			var svg = makeSVG('svg').css({
				width: '100%',
				height: '100%'
			});
			path = makeSVG("path").attr({
				d: parseDirectives(),
				stroke: color,
				'stroke-width': width,
				fill: 'none'
			});
			canvas.append(svg.append(path));
			pathFlag = true;
			newPointFlag = true;
			
			// Temp, for testing
			if (interval) {
				clearInterval(interval);
			}
			interval = setInterval(function() {
				console.log("ping");
				if (pathFlag) {
					newPointFlag = true;
				}
				else {
					clearInterval(interval);
				}
			}, 2000);
		};
		
		var update = function(e) {
			if(pathFlag) {
				if (newPointFlag) {
					directives.push({});
					newPointFlag = false;
				}
				
				directives[directives.length -1] = {
					t: "L",
					x: getX(e),
					y: getY(e)
				};
				
				path.attr({
					d: parseDirectives()
				});
			}
		}
		
		var finalize = function(e) {
			console.log("Done");
			pathFlag = false;
		}
		
		this.touchstart = [create];
		this.touchmove = [update];
		this.touchend = [finalize];
	}
	registry.path = new Path();
	
}