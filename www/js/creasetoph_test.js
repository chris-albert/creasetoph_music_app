(function() {

    C$.classify('base','',{
        base_string: 'base string',
        base_array: ['1','2'],
        base_object: {
            a: 'b',
            c: 'd'
        },
        init: function() {
            C$.logger("in base init");
        },
        base_only_func: function() {

        }
    });

    C$.classify('child','base',{
        child_string: 'child string',
        child_array: ['3','4'],
        child_object: {
            e: 'f',
            g: 'h'
        },
        init: function() {
            C$.logger("in child init");
            _super();
        }
    });

    C$.inherit('child');
})();