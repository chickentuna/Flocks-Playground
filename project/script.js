
//TODO: refactor magic numbers
//TODO: optimise

//LATER: implement the going further chapter (food etc)

var PALETTES = [
	[0xBAAB88, 0x237272, 0x518985, 0x4f5453, 0x43304F],
	[0x6E6159, 0x66782C, 0x7F963B, 0xADBF45, 0xAFC57A],
	[0x0B415B, 0x17E0F5, 0xE7FFFF, 0x0AF7F1, 0x070322],
	[0x8EA1A5, 0x721A33, 0x90012F, 0xC9012F, 0xDD0D2F],
	[0xD4E2A6, 0xF3B993, 0xE27667, 0x4F3E3B, 0x99C4CC],
	[0x0F5FAA, 0x25CCF8, 0xF5FDFD, 0x72B900, 0xF2D62F],
	[0xC2BAB8, 0xA29696, 0x9D9648, 0xB6BE97, 0x343138],
	[0x4F93A6, 0xF2BB9D, 0xD69382, 0xA47273, 0xB19F93]
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
	maxForce: 0.05,
	separation: 2,
	alignment: 1.5,
	cohesion: 0.5,
	speed: 1,
	// periphery: 3 * Math.PI / 4,
	periphery: Math.PI,
	range: 50
};
var friction = 0.01;

var boidLayer = new PIXI.Container();

app.stage.addChild(boidLayer);

function lerpAngle(start, end, amount, maxDelta) {
	while (end > start + Math.PI)
		end -= Math.PI * 2;
	while (end < start - Math.PI)
		end += Math.PI * 2;
	var value;
	if (maxDelta !== undefined && Math.abs(end - start) > maxDelta) {
		value = end;
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
	this.maxSpeed = 6;
	this.angle = 0;
}

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

Boid.prototype.flock = function (boids, delta) {
	// Find nearby boids
	var hood = this.getNeighbourhood(boids);
	// Calculate flocking forces
	var sep = this.separation(hood);
	var ali = this.alignment(hood);
	var coh = this.cohesion(hood);

	// Apply weights to forces	
	sep.multiplyScalar(weights.separation);
	ali.multiplyScalar(weights.alignment);
	coh.multiplyScalar(weights.cohesion);

	// Apply forces to boid
	this.acceleration.add(sep).add(ali).add(coh);
	if (!this.acceleration.isZero()) {
		this.acceleration.normalize().multiplyScalar(weights.maxForce);
	}
};

Boid.prototype.update = function (delta) {
	// Update velocity
	this.velocity.add(this.acceleration);
	limitMagnitude(this.velocity, this.maxSpeed);
	this.velocity.multiplyScalar(1 - friction);
	if (this.velocity.length() < 1e-3) {
        this.velocity.zero();
	} else {
        this.angle = this.velocity.angle();
	}

	// Apply speed to position
	var advance = this.velocity.clone().multiplyScalar(weights.speed);
	this.position.add(advance);

	// Reset acceleration
	this.acceleration.zero();
};

Boid.prototype.steer = function (desired) {
    // Implement Reynolds: Steering = Desired - Velocity
	var steering = desired.subtract(this.velocity);
	return steering;	
};

Boid.prototype.separation = function (hood) {
	var desiredSeparation = this.radius * 2 + 5;

	var average = new Victor(0, 0);
	var count = 0;
	// For every boid in the system, check if it's too close
	for (var i = 0, l = hood.length; i < l; ++i) {
		var neighbour = hood[i];
		var other = neighbour.boid;
		var d = neighbour.distance;
		if (d < desiredSeparation && d > 0) {
			// Calculate vector pointing away from neighbour, weighted by distance 
			var diff = this.position.clone().subtract(other.position).normalize().divideScalar(d);
			average.add(diff);

			// Keep track of how many close boids
			count++;
		}
	}
	if (count > 0) {
		//average.divideScalar(count);
		/*
		if (average.length() < desiredSeparation) {
			//Get off me!			
			average.normalize().multiplyScalar(this.maxSpeed);
		}
		*/
		return this.steer(average.normalize().multiplyScalar(this.maxSpeed));
	}
	return average;
};


// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.alignment = function (hood) {
	var average = new Victor(0, 0);
	var count = 0;
	for (var i = 0, l = hood.length; i < l; ++i) {
		var neighbour = hood[i];
		var other = neighbour.boid;
		average.add(other.velocity);
		count++;
	}
	if (count > 0 && !average.isZero()) {
		//average.divideScalar(count);
		return this.steer(average.normalize().multiplyScalar(this.maxSpeed));
	}
	return average;
};

// Cohesion
// For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position
Boid.prototype.cohesion = function (hood) {
	var average = new Victor(0, 0);	 // Start with empty vector to accumulate all positions
	var count = 0;

	for (var i = 0, l = hood.length; i < l; ++i) {
		var neighbour = hood[i];
		var other = neighbour.boid;
		average.add(other.position); // Add position
		count++;
	}
	if (count > 0) {
		var destination = average.divideScalar(count).subtract(this.position);
		var dist = destination.length();
		if (dist > 0) {
		    destination.normalize();
		}
		if (dist > 20) {
		    destination.multiplyScalar(this.maxSpeed);
		} else {
		    destination.multiplyScalar(dist / 20 * this.maxSpeed);
		}
		
		return this.steer(destination);
	}
	return average;
};

Boid.prototype.render = function () {
	var sprite = this.graphics;
	sprite.x = this.position.x;
	sprite.y = this.position.y;
    
	sprite.rotation = lerpAngle(sprite.rotation, this.angle, 0.1);
};

var boids = [];
for (var i = 0; i < 100; ++i) {
	boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
}

function wrapAround(boid) {
	if (boid.position.x < -OFF_SCREEN_BORDER) {
		boid.position.x += app.screen.width + OFF_SCREEN_BORDER;
	}
	if (boid.position.y < -OFF_SCREEN_BORDER) {
		boid.position.y += app.screen.height + OFF_SCREEN_BORDER;
	}
	if (boid.position.x >= app.screen.width + OFF_SCREEN_BORDER) {
		boid.position.x -= OFF_SCREEN_BORDER + app.screen.width;
	}
	if (boid.position.y >= app.screen.height + OFF_SCREEN_BORDER) {
		boid.position.y -= OFF_SCREEN_BORDER + app.screen.height;
	}
}

function updateBoids(delta) {
	boids.forEach(function (boid) {
		// Decide what to do by looking at other boids
		boid.flock(boids);

		// Move the boid
		boid.update(delta);

		// Wrap around the screen
		wrapAround(boid);

		// Render
		boid.render();
	});
}

var lastTime = null;
function animate(time) {
	delta = time - (lastTime || time);
	updateBoids(delta);
	app.render();
	lastTime = time;
	requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
document.getElementById("canvasZone").appendChild(app.view);

function normalize(v) {
	if (v.isZero()) {
		return v;
	} else {
		return v.normalize();
	}
}

function torusDistance(a, b) {
	var w = app.screen.width + OFF_SCREEN_BORDER * 2;
	var h = app.screen.height + OFF_SCREEN_BORDER * 2;

	var deltaX = Math.min(Math.abs(a.x - b.x), w - Math.abs(a.x - b.x));
	var deltaY = Math.min(Math.abs(a.y - b.y), h - Math.abs(a.y - b.y));

	return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}