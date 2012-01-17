(function() {

    C$.classify('base','',{
        base_string: 'base string',
        base_array: ['1','2'],
        base_object: {
            a: 'b',
            c: 'd'
        },
        init: function(param) {
            C$.logger("in base init: " + param);
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
        init: function(param) {
            C$.logger("in child init: " + param);
            this.new_arr = ['f','3'];
            this._super(param);
        }
    });

    C$.ready(function() {
        var child = C$.Class('child');
        var obj = new child('asdf');
        (function() {
            debugger;
        })();
    });
})();