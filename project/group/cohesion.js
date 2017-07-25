Boid.prototype.cohesion = function (boids) {
	var average = new Victor(0, 0);

	// Get the average position of all nearby boids.
	for (var i = 0, l = boids.length; i < l; ++i) {
		var other = boids[i];
		average.add(other.position);
	}

	if (boids.length > 0) {
		// The average is the the sum of vectors divided by the number of flockmates
		var destination = average.divideScalar(boids.length);
		
		// We calculate the vector from this boid to the destination point
		var desired = destination.subtract(this.position);
		
		// We want our desired velocity to be of the length of our desired speed, or zero.
		if (desired.length() > 0) {
			desired.normalize().multiplyScalar(weights.desiredSpeed);
		}
		
		// We then calculate the steering force needed to get to that desired velocity
		return this.steer(desired);
	}
	return average;
};
