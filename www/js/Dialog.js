(function() {

    C$.classify('Dialog','',{
        view: null,
        mask: null,
        body: null,
        width: 200,
        height: 200,
        background_color: 'black',
        attach_to: null,
        center: true,
        content: null,
        init: function(properties) {
            this.attach_to = window.document.body;
            this.set_view();
            this.show_mask();
            this.create_body();
        },
        set_view: function() {
            this.view = {};
            this.view.x = window.innerWidth;
            this.view.y = window.innerHeight;
            this.view.y_total = $('body').offsetHeight;
            this.view.x_total = $('body').offsetWidth;
        },
        show_mask: function() {
            this.mask = $().create('div',{
                'width'     : this.view.x + 'px',
                'height'    : this.view.y + 'px',
                'position'  : 'absolute',
                'top'       : 0,
                'left'      : 0,
                'zIndex'    : 50,
                'opacity'   : 5,
                'backgroundColor': 'black'
            });
            $(this.attach_to).append(this.mask);
            this.mask.event('click',function() {
                this.close();
            },this);
        },
        close: function() {
            $(this.attach_to).remove(this.mask);
            $(this.attach_to).remove(this.body);
        },
        create_body: function() {
            this.body = $().create('div',{
//                width: this.width + 'px',
//                height: this.height + 'px',
                'position'  : 'absolute',
                'top'       : 0,
                'left'      : 0,
                'zIndex'    : 55,
                'backgroundColor': this.background_color
            });
            this.body.append(this.content);
            $(this.attach_to).append(this.body);
            if(this.center) {
                this.body.css({
                    top: ((this.view.y - this.height) / 2) + 'px',
                    left:((this.view.x - this.width) / 2) + 'px'
                });
            }
        }
    });

    C$.classify('DialogQuestion','Dialog',{
        text: null,
        init: function(properties) {
            this.text = C$.Class('TextBox');
            this.text = new this.text('playlist_name','Playlist Name');
            this.content = $().create('div').add_class('dialog-question').append(this.text.get_el());
            this._super(properties);
        },
        submit_callback: function(func) {
            var self = this;
            this.text.submit_callback(function(value) {
                self.close();
                func(value);
            });
        }
    });

})();