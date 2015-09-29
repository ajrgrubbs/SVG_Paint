/**
 * @param target A CSS selector or element referencing the target canvas
 */
function SVGPaint(target) {
	var canvas = $(target);
	var touchHandler = new MultiTouchHandler(target);

	var color = "red";
	var fill = "none";
	var width = "2px";
	var registry = {};

	// Public Functions
	this.setColor = function(col) {
		color = col;
	}
	this.setFill = function(col) {
		fill = col;
	}
	this.setWidth = function(w) {
		width = w;
	}
	this.setMode = function(m) {
		var behavior = registry[m];
		if (!behavior) {
			throw "Mode '" + m + "' is not recognized.";
		}
		touchHandler.clearEvents();
		behavior.registerEvents(touchHandler);
	}

	// Private helper functions
	var makeSVG = function(tag) {
		return $(document.createElementNS("http://www.w3.org/2000/svg", tag));
	}

	var getX = function(e, i) {
		i = i || 0;
		return e.originalEvent.touches[i].clientX;
	}

	var getY = function(e, i) {
		i = i || 0;
		return e.originalEvent.touches[i].clientY;
	}

	// Line Behaviors
	var Line = function() {
		var line;

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
		};

		var update = function(e) {
			line.attr({
				x2: getX(e),
				y2: getY(e)
			})
		}

		this.registerEvents = function(touchHandler) {
			touchHandler.touchStart(create, 0);
			touchHandler.touchMove(update, 0, true);
		}
	}
	registry.line = new Line();
	this.setMode('line'); // Lines are default behavior

	// Path behavior
	var Path = function() {
		var newPointFlag = false, path, directives = [];

		var parseDirectives = function() {
			var result = "";
			$.each(directives, function(i, directive) {
				if (directive.t == "M" || directive.t == "m" || directive.t == "L" || directive.t == "l") {
					result += directive.t + " " + directive.x + "," + directive.y + " ";
				}
				else if (directive.t == "Q" || directive.t == "q") {
					result += directive.t + directive.x1 + "," + directive.y1 + " " + directive.x + "," + directive.y + " ";
				}
			});
			return result;
		};

		var segmentStart;

		var create = function(e) {
			var x = getX(e);
			var y = getY(e);
			segmentStart = {x: x, y: y};
			directives = [{
				t: "M",
				x: x,
				y: y
			}];

			var svg = makeSVG('svg').css({
				position: 'absolute',
				width: '100%',
				height: '100%'
			});
			path = makeSVG("path").attr({
				d: parseDirectives(),
				stroke: color,
				'stroke-width': width,
				fill: fill
			});
			canvas.append(svg.append(path));
			newPointFlag = true;
		};

		var update = function(e) {
			requestAnimationFrame(function() {

				if (newPointFlag) {
					directives.push({t: "L"});
					newPointFlag = false;
				}

				directives[directives.length - 1].x = getX(e);
				directives[directives.length - 1].y = getY(e);

				path.attr({
					d: parseDirectives()
				});

			});
		}

		var ctlPointRoot;
		var prepareArc = function(e) {
			ctlPointRoot = {
				x: getX(e, 1),
				y: getY(e, 1)
			};
			console.log("Control point rooted at: " + ctlPointRoot.x + ", " + ctlPointRoot.y);
		}

		var alterCurve = function(e) {
			requestAnimationFrame(function() {
				var center = {
					x: (segmentStart.x + getX(e)) / 2,
					y: (segmentStart.y + getY(e)) / 2
				};
				directives[directives.length - 1] = {
					t: "Q",
					x: getX(e),
					y: getY(e),
					x1: center.x + (getX(e, 1) - ctlPointRoot.x),
					y1: center.y + (getY(e, 1) - ctlPointRoot.y)
				};
			});
		}

		var newPoint = function(e) {
			newPointFlag = true;
			segmentStart = {x: getX(e), y: getY(e)};
		}

		this.registerEvents = function(touchHandler) {
			touchHandler.touchStart(create, 0);
			touchHandler.touchMove(update, 0, true);
			touchHandler.touchStart(prepareArc, 1);
			touchHandler.touchMove(alterCurve, 1, true);
			touchHandler.touchEnd(newPoint, 1);
		}
	}
	registry.path = new Path();

}

function MultiTouchHandler(canvas) {
	var canvas = $(canvas);
	var eventRegistry = {};

	var genericHandler = function(e) {
		e.preventDefault();
		var type = eventRegistry[e.type];
		if (type) {
			if(type[-1]) {
				$.each(type[-1], function(i, eventHandler) {
					eventHandler(e);
				});
			}

			$.each(e.originalEvent.changedTouches, function(i, touch) {
				finger = touch.identifier;
				if(type[finger]) {
					$.each(type[finger], function(j, handler) {
						handler(e);
					});
				}
			});
		}
	}

	// Public Functions
	this.clearEvents = function() {
		$.each(eventRegistry, function(eventName, fingerEvents) {
			$.each(fingerEvents, function(fingerIndex, eventsArray) {
				eventRegistry[eventName][fingerIndex] = [];
			});
		});
	};

	this.addEvent = function(eventType, eventHandler, finger, throttle) {
		if (!$.isNumeric(finger) || finger < 0) {
			finger = -1;
		}

		if (eventRegistry[eventType] == null) {
			eventRegistry[eventType] = {};

			canvas.on(eventType, genericHandler);
		}
		if (eventRegistry[eventType][finger] == null) {
			eventRegistry[eventType][finger] = [];
		}

		eventRegistry[eventType][finger].push(eventHandler);
	};

	// For convenience
	this.touchStart = function(eventHandler, finger, throttle) {
		this.addEvent("touchstart", eventHandler, finger, throttle);
	}
	this.touchMove = function(eventHandler, finger, throttle) {
		this.addEvent("touchmove", eventHandler, finger, throttle);
	}
	this.touchEnd = function(eventHandler, finger, throttle) {
		this.addEvent("touchend", eventHandler, finger, throttle);
	}

}
