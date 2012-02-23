(function() {

    C$.classify('Slider','',{
        element: null,
        move_callback: null,
        direction: null,
        slider_size: null,
        throw_size: null,
        mouse_start: null,
        init: function(el,move_func,direction) {
            this.element = el;
            this.move_callback = move_func;
            this.direction = direction;
            this.get_dimensions();
            this.attach_events();
        },
        get_dimensions: function() {
            if(this.direction === 'horizontal') {
                this.slider_size = this.element.clientWidth;
                this.throw_size = this.element.parentNode.clientWidth;
            }else{
                this.slider_size = this.element.clientHeight;
                this.throw_size = this.element.parentNode.clientHeight;
            }
        },
        attach_events: function() {
            this.element.event('DOMMouseScroll',function(e) {
                this.on_scroll(e);
            },this);
            this.element.event('mousewheel',function(e) {
                this.on_scroll(e);
            },this);
            this.element.event('mousedown',function(e) {
                this.slider_down(e);
            },this);
        },
        slider_down: function(e) {
            if(this.direction === 'horizontal') {
                this.mouse_start = e.pageX;
            }else {
                this.mouse_start = e.pageY;
            }
            this.mouse_move_listener = $(window.document.body).event('mousemove',this.mouse_move,this);
            this.mouse_up_listener = $(window.document.body).event('mouseup',this.slider_up,this);
            e.preventDefault();
            return false;
        },
        slider_up: function(e) {
            this.mouse_start = null;
            $(window.document.body).remove_event('mousemove',this.mouse_move_listener);
            $(window.document.body).remove_event('mouseup',this.mouse_up_listener);
        },
        on_scroll: function(e) {
            var normalized = e.detail ? -1 * e.detail : e.wheelDelta / 40,
                delta = normalized * this.multiplier;
            this.move(delta);
        },
        mouse_move: function(e) {
            var delta;
            if(this.direction === 'horizontal') {
                delta = -1 * (this.mouse_start - e.pageX);
            }else {
                delta = -1 * (this.mouse_start - e.pageY);
            }
            if(delta > (this.throw_size - this.slider_size)) {
                delta = this.throw_size - this.slider_size
            }
            if(delta < 0) {
                delta = 0;
            }
            this.move(delta);
        },
        move: function(delta) {
            this.move_slider(delta);
            this.move_callback(delta);
        },
        move_slider: function(delta) {
            this.element.css({
                left: delta + 'px'
            })
        }
    });
})();