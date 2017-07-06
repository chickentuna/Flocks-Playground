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
    max: 0.5
}];

sliders.forEach(function (opt) {
    var label = opt.label || opt.key;
    var min = opt.min || 0;
    var id = opt.key + '-slider';
    var html = '<div style="display:flex;">' +
        '<input id="' + id + '" type="range" min="' + min + '" max="' + opt.max + '" step="0.1"> ' +
        label +
        '</div>';

    controls.append(html);

    $('#' + id).bind('input', function () {
        document.globals[opt.key] = +this.value;
    });
});

