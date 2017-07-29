/** 
 * The boid must react to the environment
 **/
Boid.prototype.decision = function (environment) {
	// Select only the neighbouring boids
	var boids = environment.boids.filter(withinRangeOf(this));

	// Perform flocking
	this.flock(boids);
};

/** 
 * Calculate the acceleration of the boid
 * using the 3 rules of flocking
 **/
Boid.prototype.flock = function (boids) {
	// Calculate flocking forces
	var sep = this.separation(boids);
	var ali = this.alignment(boids);
	var coh = this.cohesion(boids);

    // Apply weights to forces	
	sep.multiplyScalar(getWeights().separation);
	ali.multiplyScalar(getWeights().alignment);
	coh.multiplyScalar(getWeights().cohesion);

	// Calculate acceleration
	this.acceleration.add(sep).add(ali).add(coh);
	limitForce(this.acceleration);
};

/** 
 * A filter for boids that aren't close enough.
 **/
function withinRangeOf(boid) {	
	return function(other) {
		return boid.position.distance(other.position) <= getBoidViewDistance();
	};
}