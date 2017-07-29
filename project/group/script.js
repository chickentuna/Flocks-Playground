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
	graphics.drawCircle(2*r/4, -r/3, r/4);
	graphics.drawCircle(2*r/4, r/3, r/4);
	graphics.endFill();

	graphics.beginFill(0x0, 1);
	graphics.drawCircle(2*r/4 + 1, -r/3, r/16);
	graphics.drawCircle(2*r/4 + 1, r/3, r/16);
	graphics.endFill();
}

Boid.prototype.decision = function (environment) {
	this.flock(environment.boids);
};

/**
 * Limit the vector to a certain length.
 */
function limitForce(vector) {
	if (vector.length() > getMaxForce()) {
		vector.normalize().multiplyScalar(getMaxForce());
	}
	return vector;
}

for (var i = 0; i < 100; ++i) {
	boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
}

