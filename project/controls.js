var controls = $("#controls");

var sliders = [{
    key: 'separation',
    max: 10
}, {
    key: 'alignment',
    max: 10
}, {
    key: 'cohesion',
    max: 10
}, {
    key: 'speed',
    label: 'speed',
    min: 0.1,
    max: 10,
}];

// Weights
sliders.forEach(function (opt) {
    var label = opt.label || opt.key;
    var min = opt.min || 0;
    var id = opt.key + '-slider';
    var html = '<div style="display:flex;">' +
        '<input value="'+weights[opt.key]+'" id="' + id + '" type="range" min="' + min + '" max="' + opt.max + '" step="0.1"> ' +
        label +
        '</div>';

    controls.append(html);

    $('#' + id).bind('input', function () {
        weights[opt.key] = +this.value;
    });
});

// Individuals
var html = '<div style="display:flex;">' +
    '<input id="boids-slider" type="range" min="2" max="198" step="1" value="100"> ' + 
    'boids' +
    '</div>';
controls.append(html);

$('#boids-slider').bind('input', function() {
    var desired = this.value;
    var got = boids.length;
    
    if (got > desired) {
        var unwanted = boids.splice(desired);
        unwanted.forEach(function(b){
            boidLayer.removeChild(b.graphics);
        });
    } else if (got < desired) {
        for (var i = 0; i < desired - got; ++i) {
            boids.push(new Boid(Math.random() * app.screen.width, Math.random() * app.screen.height));
        }
    }
});
