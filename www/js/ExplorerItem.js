(function() {
    C$.classify('ExplorerItem','MusicAppElement',{
        children_data: null,
        children_hidden: true,
        children_built: false,
        title_index: [],
        title: '',
        depth: 0,
        name: '',
        match_pattern: new RegExp(/(^\d*|_|\.mp3$)/g),
        init: function(parent,children_data) {
            this._super(parent);
            this.children_data = children_data;
        },
        build: function() {},
        build_header: function() {},
        attach_element_events: function() {
            $('.explorer_text',this.element)[0].event('click',function(e) {
                this.click(e);
            },this);
        },
        click: function(e) {
            if(this.has_children_data()) {
                if(this.children_hidden) {
                    this.show_children();
                }else {
                    this.hide_children();
                }
            }else {
                this.item_click();
            }
            this.fire_event(this.modified_event);
        },
        item_click: function() {},
        has_children: function() {
            return this.children.length !== 0;
        },
        has_children_data: function() {
            if(typeof this.children_data === 'undefined') {
                return false;
            }
            return this.children_data.length !== 0;
        },
        show_children: function() {
            this.children_hidden = false;
            $(this.children_element).css({"display":"block"});
            if(!this.children_built) {
                this.build_children();
            }
            this.fire_event('onExplorerItemShow');
        },
        hide_children: function() {
            this.children_hidden = true;
            $(this.children_element).css({"display":"none"});
            this.fire_event('onExplorerItemHide');
        },
        build_children: function() {
            this.children_built = true;
            var title = this.title_index[this.depth];
            if(title !== null) {
                $(this.children_element).appendChild(this.build_header(title));
            }
            C$.foreach(this.children_data,function(name,val) {
                if(this.depth < this.title_index.length - 1) {
                    this.build_item(name,val);
                }else {
                    this.build_item(val);
                }
            },this);
        },
        build_item: function(name,data) {
            var item = C$.Class(this.class_name);
            item = new item(this,data);
            item.depth = this.depth + 1;
            $(this.children_element).appendChild(item.build(name));
            this.children.push(item);
            return item;
        },
        format_name:function(name) {
            var str = name.replace(this.match_pattern,' ');
            return C$.string.capitalize(C$.string.trim(str));
        }
    });

    C$.classify('LibraryExplorerItem','ExplorerItem',{
        add_button: null,
        play_button: null,
        modified_event: 'onLibraryModify',
        title_index: ['Albums','Tracks'],
        init: function(parent,children_data) {
            this._super(parent,children_data);
        },
        build: function(name) {
            this.name = name;
            var html = '<div class="explorer_item">' +
                '<div class="music_button hbox">' +
                '<span class="explorer_text hbox box-flex">' + this.format_name(name) + '</span>' +
                '<div class="explorer_buttons hbox box-align-center">' +
                '<div class="small_play_button">' +
                '<div class="small_play_button_triangle"></div>' +
                '</div>' +
                '<div class="small_add_button">' +
                '<div class="small_add_vert"></div>' +
                '<div class="small_add_horiz"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="explorer_item_child" style="display:none;"></div>' +
                '</div>';
            this.element = $().elify(html);
            this.add_button = $('.small_add_button',this.element)[0];
            this.play_button = $('.small_play_button',this.element)[0];
            this.attach_element_events();
            this.children_element = $('.explorer_item_child',this.element)[0];
            return this.element;
        },
        build_header: function(title) {
            var html = '<div class="explorer_item_header">' +
                '<span class="explorer_text">' + title + '</span>' +
                '</div>';
            return $().elify(html);
        },
        attach_element_events: function() {
            this._super();
            $(this.add_button).event('click',function(e) {
                this.add_button_click(e);
            },this);
            $(this.play_button).event('click',function(e) {
                this.play_button_click(e);
            },this);
        },
        gather_data: function() {
            var data = [],
                obj = this;
            while(obj.class_name === 'LibraryExplorerItem') {
                data.push(obj.name);
                obj = obj.parent;
            }
            return {
                selected_data: data,
                library_data: obj.data
            };
        },
        play_button_click: function(e) {
            this.fire_event('onExplorerItemPlayClicked',this.gather_data());
        },
        add_button_click: function(e) {
            this.fire_event('onExplorerItemAddClicked',this.gather_data());
        }
    });

    C$.classify('PlaylistExplorerItem','ExplorerItem',{
        modified_event: 'onPlaylistModify',
        init: function(parent) {
            this._super(parent);
        },
        build: function(index,data) {
            this.name = index;
            var html = '<div class="explorer_item">' +
                '<div class="music_button hbox">' +
                '<span class="explorer_text hbox box-flex">' + this.format_name(data) + '</span>' +
                '<div class="explorer_buttons hbox box-align-center">' +
                '<div class="small_up_button">' +
                '<div class="small_up_button_triangle"></div>' +
                '</div>' +
                '<div class="small_down_button">' +
                '<div class="small_down_button_triangle"></div>' +
                '</div>' +
                '<div class="small_add_button">' +
                '<div class="small_add_horiz"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            this.element = $().elify(html);
            this.attach_element_events();
            return this.element;
        },
        attach_element_events: function() {
            this._super();
            $('.small_up_button',this.element)[0].event('click',function(e) {
                this.on_up_click(e);
            },this);
            $('.small_down_button',this.element)[0].event('click',function(e) {
                this.on_down_click(e);
            },this);
            $('.small_add_button',this.element)[0].event('click',function(e) {
                this.on_minus_click(e);
            },this);
        },
        on_up_click: function(e) {
            this.fire_event('onPlaylistItemUpClick',this.name,this.parent.name);
        },
        on_down_click: function(e) {
            this.fire_event('onPlaylistItemDownClick',this.name,this.parent.name);
        },
        on_minus_click: function(e) {
            var i = 0,
                el = this.element;
            while((el = el.previousSibling) != null) {
                i++;
            }
            this.fire_event('onPlaylistItemMinusClick',i,this.parent.name);
        },
        format_name: function(data) {
            return [
                data.artist,
                data.album,
                this._super(data.track)
            ].join(' - ');
        },
        item_click: function() {
            debugger;
            this.fire_event('onPlaylistItemClick',this.name,this.parent.name);
        }
    });
})();