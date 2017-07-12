Boid.prototype.steer = function(desired) {
	//TODO !
	return new Victor(0, 0);
};

function getFriction() {
	//TODO !
	return 0.5;
}

function getMaxForce() {
    //TODO !
	return 0;
}

Boid.prototype.update = function() {
	// Limit acceleration force (smaller values make for wider turns)
	limitForce(this.acceleration);

	// Update velocity
	this.velocity.add(this.acceleration);	

	// Apply velocity to position
	this.position.add(this.velocity);

	// Reset acceleration
	this.acceleration.zero();

	// Apply friction
	this.velocity.multiplyScalar(1 - getFriction());
};

function limitForce(vector) {
	var maxForce = getMaxForce();
	// Limit the vector to a certain length.
	if (vector.length() > maxForce) {
		vector.normalize().multiplyScalar(maxForce);
	}
	return vector;
}