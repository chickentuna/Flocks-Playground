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

var boidLayer = new PIXI.Container();
var targetLayer = new PIXI.Container();

var targetGraphics = new PIXI.Graphics();
targetGraphics.lineStyle(2, palette[4]);
targetGraphics.drawCircle(0,0,5);
targetGraphics.moveTo(0,-10);
targetGraphics.lineTo(0,+10);
targetGraphics.moveTo(-10, 0);
targetGraphics.lineTo(+10, 0);
targetLayer.addChild(targetGraphics);


app.stage.addChild(targetLayer);
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

function project(a,b) { 
	return (b.clone().normalize()).clone().multiplyScalar(( b.clone().normalize()).dot(a)); 
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

Boid.prototype.update2 = function (delta) {
	if (this.velocity.length() < 1e-3) {
		this.velocity.zero();
	} else {
		this.angle = this.velocity.angle();
	}
};
MyBoid.prototype.update2 = Boid.prototype.update2;
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
//for (var i = 0; i < 1; ++i) {
boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
boids.push(new MyBoid(Math.random() * app.screen.width, Math.random() * app.screen.height));
//}

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
var pad = 200;
var target = new Victor().randomize(new Victor(pad, pad), new Victor(app.screen.width-pad, app.screen.height-pad));
targetGraphics.x = target.x;
targetGraphics.y = target.y;

function updateBoids(delta) {
	boids.forEach(function (boid) {
		
		var desired = target.clone().subtract(boid.position);
		if (!desired.isZero()) {
			desired.normalize().multiplyScalar(6);
		}
		boid.acceleration = boid.steer(desired);

		// Move the boid
		boid.update(delta);
		boid.update2(delta);

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