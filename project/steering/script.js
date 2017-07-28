var targetLayer = new PIXI.Container();

var targetGraphics = new PIXI.Graphics();
targetGraphics.lineStyle(2, palette[4]);
targetGraphics.drawCircle(0,0,5);
targetGraphics.moveTo(0,-10);
targetGraphics.lineTo(0,+10);
targetGraphics.moveTo(-10, 0);
targetGraphics.lineTo(+10, 0);
targetLayer.addChild(targetGraphics);


app.stage.removeChildren();

app.stage.addChild(targetLayer);
app.stage.addChild(boidLayer);

function project(a,b) { 
	var normB = b.clone.normalize();
	return normB.multiplyScalar(normB.dot(a));
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
	this.label = new PIXI.Text('You',{fontFamily : 'Arial', fontSize: 24, fill : palette[4], align : 'center'});
	this.graphics.addChild(this.label);
	this.label.anchor.x = 0.5;
	this.label.anchor.y = 1.2;
}

function MyBoid(x, y) {
	this.radius = 10;
	this.graphics = createBoidGraphics(this.radius);
	this.position = new Victor(x, y);
	this.velocity = new Victor(0, 0);
	this.acceleration = new Victor(0, 0);
	this.angle = Math.random() * Math.PI * 2;
	this.label = new PIXI.Text('Sample',{fontFamily : 'Arial', fontSize: 24, fill : palette[4], align : 'center'});
	this.graphics.addChild(this.label);
	this.label.anchor.x = 0.5;
	this.label.anchor.y = 1.2;
}

MyBoid.prototype.decision = function() {
	// Find a vector pointing towards the given target
	var desired = getTarget().clone().subtract(this.position);
	
	// Set the length of the vector to 6.
	if (!desired.isZero()) {
		desired.normalize().multiplyScalar(DESIRED_SPEED);
	}

	this.acceleration = this.steer(desired);
};
MyBoid.prototype.update = function() {
	// Limit acceleration force (smaller values make for wider turns)
	var maxForce = 0.05;
	if (this.acceleration.length() > maxForce) {
		this.acceleration.normalize().multiplyScalar(maxForce);
	}

	// Update velocity
	this.velocity.add(this.acceleration);

	// Apply velocity to position
	this.position.add(this.velocity);

	// Reset acceleration
	this.acceleration.zero();

	// Apply friction
	this.velocity.multiplyScalar(1 - 0.01);
};


Boid.prototype.update = function() {};
Boid.prototype.steer = function() {
	return new Victor(0,0);
};

MyBoid.prototype.steer = function(desired) {
	return desired.subtract(this.velocity);
};

Boid.prototype.postUpdate = function () {
	if (this.velocity.length() < 1e-3) {
		this.velocity.zero();
	} else {
		this.angle = this.velocity.angle();
	}
};
MyBoid.prototype.postUpdate = Boid.prototype.postUpdate;
Boid.prototype.render = function () {
	var sprite = this.graphics;
	sprite.x = this.position.x;
	sprite.y = this.position.y;
	sprite.rotation = this.angle;
	this.label.rotation = -this.angle;	
};

MyBoid.prototype.render = function () {
	var sprite = this.graphics;
	sprite.x = this.position.x;
	sprite.y = this.position.y;
	sprite.rotation = this.angle;
	this.label.rotation = -this.angle;
};

var boids = [];
boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
boids.push(new MyBoid(Math.random() * app.screen.width, Math.random() * app.screen.height));

var pad = 200;
var target = new Victor().randomize(new Victor(pad, pad), new Victor(app.screen.width-pad, app.screen.height-pad));
targetGraphics.x = target.x;
targetGraphics.y = target.y;

function getTarget() {
	return target;
}

function updateBoids() {
	boids.forEach(function (boid) {
		
		// Decide what to do
		boid.decision();

		// Move the boid
		boid.update();
		boid.postUpdate();

		// Wrap around the screen
		wrapAround(boid);

		// Render
		boid.render();

		while (torusDistance(target, boid.position) < 5) {
			var ang = 0;
			while( 2.7 < ang || ang < 0.01) {
				target = new Victor().randomize(new Victor(pad, pad), new Victor(app.screen.width-pad, app.screen.height-pad));
				ang = angleDiff(boid.velocity.angle(), angleBetween(boid.position, target));
			}
			
			targetGraphics.x = target.x;
			targetGraphics.y = target.y;
		}
	});
}

function normalize(v) {
	if (v.isZero()) {
		return v;
	} else {
		return v.normalize();
	}
}