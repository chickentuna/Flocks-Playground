var PALETTES = [
	[0xBAAB88, 0x237272, 0x518985, 0x4f5453, 0x43304F],
	[0x6E6159, 0x66782C, 0x7F963B, 0xADBF45, 0xAFC57A],
	[0x0B415B, 0x17E0F5, 0xE7FFFF, 0x070322, 0x0AF7F1],
	[0x8EA1A5, 0x721A33, 0x90012F, 0xC9012F, 0xDD0D2F],
	[0xD4E2A6, 0xF3B993, 0xE27667, 0x99C4CC, 0x4F3E3B],
	[0x0F5FAA, 0x25CCF8, 0xF5FDFD, 0x72B900, 0xF2D62F],
	[0xC2BAB8, 0xA29696, 0x9D9648, 0xB6BE97, 0x343138],
	[0x4F93A6, 0xF2BB9D, 0xD69382, 0xA47273, 0x0]
];

var palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
var app = new PIXI.Application({
	width: 974,
	height: 548,
	transparent: false,
	resolution: 2,
	backgroundColor: palette[0]
});

var OFF_SCREEN_BORDER = 60;
var weights = {
	//Rules	
	separation: 2,
	alignment: 1.5,
	cohesion: 0.5,
	
	//Physics
	maxForce: 0.05,
	periphery: Math.PI,
	range: 50,
	desiredSpeed: 6
};
var friction = 0.01;

var boidLayer = new PIXI.Container();

app.stage.addChild(boidLayer);

var boids = [];

function lerpAngle(start, end, amount, maxDelta) {
	start %= Math.PI * 2;
	end %= Math.PI * 2;

	while (end > start + Math.PI)
		end -= Math.PI * 2;
	while (end < start - Math.PI)
		end += Math.PI * 2;
	var value;

	if (maxDelta !== undefined && Math.abs(end - start) > maxDelta) {
		if (end > start) {
			value = start + maxDelta;
		} else {
			value = start - maxDelta;
		}
	} else {
		value = (start + ((end - start) * amount));
	}
	return (value % (Math.PI * 2));
}

function limitMagnitude(v, amount) {
	if (v.length() > amount) {
		v.normalize().multiplyScalar(amount);
	}
}

function createBoidGraphics(radius) {
	var g = new PIXI.Graphics();
	drawBoid(g, radius);
	boidLayer.addChild(g);
	return g;
}

function drawBoid(graphics, r) {
	graphics.lineStyle(2, palette[1], 1);
	graphics.beginFill(palette[2], 1);
	graphics.moveTo(r, 0);
	graphics.lineTo(-r, -r / 2);
	graphics.lineTo(-r, r / 2);
	graphics.lineTo(r, 0);
	graphics.endFill();
}

function angleDiff(a, b) {
	return Math.abs(lerpAngle(a, b, 0) - lerpAngle(a, b, 1));
}

function angleBetween(a, b) {
	return b.clone().subtract(a).angle();
}

function Boid(x, y) {
	this.radius = 10;
	this.graphics = createBoidGraphics(this.radius);
	this.position = new Victor(x, y);
	this.velocity = new Victor(0, 0);
	this.acceleration = new Victor(0, 0);
	this.angle = Math.random() * Math.PI * 2;
	this.init();
}

Boid.prototype.decision = function (environment) {
};

Boid.prototype.init = function () {
};

Boid.prototype.getNeighbourhood = function (boids) {
	var range = weights.range;
	var periphery = weights.periphery;
	var hood = [];
	var self = this;
	boids.forEach(function (boid) {
		if (boid === self)
			return;

		var distance = torusDistance(self.position, boid.position);
		var angle = angleBetween(self.position, boid.position);
		if (distance < range && angleDiff(angle, self.velocity.angle()) <= periphery) {
			hood.push({
				boid: boid,
				distance: distance,
				angle: angle
			});
		}
	});

	return hood;
};

Boid.prototype.postUpdate = function () {
	if (this.velocity.length() < 1e-3) {
		this.velocity.zero();
	} else {
		this.angle = this.velocity.angle();
	}
};

Boid.prototype.update = function () {
	// Update velocity
	this.velocity.add(this.acceleration);

	// Friction
	this.velocity.multiplyScalar(1 - friction);

	// Apply speed to position
	this.position.add(this.velocity);

	// Reset acceleration
	this.acceleration.zero();
};

Boid.prototype.steer = function (desired) {
	// Implement Reynolds: Steering = Desired - Velocity
	var steering = desired.subtract(this.velocity);
	return steering;
};

Boid.prototype.render = function () {
	var sprite = this.graphics;
	sprite.x = this.position.x;
	sprite.y = this.position.y;

	sprite.rotation = lerpAngle(sprite.rotation, this.angle, 0.1);
};

function wrapAround(boid) {
	if (boid.position.x < -OFF_SCREEN_BORDER) {
		boid.position.x += app.screen.width + OFF_SCREEN_BORDER * 2;
	}
	if (boid.position.y < -OFF_SCREEN_BORDER) {
		boid.position.y += app.screen.height + OFF_SCREEN_BORDER * 2;
	}
	if (boid.position.x >= app.screen.width + OFF_SCREEN_BORDER) {
		boid.position.x -= OFF_SCREEN_BORDER * 2 + app.screen.width;
	}
	if (boid.position.y >= app.screen.height + OFF_SCREEN_BORDER) {
		boid.position.y -= OFF_SCREEN_BORDER * 2 + app.screen.height;
	}
}

function getEnvironment() {
	return {
		boids: boids
	};
}

function updateEnvironment() {
}

function updateBoids() {
	updateEnvironment();
	
	var environment = getEnvironment();

	boids.forEach(function (boid) {
		// Decide what to do by looking at other boids
		boid.decision(environment);

		// Move the boid
		boid.update();
		boid.postUpdate();

		// Wrap around the screen
		wrapAround(boid);

		// Render
		boid.render();
	});
}

function animate() {
	updateBoids();
	app.render();
	requestAnimationFrame(animate);
}

document.getElementById("canvasZone").appendChild(app.view);

function torusDistance(a, b) {
	var w = app.screen.width + OFF_SCREEN_BORDER * 2;
	var h = app.screen.height + OFF_SCREEN_BORDER * 2;

	var deltaX = Math.min(Math.abs(a.x - b.x), w - Math.abs(a.x - b.x));
	var deltaY = Math.min(Math.abs(a.y - b.y), h - Math.abs(a.y - b.y));

	return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

/**
 * Gets the percentage position in [a;b] of number v
 */
function unlerp(a, b, v) {
  return (v - a) / (b - a);
}
