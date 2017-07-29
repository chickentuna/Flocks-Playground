Boid.prototype.separation = function (boids) {
	// Choose a distance at which boids start avoiding each other
	var desiredSeparation = getBoidViewDistance() / 2;

	var desired = new Victor(0, 0);

	// For every flockmate, check if it's too close
	for (var i = 0, l = boids.length; i < l; ++i) {
		var other = boids[i];
		var dist = this.position.distance(other.position);
		if (dist < desiredSeparation && dist > 0) {
			// Calculate vector pointing away from the flockmate, weighted by distance
			var diff = this.position.clone().subtract(other.position).normalize().divideScalar(dist);
			desired.add(diff);
		}
	}
	
	// If the boid had flockmates to separate from
	if (desired.length() > 0) {
		// We set the average vector to the length of our desired speed
		desired.normalize().multiplyScalar(getDesiredSpeed());

		// We then calculate the steering force needed to get to that desired velocity
		return this.steer(desired);
	}

	return desired;
};