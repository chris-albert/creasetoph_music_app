(function() {
    C$.classify('SideBarItem','MusicAppElement',{
        children_element: null,
        add_button: null,
        name: null,
        init: function(parent) {
            this._super(parent);
        },
        children_hidden: false,
        build: function(name) {
            this.name = name;
            var html =  '<div class="side_bar_item">' +
                '<div class="music_button hbox">' +
                '<div class="explorer_buttons hbox box-align-center">' +
                '<div class="small_add_button" style="display:none;">' +
                '<div class="small_add_vert"></div>' +
                '<div class="small_add_horiz"></div>' +
                '</div>' +
                '</div>' +
                '<span class="explorer_text hbox box-flex">' + name + '</span>' +
                '</div>' +
                '<div class="side_bar_item_child"></div>' +
                '</div>';
            this.element = $().elify(html);
            this.attach_events();
            this.children_element = $('.side_bar_item_child',this.element)[0];
            this.add_button = $('.small_add_button',this.element)[0];
            return this.element;
        },
        add_list_item: function(name) {
            var item = C$.Class('SideBarItem');
            item = new item(this);
            $(this.children_element).append(item.build(name));
            this.children.push(item);
            return item;
        },
        add_list_items: function(names) {
            this.show_add_button();
            C$.foreach(names,function(i,name) {
                this.add_list_item(name);
            },this);
        },
        attach_events: function() {
            $('.explorer_text',this.element)[0].event('click',function(e) {
                this.click(e);
            },this);
        },
        has_children: function() {
            return this.children.length !== 0;
        },
        click: function(e) {
            if(this.has_children()) {
                if(this.children_hidden) {
                    this.show_children();
                }else {
                    this.hide_children();
                }
            }else {
                this.set_explorer();
            }
        },
        set_explorer: function() {
            var obj = this;
            this.fire_event('onSideBarItemSetExplorer',this.name);
            while(typeof obj.parent !== 'undefined') {
                if(obj.parent.parent_class === 'SideBarController') {
                    var name = this.name;
                    if(typeof this.name_func === 'function') {
                        name = this.name_func();
                    }
                    obj.parent.set_explorer(name);
                    break;
                }
                obj = obj.parent;
            }
        },
        show_children: function() {
            this.children_hidden = false;
            $(this.children_element).css({"display":"block"});
            this.fire_event('onSideBarItemShow',this.name);
        },
        hide_children: function() {
            this.children_hidden = true;
            $(this.children_element).css({"display":"none"});
            this.fire_event('onSideBarItemHide',this.name);
        },
        show_add_button: function() {
            //this.add_button.css({'display':'inline-block'});
        },
        set_root_el: function(el) {
            this.element = el;
        }
    });

})();