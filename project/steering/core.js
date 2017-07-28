var DESIRED_SPEED = 6;

// The boid takes a decision each step (selects an acceleration)
Boid.prototype.decision = function() {
	// Find a vector pointing towards the given target
	var desired = getTarget().clone().subtract(this.position);
	
	// Set the length of the vector to 6.
	if (!desired.isZero()) {
		desired.normalize().multiplyScalar(DESIRED_SPEED);
	}

	// Get the force needed to get from the current velocity
	// to the desired one
	var steeringForce = this.steer(desired);

	// Limit it to our boid's max acceleration
	// (smaller values make for wider turns)
	this.acceleration = limitForce(steeringForce);
};

// This is how the boid is updated each step
Boid.prototype.update = function() {
	// Update velocity
	this.velocity.add(this.acceleration);	

	// Apply friction
	this.velocity.multiplyScalar(1 - getFriction());

	// Apply velocity to position
	this.position.add(this.velocity);

	// Reset acceleration
	this.acceleration.zero();
};

function limitForce(vector) {
	var maxForce = getMaxForce();
	// Limit the vector to a certain length.
	if (vector.length() > maxForce) {
		vector.normalize().multiplyScalar(maxForce);
	}
	return vector;
}