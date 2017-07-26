var weights = {
	// Rules
	cohesion: 0.5,
	alignment: 1.5,
	separation: 2,
	fear: 1,
	hunger: 100,

	// Physics
	maxForce: 0.05,
	periphery: Math.PI,
	range: 50,
	desiredSpeed: 6
};


function drawBoid(graphics, r) {
	graphics.lineStyle(2, palette[1], 1);
	graphics.beginFill(palette[2], 1);
	graphics.moveTo(r, 0);
	graphics.lineTo(-r, -r / 2);
	graphics.lineTo(-r, r / 2);
	graphics.lineTo(r, 0);
	graphics.endFill();

	graphics.lineStyle(2, palette[1], 0);

	graphics.beginFill(0xFFFFFF, 1);
	graphics.drawCircle(2 * r / 4, -r / 3, r / 4);
	graphics.drawCircle(2 * r / 4, r / 3, r / 4);
	graphics.endFill();

	graphics.beginFill(0x0, 1);
	graphics.drawCircle(2 * r / 4 + 1, -r / 3, r / 16);
	graphics.drawCircle(2 * r / 4 + 1, r / 3, r / 16);
	graphics.endFill();
}
Boid.prototype.flock = function (boids) {
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
		return this.steer(average.normalize().multiplyScalar(weights.desiredSpeed));
	}
	return average;
};


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
		return this.steer(average.normalize().multiplyScalar(weights.desiredSpeed));
	}
	return average;
};

Boid.prototype.cohesion = function (hood) {
	var average = new Victor(0, 0);
	var count = 0;

	for (var i = 0, l = hood.length; i < l; ++i) {
		var neighbour = hood[i];
		var other = neighbour.boid;
		average.add(other.position);
		count++;
	}
	if (count > 0) {
		var destination = average.divideScalar(count).subtract(this.position);
		var dist = destination.length();
		if (dist > 0) {
			destination.normalize();
		}
		destination.multiplyScalar(weights.desiredSpeed);
		return this.steer(destination);
	}
	return average;
};

function getEnvironment() {
	return {
		boids: boids,
		foods: foods,
		walls: walls
	};
}

Boid.prototype.decision = function (environment) {
	this.flock(environment.boids);
	this.eat(environment.foods);
	this.avoid(environment.walls);

	// if (!this.acceleration.isZero()) {
	if (this.acceleration.length() > weights.maxForce) {
		this.acceleration.normalize().multiplyScalar(weights.maxForce);
	}
};

Boid.prototype.eat = function (foods) {
	var closestFood = null;
	var foodDistSq = 0;

	for (var i = 0; i < foods.length; ++i) {
		var food = foods[i];
		if (food.amount <= 0) {
			continue;
		}
		var d = this.position.distanceSq(food.graphics);

		// Already eating
		if (d < Math.pow(this.radius + food.radius, 2)) {
			// Take a bite
			food.amount -= 1;
			food.graphics.alpha = food.amount / food.initialAmount;

			// Stay put
			return this.steer(new Victor(0, 0));
		} else if (d < Math.pow(this.radius + weights.range + food.radius, 2)) {
			//Consider food
			if (closestFood === null || foodDistSq > d) {
				closestFood = food;
				foodDistSq = d;
			}
		}
	}
	if (closestFood !== null) {
		eat = this.steer(Victor.fromObject(closestFood.graphics).subtract(this.position).normalize().multiplyScalar(weights.desiredSpeed));
		if (eat.length() > 0) {
			eat.normalize().multiplyScalar(weights.hunger);
		}
		this.acceleration.add(eat);
	}
	
};

Boid.prototype.avoid = function (walls) {
	var avoid = new Victor(0, 0);
	var wallRange = weights.range * 2;

	for (var i = 0; i < walls.length; ++i) {
		var wall = walls[i];
		var d = this.position.distanceSq(wall.graphics);

		if (d < Math.pow(wallRange + wall.radius, 2)) {
			var angle = angleBetween(this.position, Victor.fromObject(wall.graphics));
			var theta = angleDiff(angle, this.angle);
			var distToBorder = d - Math.pow(wall.radius, 2);
			var v;
			if (distToBorder > 0) {
				//Move away from border
				var coeff = 1 - unlerp(0,Math.PI, theta);
				v = this.position.clone().subtract(wall.graphics).normalize().multiplyScalar(coeff);
				avoid.add(v);
			} else {
				//I'm inside a wall!
			}

		}

	}

	if (avoid.length() > 0) {
		avoid = this.steer(avoid.normalize().multiplyScalar(weights.desiredSpeed));
		this.acceleration.add(avoid.multiplyScalar(weights.fear));
	}
	
};


function updateEnvironment() {
	// Clear eaten foods
	var leftovers = [];
	foods.forEach(function (f) {
		if (f.amount <= 0) {
			foodLayer.removeChild(f.graphics);
		} else {
			leftovers.push(f);
		}
	});
	foods = leftovers;

	// Collisions
	for (var i = 0, l = boids.length; i < l; ++i) {
		var boid = boids[i];
		for (var j = 0, k = walls.length; j < k; ++j) {
			var wall = walls[j];
			if (boid.position.distanceSq(wall.graphics) < Math.pow(boid.radius + wall.radius, 2)) {
				var snap = boid.position.clone().subtract(wall.graphics).normalize().multiplyScalar(wall.radius + boid.radius).add(wall.graphics);
				boid.position = snap;
				boid.velocity.divideScalar(10);
			}
		}
	}
}


for (var i = 0; i < 100; ++i) {
	boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
}

var foodLayer = new PIXI.Container();
var wallLayer = new PIXI.Container();

app.stage.removeChildren();
app.stage.addChild(wallLayer);
app.stage.addChild(foodLayer);
app.stage.addChild(boidLayer);


function getFoodGraphics(r) {
	var c = new PIXI.Container();

	var g = new PIXI.Graphics();
	g.beginFill(palette[2], 1);
	g.drawCircle(0, 0, r);
	g.endFill();

	var label = new PIXI.Text('FOOD', { fontFamily: 'Arial', fontSize: 14, fill: palette[4], align: 'center' });
	label.anchor.x = label.anchor.y = 0.5;

	c.addChild(g);
	c.addChild(label);
	foodLayer.addChild(c);
	return c;
}

function getWallGraphics(r) {
	var g = new PIXI.Graphics();
	g.beginFill(0x0, 1);
	g.drawCircle(0, 0, r);
	g.endFill();
	wallLayer.addChild(g);
	return g;
}

function Food(x, y) {
	this.radius = 20;
	this.initialAmount = 800;
	this.amount = this.initialAmount;
	this.graphics = getFoodGraphics(this.radius);
	this.graphics.x = x;
	this.graphics.y = y;
}

function Wall(x, y) {
	this.radius = 40 + Math.random(60);
	this.graphics = getWallGraphics(this.radius);
	this.graphics.x = x;
	this.graphics.y = y;
}

var foods = [];
var walls = [];

for (var i = 0; i < 10; ++i) {
	var x = Math.random() * (app.screen.width - 200) + 100;
	var y = Math.random() * (app.screen.height - 200) + 100;
	var w = new Wall(x, y);
	walls.push(w);
}

app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
app.stage.interactive = true;
app.stage.mousedown = function (e) {
	var p = e.data.getLocalPosition(this);
	var f = new Food(p.x, p.y);
	foods.push(f);
};