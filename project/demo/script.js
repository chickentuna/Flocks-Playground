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
		return this.steer(average.normalize().multiplyScalar(weights.desiredSpeed));
	}
	return average;
};

// Cohesion
// For the average position (i.e. center) of all nearby boids, calculate steering vector towards that position
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

Boid.prototype.decision = function (environment) {
	this.flock(environment.boids);
};

for (var i = 0; i < 100; ++i) {
	boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
}