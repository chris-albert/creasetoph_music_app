(function() {
    C$.classify('Form','',{

    });

    C$.classify('FormElement','',{

    });

    C$.classify('TextBox','FormElement',{
        default_value: '',
        element: null,
        callback: null,
        init: function(name,value) {
            this.default_value = value;
            this.element = $().create('input').set_attribute({
                type: 'text',
                value: value,
                name: name
            });
            this.element.event('blur',function() {
                this.blur();
            },this);
            this.element.event('focus',function() {
                this.focus();
            },this);
            this.element.event('keyup',function(e) {
                this.key_up(e);
            },this);
        },
        focus: function() {
            if(this.element.value === this.default_value) {
                this.element.value = '';
            }
        },
        blur: function() {
            if(this.element.value === '') {
                this.element.value = this.default_value;
            }
        },
        key_up: function(e) {
            if(e.keyCode === 13) {
                if(this.callback !== null) {
                    this.callback(this.element.value);
                }
            }
        },
        get_el: function() {
            return this.element;
        },
        submit_callback: function(func) {
            this.callback = func;
        }
    });
})();