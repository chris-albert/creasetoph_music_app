(function() {
     C$.classify('Sound','EventDelegator',{
        swf_location: '/flash/index/audio.swf',
        object_id   : 'CreasetophFlashObject',
        flash_id    : 'CreasetophFlashPlayer',
        flash_obj   : null,
        init: function() {
            var movie_element = "",element;
            movie_element += '<object type="application/x-shockwave-flash" data="' + this.swf_location;
            movie_element += '" width="0" height="0" id="' + this.object_id + '">';
            movie_element += '  <param name="movie" value="' + this.swf_location + '" />';
            movie_element += '  <param name="FlashVars" value="js_namespace=window.creasetoph.objects.';
            movie_element += 'MusicGovernor.SoundController.Sound&debug=false" />';
            movie_element += '</object>';

            element = document.createElement("div");
            element.id = this.flash_id;
            element.innerHTML = movie_element;
            document.body.appendChild(element);
            this.flash_obj = document[this.object_id];
        },
        //This is used by the flash bridge to do callbacks
        on_open: function() {
            this.fire_event('onSoundOpen');
        },
        on_complete: function() {
            this.fire_event('onSoundComplete');
        },
        on_end: function() {
            this.fire_event('onSoundEnd');
        },
        on_id3: function(id3) {
            this.fire_event('onSoundId3');
        },
        on_play: function() {
            this.fire_event('onSoundPlay');
        },
        on_pause: function(time) {
            this.fire_event('onSoundPause');
        },
        on_flash_load: function() {
            this.fire_event('onFlashLoad');
        },
        on_update: function(info) {
            this.fire_event('onSoundUpdate',info);
        },
        //Used to control flash bridge
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
        },
        //Used to get info from flash bridge
        get_bytes_loaded: function() {
            return this.flash_obj.bytesLoaded();
        },
        get_bytes_total: function() {
            return this.flash_obj.bytesTotal();
        },
        get_length: function() {
            return this.flash_obj.length();
        },
        get_position: function() {
            return this.flash_obj.position();
        },
        get_left_peak: function() {
            return this.flash_obj.leftPeak();
        },
        get_right_peak: function() {
            return this.flash_obj.rightPeak();
        },
        get_is_buffering: function() {
            return this.flash_obj.isBuffering();
        }
    });

    C$.classify('EventDelegator','',{
        callbacks: {},
        attach_event: function(event,callback,scope) {
            if(typeof this.callbacks[event] === 'undefined') {
                this.callbacks[event] = [];
            }
            this.callbacks[event].push(function(a,b,c,d) {
                callback.call(scope,a,b,c,d);
            });
            return this.callbacks[event].length - 1;
        },
        attach_events: function(events,scope) {
            C$.foreach(events,function(event,callback) {
                this.attach_event(event,scope[callback],scope);
            },this);
        },
        fire_event: function(event,a,b,c,d) {
            C$.logger("Firing event: " + event);
            if(typeof this.callbacks[event] !== 'undefined') {
                C$.foreach(this.callbacks[event],function(index,func) {
                    func(a,b,c,d);
                });
            }
        }
    });

    C$.classify('SoundController','EventDelegator',{
        Sound: null,
        base_sound_url: "http://musicwebserver/music/stream",
        playing: false,
        paused: false,
        init: function(parent) {
            var sound = C$.Class('Sound');
            this.Sound = new sound();
            this.parent = parent;
            this.attach_event('onPlaylistChange',function(item) {
                this.play(item);
            },this);
            this.attach_event('onPlayClick',function() {
                if(this.playing) {
                    this.pause();
                }else if(this.paused) {
                    this.play();
                }
            },this);
            this.attach_event('onStop',function() {
                this.stop();
            },this);
        },
        play: function(item) {
            if(this.paused) {
                this.Sound.play();
                this.paused = false;
            }else {
                if(this.playing) {
                    this.stop();
                }
                if(item !== null) {
                    this.Sound.load(this.get_url(item));
                    this.Sound.play();
                }
            }
            this.fire_event('onPlay',item);
            this.playing = true;
        },
        pause: function() {
            if(this.playing) {
                this.Sound.pause();
                this.paused = true;
                this.playing = false;
            }
            this.fire_event('onPause');
        },
        stop: function() {
            if(this.playing) {
                this.Sound.stop();
                this.playing = false;
                this.paused = false;
            }
        },
        get_url: function(item) {
            return this.base_sound_url + "/" + item.artist + "/" + item.album + "/" + item.track;
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
        add_to_playlist: function(obj) {
            this.playlist.tracks.push(obj);
            return this;
        },
        remove_from_playlist: function(track) {
            this.playlist.tracks.splice(track,1);
        },
        clear_playlist: function() {
            this.playlist.tracks = [];
            this.playlist.current = 0;
            return this;
        },
        get_current_track: function() {
            return this.playlist.tracks[this.playlist.current];
        },
        set_current_track_index: function(index) {
            this.playlist.current = index;
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

    C$.classify('PlaylistsModel','EventDelegator',{
        current_playlist: null,
        repeat: true,
        init: function() {
            this.playlists = {};
            this.attach_events({
                onPlaylistAdd      : 'add_to_playlist',
                onPlaylistItemClick: 'on_play',
                onPlaylistPlay     : 'on_play',
                onNextClick        : 'on_next',
                onPrevClick        : 'on_prev',
                onSoundEnd         : 'on_next',
                onPlaylistItemMinusClick: 'remove_from_playlist',
                onPlaylistClear         : 'clear_playlist',
                onPlaylistCreate        : 'create_playlist'
            },this);
        },
        on_play: function(index,name) {
            var item;
            if(typeof this.playlists[name] !== 'undefined') {
                this.current_playlist = this.playlists[name];
                this.current_playlist.set_current_track_index(index);
                item = this.current_playlist.get_current_track();
                this.fire_event('onPlaylistChange',item);
            }
        },
        on_next: function() {
            if(this.current_playlist.playlist.current < this.current_playlist.playlist.tracks.length - 1) {
                this.current_playlist.playlist.current++;
                this.fire_event('onPlaylistChange',this.current_playlist.get_current_track());
            }else if(this.repeat) {
                this.current_playlist.playlist.current = 0;
                this.fire_event('onPlaylistChange',this.current_playlist.get_current_track());
            }
        },
        on_prev: function() {
            if(this.current_playlist.playlist.current > 0) {
                this.current_playlist.playlist.current--;
                this.fire_event('onPlaylistChange',this.current_playlist.get_current_track());
            }else if(this.repeat) {
                this.current_playlist.playlist.current = this.current_playlist.playlist.tracks.length - 1;
                this.fire_event('onPlaylistChange',this.current_playlist.get_current_track());
            }
        },
        create_playlist: function(name,data) {
            var playlist = C$.Class('PlaylistModel');
            this.playlists[name] = new playlist(data);
        },
        add_to_playlist: function(data,name) {
            if(typeof this.playlists[name] === 'undefined') {
                this.create_playlist(name,data);
            }else {
                C$.foreach(data,function(i,v) {
                    this.playlists[name].add_to_playlist(v);
                },this);
            }
        },
        remove_from_playlist: function(index,name) {
            if(typeof this.playlists[name] !== 'undefined') {
                this.playlists[name].remove_from_playlist(index);
            }
        },
        clear_playlist: function(name) {
            if(typeof this.playlists[name] !== 'undefined') {
                this.playlists[name].clear_playlist();
            }
        }
    });
    
    C$.classify('MusicGovernor','EventDelegator',{
        config_url: "http://musicwebserver/music/fetch",
        config: null,
        defaults: {
            playlist: 'awesome',
            library : 'creasetoph'
        },
        init: function() {},
        load_app: function() {
            this.attach_children([
                'SoundController',
                'PlaylistsModel',
                'LibrarySideBarController',
                'PlaylistSideBarController',
                'LibraryController',
                'PlaylistController',
                'PlayerController'
            ]);
            this.fetch_config();
            this.fire_event("onGovernorLoad");
        },
        attach_children: function(children) {
            C$.foreach(children,function(k,v) {
                var tmp = C$.Class(v);
                this[v] = new tmp(this);
            },this);
        },
        fetch_config: function() {
            C$.ajax(this.config_url,function(ret) {
                this.config = eval(ret);
                this.fire_event('onConfigFetch',this.defaults)
            },this);
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

    C$.classify('PlayerController','MusicAppElement',{
        id              : 'player',
        match_pattern   : new RegExp(/(^\d*|_|\.mp3$)/g),
        play_button     : null,
        play_triangle   : null,
        pause_rectangles: null,
        prev_button     : null,
        next_button     : null,
        artist          : null,
        album           : null,
        track           : null,
        seeker          : null,
        loaded_status   : null,
        init: function(parent) {
            this._super(parent);
            this.attach_events({
                onPlaylistChange: 'set_info',
                onPlay          : 'show_pause',
                onPause         : 'show_play',
                onSoundUpdate   : 'update_player'
            },this);
            this.attach_elements();
        },
        attach_elements: function() {
            this.play_button      = $('.large_play_button',this.element)[0];
            this.play_triangle    = $('.play_triangle',this.play_button)[0];
            this.pause_rectangles = $('.pause_rectangles',this.play_button)[0];
            this.prev_button      = $('.player_prev_button',this.element)[0];
            this.next_button      = $('.player_next_button',this.element)[0];
            this.artist           = $('.player_artist',this.element)[0];
            this.album            = $('.player_album',this.element)[0];
            this.track            = $('.player_track',this.element)[0];
            this.seeker           = $('.player_status_seeker',this.element)[0];
            this.loaded_status    = $('.player_status_bar_progress',this.element)[0];
            this.attach_element_events();
        },
        attach_element_events: function() {
            this.play_button.event('click',function() {
                this.on_play_click();
            },this);
            this.prev_button.event('click',function() {
                this.on_prev_click();
            },this);
            this.next_button.event('click',function() {
                this.on_next_click();
            },this);
            var slider = C$.Class('Slider');
            slider = new slider(this.seeker,function(){

            },'horizontal');
        },
        show_play: function() {
            this.pause_rectangles.css({display: 'none'});
            this.play_triangle.css({display: 'inline-block'});
        },
        show_pause: function() {
            this.play_triangle.css({display: 'none'});
            this.pause_rectangles.css({display: 'inline-block'});
        },
        on_next_click: function() {
            this.fire_event('onNextClick');
        },
        on_prev_click: function() {
            this.fire_event('onPrevClick');
        },
        on_play_click: function() {
            this.fire_event('onPlayClick');
        },
        set_info: function(item) {
            this.artist.set(this.format_name(item.artist));
            this.album.set(this.format_name(item.album));
            this.track.set(this.format_name(item.track));
        },
        update_player: function(info) {
            var percent_complete = info.position / info.duration,
                width = 302,
                left = Math.round(percent_complete * (width - 37)),
                loaded;
            this.seeker.css({
                'left': left + 'px'
            });
            if(info.bytesTotal >= info.bytesLoaded) {
                this.loaded_status.css({
                    width: Math.round((info.bytesLoaded / info.bytesTotal) * 100) + "%"
                });
            }
        },
        format_name:function(name) {
            var str = name.replace(this.match_pattern,' ');
            return C$.string.capitalize(C$.string.trim(str));
        }
    });

    C$.classify('ScrollBar','EventDelegator',{
        //elements
        root_el: null,
        scroll_bar_container: null,
        scroll_bar_slider: null,
        scroll_content_container: null,
        scroll_content: null,
        multiplier: 20,
        mouse_move_listener: null,
        mouse_up_listener: null,
        mouse_start_y: null,
        slider_height: null,
        slider_height_min: 30,
        //dimensions
        init: function(root_el,dimension_event) {
            this.root_el = root_el;
            this.attach_elements();
            this.attach_dimension_events(dimension_event);
        },
        attach_dimension_events: function(event) {
            this.attach_event(event,function() {
                this.get_dimensions();
            },this);
        },
        attach_elements: function() {
            this.scroll_bar_container = $('.scroll_bar_container',this.root_el)[0];
            this.scroll_bar_slider = $('.scroll_bar_slider',this.root_el)[0];
            this.scroll_content_container = $('.scroll_content_container',this.root_el)[0];
            this.scroll_content = $('.scroll_content',this.root_el)[0];
            this.scroll_content_container.event('DOMMouseScroll',function(e) {
                this.on_scroll(e);
            },this);
            this.scroll_content_container.event('mousewheel',function(e) {
                this.on_scroll(e);
            },this);
            this.scroll_bar_slider.event('mousedown',function(e) {
                this.slider_down(e);
            },this);
        },
        get_dimensions: function() {
            this.scroll_height = this.scroll_content.scrollHeight;
            this.height = this.scroll_content_container.clientHeight;
            var height = (this.height / this.scroll_height) * this.height;
            if(height < this.slider_height_min) {
                height = this.slider_height_min;
            }
            this.scroll_bar_slider.css({height: height + 'px'});
            this.slider_height = height;
        },
        on_scroll: function(e) {
            var normalized = e.detail ? -1 * e.detail : e.wheelDelta / 40,
                delta = normalized * this.multiplier;
            this.scroll(delta);
        },
        slider_down: function(e) {
            this.mouse_start_y = e.pageY;
            this.scroll_top_start = this.scroll_bar_slider.style.marginTop.replace('px','');
            if(this.scroll_top_start === '') {
                this.scroll_top_start = 0;
            }else {
                this.scroll_top_start = parseInt(this.scroll_top_start);
            }
            this.mouse_move_listener = $(window.document.body).event('mousemove',this.mouse_move,this);
            this.mouse_up_listener = $(window.document.body).event('mouseup',this.slider_up,this);
            e.preventDefault();
            return false;
        },
        slider_up: function(e) {
            this.mouse_start_y = null;
            this.scroll_top_start = null;
            $(window.document.body).remove_event('mousemove',this.mouse_move_listener);
            $(window.document.body).remove_event('mouseup',this.mouse_up_listener);
        },
        mouse_move: function(e) {
            var delta = this.mouse_start_y - e.pageY,
                top;
            top = (-1 * delta) + this.scroll_top_start;
            if(top < 0) {
                top = 0;
            }
            if(top > this.height - this.slider_height) {
                top = this.height - this.slider_height;
            }
            this.move_slider(top);
            var scroll_percent = top / (this.height - this.slider_height),
                scroll_diff = -1 * (this.scroll_height - this.height) * scroll_percent;
            this.move_content(scroll_diff);
            e.preventDefault();
            return false;
        },
        scroll: function(delta) {
            var current = this.scroll_content.style.marginTop.replace('px',''),
                diff,scroll_percent,scroll_diff;
            if(current === '') {
                current = 0;
            }else {
                current = parseInt(current);
            }
            diff = current + delta;
            if(diff > 0) {
                diff = 0;
            }
            if(diff < (-1*(this.scroll_height - this.height))) {
                diff = (-1*(this.scroll_height - this.height));
            }
            //move content
            this.move_content(diff);
            //move slider
            scroll_percent =(-1*diff) / (this.scroll_height - this.height);
            scroll_diff = (this.height - this.slider_height) * scroll_percent;
            this.move_slider(scroll_diff);
        },
        move_content: function(top) {
            this.scroll_content.css({
                marginTop: top + 'px'
            });
        },
        move_slider: function(top) {
            this.scroll_bar_slider.css({
                marginTop: top + 'px'
            });
        }
    });
    
    C$.ready(function() {
        var governor = C$.Class('MusicGovernor');
        governor = new governor();
        C$.add_object_to_ns('MusicGovernor',governor);
        governor.load_app();
    });
})();