(function() {
    
     C$.inherit('SoundController','').prototype = {
        swf_location: '/flash/index/audio.swf',
        object_id   : 'CreasetophFlashObject',
        flash_id    : 'CreasetophFlashPlayer',
        flash_obj   : {},
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
                console.log('on_open');
            },
            on_complete: function() {
                console.log('on_complete');
            },
            on_end: function() {
                console.log('on_end');
                C$.find_object('PlaylistController').prototype.next_playlist();
            },
            on_id3: function(id3) {
                console.log(id3);
                console.log('on_id3');
            },
            on_play: function() {
                console.log('on_play');
            },
            on_pause: function(time) {
                console.log('Paused at: ' + time);
            },
            on_flash_load: function() {
                console.log('flash_loaded');
            },
            on_update: function(info) {
                C$.find_object('PlaylistController').prototype.update_player(info);
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
    };

    C$.inherit('PlaylistModel','').prototype = {
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
            this.Sound = C$.find_object('SoundController').prototype;
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
    };

    /**
     *
     */
    C$.inherit('MusicGovenor','').prototype = {
        SoundController: null,
        PlaylistModel: null,
        LibrarySideBarController: null,
        config_url: "http://musicwebserver/music/fetch",
        config: null,
        auto_init: true,
        callbacks: {
            onConfigFetch: []
        },
        init: function() {
            this.load_app();
        },
        load_app: function() {
            this.attach_children([
                'SoundController',
                'PlaylistModel',
                'LibrarySideBarController',
                'PlaylistSideBarController'
            ]);
            this.fetch_config();
        },
        attach_children: function(children) {
            var self = this;
            C$.foreach(children,function(k,v) {
                C$.do_inheritance(v);
                self[v] = C$.find_object(v).prototype;
                self[v].MusicGovenor = self;
                if(typeof self[v].init !== 'undfined') {
                    self[v].init();
                }
            });
        },
        attach_event: function(event,callback) {
            if(typeof this.callbacks[event] !== undefined) {
                this.callbacks[event].push(callback);
            }
        },
        fire_event: function(event) {
            C$.logger("Firing event: " + event);
            if(typeof this.callbacks[event] !== 'undefined') {
                C$.foreach(this.callbacks[event],function(index,func) {
                    func();
                });
            }
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
    };

    C$.inherit('SideBarController','').prototype = {
        children: [],
        element: null,
        init: function() {},
        add_list_item: function(name) {
            var item = C$.find_object('SideBarItem');
            item = new item();
            $(this.element).appendChild(item.build(name));
            this.children.push(item);
            return item;
        }
    };

    C$.inherit('SideBarItem','').prototype = {
        children: [],
        element: null,
        children_element: null,
        add_button: null,
        auto_init: true,
        init: function() {},
        children_hidden: false,
        build: function(name) {
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
            this.children_element = $('.side_bar_item_child',this.element);
            this.add_button = $('.small_add_button',this.element);
            return this.element;
        },
        add_list_item: function(name) {
            var item = C$.find_object('SideBarItem');
            item = new item();
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
            $('.explorer_text',this.element).event('click',function(e) {
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
                console.log("no children");
            }
        },
        show_children: function() {
            this.children_hidden = false;
            $(this.children_element).css({"display":"block"});
        },
        hide_children: function() {
            this.children_hidden = true;
            $(this.children_element).css({"display":"none"});
        },
        show_add_button: function() {
            //this.add_button.css({'display':'inline-block'});
        },
        set_root_el: function(el) {
            this.element = el;
        }
    };

    C$.inherit('LibrarySideBarController','SideBarController').prototype = {
        init: function() {
            this.element = $('#library_side_bar');
            var self = this;
            this.MusicGovenor.attach_event('onConfigFetch',function() {
                self.build_list();
            });
        },
        build_list: function() {
            var config = this.MusicGovenor.get_config(),
                self = this,
                item,items;
            if(typeof config.libraries !== "undefined") {
                item = this.add_list_item('Libraries');
                items = C$.foreach(config.libraries,function(name,value) {
                    return name;
                });
                item.add_list_items(items);
            }
        }
    };

    C$.inherit('PlaylistSideBarController','SideBarController').prototype = {
        init: function() {
            this.element = $('#playlist_side_bar');
            var self = this;
            this.MusicGovenor.attach_event('onConfigFetch',function() {
                self.build_list();
            });
        },
        build_list: function() {
            var config = this.MusicGovenor.get_config(),
                self = this,
                item,items;
            if(typeof config.playlists !== "undefined") {
                item = this.add_list_item('Playlists');
                items = C$.foreach(config.playlists,function(name,value) {
                    return name;
                });
                item.add_list_items(items);
            }
        }
    };

    C$.inherit('LibraryController','').prototype = {

    };
})();

