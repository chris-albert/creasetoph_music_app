(function() {
    
     C$.classify('Sound','',{
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
                C$.logger('on_update');
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

    C$.classify('SoundController','',{
        Sound: null,
        init: function() {
            var sound = C$.Class('Sound');
            this.Sound = new sound();
        }
    });

    C$.classify('PlaylistModel','',{
        repeat  : true,
        playlist: null,
        init: function(data) {
            this.playlist = {};
            this.playlist.tracks = [];
            this.playlist.current = 0;
            C$.foreach(data,function(i,v) {
                this.add_to_playlist(v);
            },this);
        },
        next: function() {
            	this.next_playlist();
            	return this;
        },
        prev: function() {
            	this.prev_playlist();
            	return this;
        },
        add_to_playlist: function(obj) {
            this.playlist.tracks.push(obj);
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

    C$.classify('PlaylistsModel','',{
        init: function() {
            this.playlists = {};
        },
        create_playlist: function(name,data) {
            var playlist = C$.Class('PlaylistModel');
            this.playlists[name] = new playlist(data)
        },
        add_to_playlist: function(name,data) {
            this.playlists[name].add_to_playlist(data);
        }
    });

    C$.classify('EventDelegator','',{
        callbacks: {},
        attach_event: function(event,callback) {
            if(typeof this.callbacks[event] === 'undefined') {
                this.callbacks[event] = [];
            }
            this.callbacks[event].push(callback);
            return this.callbacks[event].length - 1;

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
        selected_item: '',
        config: null,
        init: function(parent) {
            this._super(parent);
            var self = this;
            this.attach_event('onConfigFetch',function() {
                self.build_list();
            });
        },
        build_list: function(items) {
            var item = this.add_list_item(this.config_field.charAt(0).toUpperCase() + this.config_field.slice(1));
            item.add_list_items(items.sort());

        },
        add_list_item: function(name) {
            var item = C$.Class('SideBarItem');
            item = new item(this);
            $(this.element).appendChild(item.build(name));
            this.children.push(item);
            return item;
        },
        get_governor_config: function() {
            return this.MusicGovernor.get_config()[this.config_field];
        },
        set_explorer: function(data) {
            this.fire_event('on' + this.explorer + 'SetExplorer',this,data);
        }
    });

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
        },
        build_list: function() {
            this.config = this.get_governor_config();
            var items = C$.foreach(this.config,function(name) {
                    return name;
                });
            this._super(items);
        },
        set_explorer: function(name) {
            this.selected_item = name;
            this._super(this.get_governor_config()[name]);
        },
        get_current_list: function() {
            return this.config[this.selected_item];
        }
    });

    C$.classify('PlaylistSideBarController','SideBarController',{
        id: 'playlist_side_bar',
        explorer: 'PlaylistController',
        config_field: 'playlists',
        config: null,
        playlists_model: null,
        init: function(parent) {
            this._super(parent);
            var self = this,
                playlists_model = C$.Class('PlaylistsModel');
            this.playlists_model = new playlists_model();
            this.attach_event('onExplorerItemAddClicked',function(data) {
                self.onPlaylistAdd(data);
            });
        },
        build_list: function() {
            this.config = this.get_governor_config();
            this.config['Now Playing'] = [];
            var items = C$.foreach(this.config,function(name,value) {
                this.playlists_model.create_playlist(name,value);
                return name;
            },this);
            this._super(items);
        },
        set_explorer: function(name) {
            this.selected_item = name;
            this._super(this.config[name]);
        },
        onPlaylistAdd: function(data) {
            switch(data.selected_data.length) {
                case 1:
                    data = this.add_artist_to_playlist(data);
                    break;
                case 2:
                    data = this.add_album_to_playlist(data);
                    break;
                case 3:
                    data = [this.add_track_to_playlist(data)];
                    break;
                default:
                    break;
            }
            debugger;
            this.fire_event('onPlaylistAdd',this,data);
        },
        add_track_to_playlist: function(data) {
            return this.add_to_playlist({
                artist: data.selected_data[2],
                album: data.selected_data[1],
                track: data.selected_data[0]
            });
        },
        add_album_to_playlist: function(data) {
            var artist = data.selected_data[1],
                album = data.selected_data[0];
            return C$.foreach(data.library_data[artist][album],function(i,track) {
                return this.add_to_playlist({
                    artist: artist,
                    album: album,
                    track: track
                });
            },this);
        },
        add_artist_to_playlist: function(data) {
            var artist = data.selected_data[0],
                arr = [];
            C$.foreach(data.library_data[artist],function(album,tracks) {
                 arr = arr.concat(C$.foreach(tracks,function(i,track) {
                    return this.add_to_playlist({
                        artist: artist,
                        album: album,
                        track: track
                    });
                },this));
            },this);
            return arr;
        },
        add_to_playlist: function(data) {
            if(this.selected_item !== '') {
                this.config[this.selected_item].push(data);
                this.playlists_model.add_to_playlist(this.selected_item,data);
            }
            return data;
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
            this.fire_event('onExplorerItemPlayClicked',this,this.gather_data());
        },
        add_button_click: function(e) {
            this.fire_event('onExplorerItemAddClicked',this,this.gather_data());
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
        data: null,
        init: function(parent) {
            this._super(parent);
            this.data = null;
            var self = this;
            this.attach_event('on' + this.class_name + 'SetExplorer',function(data) {
                self.set_content(data);
            });
        },
        set_content: function(data) {
            this.clear_element();
            this.data = data;
            C$.foreach(data,function(name,val) {
                this.build_item(name,val);
            },this);
        },
        clear_element: function() {
            $(this.element).empty();
            this.children = [];
            this.data = null;
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
            var self = this;
            this.attach_event('onPlaylistAdd',function(data) {
                self.on_playlist_add(data);
            });
        },
        on_playlist_add: function(data) {
            C$.foreach(data,function(i,v) {
                this.build_item(this.children.length,v);
            },this);
        }
    });

    C$.ready(function() {
        var governor = C$.Class('MusicGovernor');
        governor = new governor()
        C$.add_object_to_ns('MusicGovernor',governor);
        governor.load_app();
    });
    
})();

