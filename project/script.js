var controls = $("#controls");

var sliders = [{
    key: 'separateWeight',
    label: 'separation',
    max: 10
}, {
    key: 'alignWeight',
    label: 'alignment',
    max: 10
}, {
    key: 'coheseWeight',
    label: 'cohesion',
    max: 10
}, {
    key: 'friction',
    max: 1
}];

sliders.forEach(function(opt) {
    var label = opt.label || opt.key;
    var min = opt.min || 0;
    var html = '<div style="display:flex;">' +
    '<input id="' + opt.key + '-slider" type="range" min="' + min + '" max="' + opt.max + '" step="0.1"> ' +
    label +
    '</div>';
    
    controls.append(html);
    
    
    $('#'+opt.key+'-slider').change(function(v) {
        var value = v.value;
        document.globals[opt.key] = value;
    });
    
});

