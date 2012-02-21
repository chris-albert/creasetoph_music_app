(function() {

    C$.classify('ExplorerController','MusicAppElement',{
        data: null,
        modified_event: '',
        init: function(parent) {
            this._super(parent);
            this.data = null;
            this.attach_event('on' + this.class_name + 'SetExplorer',function(name,data) {
                this.set_content(name,data);
            },this);
            var scroll_bar = C$.Class('ScrollBar');
            scroll_bar = new scroll_bar(this.element.parentNode.parentNode,this.modified_event);
        },
        set_content: function(name,data) {
            this.clear_element();
            this.name = name;
            this.data = data;
            C$.foreach(data,function(k,val) {
                this.build_item(k,val);
            },this);
            this.modified();
        },
        clear_element: function() {
            $(this.element).empty();
            this.children = [];
            this.data = null;
            this.name = null;
            this.modified();
        },
        build_item: function(name,data) {
            var item = C$.Class(this.explorer_item);
            item = new item(this,data);
            $(this.element).appendChild(item.build(name,data));
            this.children.push(item);
            return item;
        },
        remove_item: function(index) {
            if(typeof this.children[index] != 'undefined') {
                this.element.remove(this.children[index].element);
                this.children.splice(index,1);
            }
            this.modified();
        },
        modified: function() {
            this.fire_event(this.modified_event);
        }
    });

    C$.classify('LibraryController','ExplorerController',{
        id: 'library_explorer',
        modified_event: 'onLibraryModify',
        explorer_item: 'LibraryExplorerItem',
        init: function(parent) {
            this._super(parent);
        }
    });

    C$.classify('PlaylistController','ExplorerController',{
        id           : 'playlist_explorer',
        explorer_item: 'PlaylistExplorerItem',
        modified_event: 'onPlaylistModify',
        init: function(parent) {
            this._super(parent);
            this.attach_event('onPlaylistAdd',function(data) {
                this.on_playlist_add(data);
            },this);
            this.attach_event('onPlaylistItemMinusClick',function(index,playlist) {
                this.on_playlist_remove(index,playlist);
            },this);
            this.attach_event('onPlaylistClear',function() {
                this.clear();
            },this);
            this.attach_event('onAppInit',function(config) {
                this.set_content(config.playlist,{});
            },this);
        },
        on_playlist_add: function(data) {
            C$.foreach(data,function(i,v) {
                this.build_item(this.children.length,v);
            },this);
            this.modified();
        },
        on_playlist_remove: function(index) {
            this.remove_item(index);
        },
        clear: function() {
            this.clear_element();
            this.modified();
        }
    });
})();