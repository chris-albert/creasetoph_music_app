(function() {

    C$.classify('SideBarController','MusicAppElement',{
        selected_item: '',
        config: null,
        init: function(parent) {
            this._super(parent);
            this.attach_event('onConfigFetch',function() {
                this.build_list();
            },this);
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
        set_explorer: function(name,data) {
            this.fire_event('on' + this.explorer + 'SetExplorer',name,data);
        }
    });

    C$.classify('LibrarySideBarController','SideBarController',{
        id: 'library_side_bar',
        explorer: 'LibraryController',
        config_field: 'libraries',
        init: function(parent) {
            this._super(parent);
            this.attach_event('onConfigFetch', function(config) {
                this.set_explorer(config.library);
            },this);
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
            this._super(name,this.get_governor_config()[name]);
        },
        get_current_list: function() {
            return this.config[this.selected_item];
        }
    });

    C$.classify('PlaylistSideBarController','SideBarController',{
        id: 'playlist_side_bar',
        explorer: 'PlaylistController',
        config_field: 'playlists',
        playlists: null,
        init: function(parent) {
            this._super(parent);
            this.attach_event('onExplorerItemAddClicked',function(data) {
                this.on_playlist_add(data);
            },this);
            this.attach_event('onExplorerItemPlayClicked',function(data) {
                this.fire_event('onPlaylistClear',this.selected_item);
                this.set_explorer(this.selected_item);
                this.on_playlist_add(data);
                this.fire_event('onPlaylistPlay',0,this.selected_item);
            },this);
            this.attach_event('onPlaylistClear',function(name) {
                this.empty_playlist(name);
            },this);
            this.attach_event('onConfigFetch',function(config) {
                this.set_explorer(config.playlist);
            },this);
        },
        build_list: function() {
            this.playlists = this.get_governor_config();
            this.playlists['Now Playing'] = [];
            var items = C$.foreach(this.playlists,function(name,value) {
                return name;
            },this);
            this._super(items);
        },
        set_explorer: function(name) {
            this.selected_item = name;
            this._super(name,this.playlists[name]);
        },
        on_playlist_add: function(data) {
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
            this.fire_event('onPlaylistAdd',data,this.selected_item);
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
                this.playlists[this.selected_item].push(data);
            }
            return data;
        },
        remove_from_playlist: function(index) {
            if(this.selected_item !== '') {
                delete this.playlists[this.selected_item][index];
            }
        },
        empty_playlist: function(name) {
            if(typeof this.playlists[name] !== 'undefined') {
                this.playlists[name] = [];
            }
        }
    });
})();