(function() {
    
     C$.classify('SoundController','',{
        swf_location: '/flash/index/audio.swf',
        object_id   : 'CreasetophFlashObject',
        flash_id    : 'CreasetophFlashPlayer',
        flash_obj   : null,
        init: function() {
            var movie_element = "",element;
            movie_element += '<object type="application/x-shockwave-flash" data="' + this.swf_location + '" width="0" height="0" id="' + this.object_id + '">';
            movie_element += '  <param name="movie" value="' + this.swf_location + '" />';
            movie_element += '  <param name="FlashVars" value="js_namespace=window.creasetoph.SoundController.prototype.listeners&debug=false" />';
            movie_element += '</object>';

            element = document.createElement("div");
            element.id = this.flash_id;
            element.innerHTML = movie_element;
            document.body.appendChild(element);
            this.flash_obj = document[this.object_id];
        },
        /**
         * This is used by the flash bridge to do callbacks
         */
        listeners: {
            on_open: function() {
                C$.logger('on_open');
            },
            on_complete: function() {
                C$.logger('on_complete');
            },
            on_end: function() {
                C$.logger('on_end');
                C$.find_object('PlaylistController').prototype.next_playlist();
            },
            on_id3: function(id3) {
                C$.logger(id3);
                C$.logger('on_id3');
            },
            on_play: function() {
                C$.logger('on_play');
            },
            on_pause: function(time) {
                C$.logger('Paused at: ' + time);
            },
            on_flash_load: function() {
                C$.logger('flash_loaded');
            },
            on_update: function(info) {
               
            }
        },
        load: function(url) {
            this.flash_obj.load(url);
        },
        stop: function() {
            this.flash_obj.stop();
        },
        play: function() {
            this.flash_obj.play();
        },
        pause: function() {
            this.flash_obj.pause();
        }
    });


    C$.classify('PlaylistModel','',{
        Sound: {},
        playlist: {
            tracks : [],
            current: null
        },
        cache: [],
        playing: false,
        paused: false,
        repeat: true,
        init: function(e) {

        },
        onBind: function() {
            
        },
        play_pause: function(e) {
            if(this.playing) {
                this.pause();
            }else {
                this.play();
            }
            return this;
        },
        play: function() {
            var curr_track;
            if(this.paused) {
                this.Sound.play();
                this.paused = false;
            }else {
                curr_track = this.playlist.tracks[this.playlist.current];
                if(curr_track) {
                    this.Sound.load(creasetoph.CreasetophModel.prototype.base_url + ':1338/music/stream/' + curr_track.artist + '/' + curr_track.album + '/' + curr_track.track);
                    this.Sound.play();
                }
            }
            this.playing = true;
            this.set_play_pause();
            return this;
        },
        stop: function() {
            if(this.playing) {
            	this.Sound.stop();
            	this.playing = false;
            	this.paused = false;
            }
            this.set_play_pause();
            return this;
        },
        pause: function() {
            if(this.playing) {
                this.Sound.pause();
                this.paused = true;
                this.playing = false;
            }
            this.set_play_pause();
            return this;
        },
        next: function() {
            	this.next_playlist();
            	return this;
        },
        prev: function() {
            	this.prev_playlist();
            	return this;
        },
        add_to_playlist: function(artist,album,track) {
            this.playlist.tracks.push({
                'artist': artist,
                'album' : album,
                'track' : track
            });
            return this;
        },
        remove_from_playlist: function(track) {
            this.playlist.tracks.splice(track,1);
            if(track == this.playlist.current) {
                this.play();
            }
        },
        clear_playlist: function() {
            this.stop();
            this.playlist.tracks = [];
            this.playlist.current = 0;
            return this;
        },
        next_playlist: function() {
            this.stop();
            if(this.playlist.current < this.playlist.tracks.length - 1) {
                this.playlist.current++;
                this.play();
            }else if(this.repeat) {
                this.playlist.current = 0;
                this.play();
            }
            return this;
        },
        prev_playlist: function() {
            this.stop();
            if(this.playlist.current > 0) {
                this.playlist.current--;
                this.play();
            }else if(this.repeat) {
                this.playlist.current = this.playlist.tracks.length - 1;
                this.play();
            }
            return this;
        },
        get_current_track: function() {
            return this.playlist.tracks[this.playlist.current];
        },
        format_time: function(milliseconds) {
            var secs = Math.round(milliseconds / 1000),
                mins = Math.floor(secs / 60),time;
            secs = secs - (mins * 60);
            if(secs < 10) {
                secs = '0' + secs;
            }
            time = mins + ':' + secs;

            return time;
        }
    });

    C$.classify('EventDelegator','',{
        callbacks: {},
        attach_event: function(event,callback) {
            if(typeof this.callbacks[event] !== undefined) {
                this.callbacks[event].push(callback);
                return this.callbacks[event].length - 1;
            }
            return null;
        },
        fire_event: function(event,scope,a,b,c,d) {
            scope = scope || this;
            C$.logger("Firing event: " + event);
            if(typeof this.callbacks[event] !== 'undefined') {
                C$.foreach(this.callbacks[event],function(index,func) {
                    func.call(scope,a,b,c,d);
                });
            }
        }
    });

    C$.classify('MusicGovernor','EventDelegator',{
        config_url: "http://musicwebserver/music/fetch",
        config: null,
        init: function() {
            this.callbacks.onConfigFetch = []
        },
        load_app: function() {
            this.attach_children([
                'SoundController',
                'PlaylistModel',
                'LibrarySideBarController',
                'PlaylistSideBarController',
                'LibraryController',
                'PlaylistController'
            ]);
            this.fetch_config();
        },
        attach_children: function(children) {
            C$.foreach(children,function(k,v) {
                var tmp = C$.Class(v);
                this[v] = new tmp(this);
            },this);
        },
        fetch_config: function() {
            var self = this;
            C$.ajax(this.config_url,function(ret) {
                self.config = eval(ret);
                self.fire_event('onConfigFetch')
            });
        },
        get_config: function() {
            return this.config;
        }
    });

    C$.classify('MusicAppElement','EventDelegator',{
        element: null,
        parent: null,
        MusicGovernor: null,
        children: null,
        init: function(parent) {
            if(typeof parent !== 'undefined') {
                this.parent = parent;
            }
            this.children = [];
            this.MusicGovernor = C$.get_object('MusicGovernor');
            if(typeof this.id !== 'undefined') {
                this.element = $('#' + this.id);
            }
        }
    });

    C$.classify('SideBarController','MusicAppElement',{
        init: function(parent) {
            this._super(parent);
            this.callbacks['on' + this.explorer + 'SetExplorer'] = [];
        },
        build_list: function() {
            var config = this.MusicGovernor.get_config(),
                item,items;
            if(typeof config[this.config_field] !== "undefined") {
                item = this.add_list_item(this.config_field.charAt(0).toUpperCase() + this.config_field.slice(1));

                items = C$.foreach(config[this.config_field],function(name) {
                    return name;
                });
                if(typeof this.static_data !== 'undefined') {
                    C$.foreach(this.static_data,function(i,v) {
                        items.unshift(v);
                    });
                }
                item.add_list_items(items);
            }
        },
        add_list_item: function(name) {
            var item = C$.Class('SideBarItem');
            item = new item(this);
            $(this.element).appendChild(item.build(name));
            this.children.push(item);
            return item;
        },
        set_explorer: function(name) {
            var data = this.MusicGovernor.get_config()[this.config_field][name];
            this.fire_event('on' + this.explorer + 'SetExplorer',this,data);
        }
    });

    C$.classify('SideBarItem','MusicAppElement',{
        children_element: null,
        add_button: null,
        name: null,
        init: function(parent) {
            this._super(parent);
            this.callbacks.onSideBarItemSetExplorer = [];
            this.callbacks.onSideBarItemShow = [];
            this.callbacks.onSideBarItemHide = [];
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
            var self = this;
            $('.explorer_text',this.element)[0].event('click',function(e) {
                self.click(e);
            });
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
            this.fire_event('onSideBarItemSetExplorer',this,this.name);
            while(typeof obj.parent !== 'undefined') {
                if(obj.parent.parent_class === 'SideBarController') {
                    obj.parent.set_explorer(this.name);
                    break;
                }
                obj = obj.parent;
            } 
        },
        show_children: function() {
            this.children_hidden = false;
            $(this.children_element).css({"display":"block"});
            this.fire_event('onSideBarItemShow',this,this.name);
        },
        hide_children: function() {
            this.children_hidden = true;
            $(this.children_element).css({"display":"none"});
            this.fire_event('onSideBarItemHide',this,this.name);
        },
        show_add_button: function() {
            //this.add_button.css({'display':'inline-block'});
        },
        set_root_el: function(el) {
            this.element = el;
        }
    });

    C$.classify('LibrarySideBarController','SideBarController',{
        id: 'library_side_bar',
        explorer: 'LibraryController',
        config_field: 'libraries',
        init: function(parent) {
            this._super(parent);
            var self = this;
            this.MusicGovernor.attach_event('onConfigFetch',function() {
                self.build_list();
            });
        }
    });

    C$.classify('PlaylistSideBarController','SideBarController',{
        id: 'playlist_side_bar',
        explorer: 'PlaylistController',
        static_data: ['Now Playing'],
        config_field: 'playlists',
        init: function(parent) {
            this._super(parent);
            var self = this;
            this.MusicGovernor.attach_event('onConfigFetch',function() {
                self.build_list();
            });
        }
    });

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
            this.callbacks.onExplorerItemShow = [];
            this.callbacks.onExplorerItemHide = [];
        },
        build: function() {},
        build_header: function() {},
        attach_events: function() {
            var self = this;
            $('.explorer_text',this.element)[0].event('click',function(e) {
                self.click(e);
            });
        },  
        click: function() {
            if(this.has_children_data()) {
                if(this.children_hidden) {
                    this.show_children();
                }else {
                    this.hide_children();
                }
            }else {
                
            }
        },
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
            this.fire_event('onExplorerItemShow',this);
        },
        hide_children: function() {
            this.children_hidden = true;
            $(this.children_element).css({"display":"none"});
            this.fire_event('onExplorerItemHide',this);
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
            var str = name.replace(this.match_pattern,' ')
            return C$.string.capitalize(C$.string.trim(str));
        }
    });

    C$.classify('LibraryExplorerItem','ExplorerItem',{
        add_button: null,
        play_button: null,
        title_index: ['Albums','Tracks'],
        init: function(parent,children_data) {
            this._super(parent,children_data);
            this.callbacks.onExplorerItemAddClicked = [];
            this.callbacks.onExplorerItemPlayClicked = [];
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
             this.attach_events();
             this.children_element = $('.explorer_item_child',this.element)[0];
             return this.element;
        },
        build_header: function(title) {
            var html = '<div class="explorer_item_header">' +
                                    '<span class="explorer_text">' + title + '</span>' +
                       '</div>';
            return $().elify(html);
        },
        attach_events: function() {
            this._super();
            var self = this;
            $(this.add_button).event('click',function(e) {
                self.add_button_click(e);
            });
            $(this.play_button).event('click',function(e) {
                self.play_button_click(e);
            });
        },
        play_button_click: function(e) {
            this.fire_event('onExplorerItemPlayClicked',this);
        },
        add_button_click: function(e) {
            this.fire_event('onExplorerItemAddClicked',this);
        }
    });

    C$.classify('PlaylistExplorerItem','ExplorerItem',{
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
            return this.element;
        },
        format_name: function(data) {
            return [
                data.artist,
                data.album,
                this._super(data.track)
            ].join(' - ');
        }
    });

    C$.classify('ExplorerController','MusicAppElement',{
        init: function(parent) {
            this._super(parent);
            var self = this;
            this.attach_event('on' + this.class_name + 'SetExplorer',function(data) {
                self.set_content(data);
            });
        },
        set_content: function(data) {
            this.clear_element();
            C$.foreach(data,function(name,val) {
                this.build_item(name,val);
            },this);
        },
        clear_element: function() {
            $(this.element).empty();
        },
        build_item: function(name,data) {
            var item = C$.Class(this.explorer_item);
            item = new item(this,data);
            $(this.element).appendChild(item.build(name,data));
            this.children.push(item);
            return item;
        }
    });

    C$.classify('LibraryController','ExplorerController',{
        id: 'library_explorer',
        explorer_item: 'LibraryExplorerItem',
        init: function(parent) {
            this._super(parent);
        }
    });

    C$.classify('PlaylistController','ExplorerController',{
        id: 'playlist_explorer',
        explorer_item: 'PlaylistExplorerItem',
        init: function(parent) {
            this._super(parent);
        }
    });

    C$.ready(function() {
        var governor = C$.Class('MusicGovernor');
        governor = new governor()
        C$.add_object_to_ns('MusicGovernor',governor);
        governor.load_app();
    });
    
})();

