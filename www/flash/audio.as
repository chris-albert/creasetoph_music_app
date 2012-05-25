package {

    import flash.display.MovieClip;
    import flash.text.TextField;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.net.URLRequest;
    import flash.events.*
    import flash.external.*;
    import flash.utils.*;

    public class MP3Player extends MovieClip {

        private 
        var sound        : Sound,
            sound_channel: SoundChannel,
            request      : URLRequest,
            output       : TextField,
            show_debug   : Boolean = true,
            debug_type   : String  = 'console',
            javascript_ns: String  = '',
            pause_time   : Number  = 0,
            timeout      : Number,
            interval     : Number  = 500,
            ID3_map:Object = {
                TPE1: 'artist',
                TSSE: 'encoding',
                TDRC: 'year',
                TALB: 'album',
                TPE2: 'artist_2',
                TCON: 'genre',
                TRCK: 'track_num',
                TLEN: 'length',
                TIT2: 'title'
            },
            //action script methods availiable in js
            javascript_callbacks:Object = {
                play             : 'play_sound',
                load             : 'load_sound',
                stop             : 'stop_sound',
                pause            : 'pause_sound',
                set_javascript_ns: 'set_javascript_ns',
                debug            : 'set_debug',
                id3              : 'get_id3',
                bytesLoaded      : 'get_bytes_loaded',
                bytesTotal       : 'get_bytes_total',
                isBuffering      : 'get_is_buffering',
                length           : 'get_length',
                url              : 'get_url',
                position         : 'get_position',
                leftPeak         : 'get_left_peak',
                rightPeak        : 'get_right_peak'
            },
            //js listeners
            javascript_listeners:Object = {
                open         : 'on_open',
                id3          : 'on_id3',
                complete     : 'on_complete',
                play         : 'on_play',
                stop         : 'on_stop',
                pause        : 'on_pause',
                soundComplete: 'on_end',
                loaded       : 'on_flash_load',
                update       : 'on_update'
            };

        public function MP3Player() {
            this.setup_output();
            this.add_javascript_callbacks();
            this.set_javascript_ns(this.loaderInfo.parameters.js_namespace);
            this.show_debug = this.loaderInfo.parameters.debug;
            this.debug(this.loaderInfo.parameters.debug);
            this.custom_event('loaded');
        }

        private function kill_sound() {
            this.sound = null
            this.sound_channel = null;
        }

        public function load_sound(url:String) {
            try {
                this.kill_sound();
                this.request = new URLRequest(url);
                this.sound = new Sound();
                this.sound.load(this.request);
                this.add_listeners();
            }catch(e:Error) {
                this.debug(e);
                this.debug('Error loading sound: ' + url);
            }
        }

        public function play_sound(millisecond_start:int = 0) {
            millisecond_start = millisecond_start == 0 ? this.pause_time : millisecond_start;
            this.pause_time = 0;
            this.sound_channel = this.sound.play(millisecond_start);
            this.sound_channel.addEventListener(Event.SOUND_COMPLETE,this.on_event,false,true);
            this.custom_event('play');
            this.set_update_timeout();
        }

        public function stop_sound() {
            this.sound_channel.stop();
            this.pause_time = 0;
            this.custom_event('stop');
        }

        public function pause_sound() {
            this.pause_time = this.sound_channel.position;
            this.debug('Pausing at: ' + this.pause_time);
            this.sound_channel.stop();
            this.custom_event('pause');
        }

        private function set_update_timeout() {
            var self:Object = this,
                func:Function = function() {
                    self.custom_event('update');
                }; 
            this.timeout = setInterval(func,this.interval);
        }

        private function add_javascript_callbacks() {
            this.debug('in add callbacks');
            for(var name:String in this.javascript_callbacks) {
                ExternalInterface.addCallback(name,this[this.javascript_callbacks[name]]);
            }
        }
        
        private function add_listeners() {
            this.sound.addEventListener(Event.COMPLETE       ,this.on_event,false,0,true);
            this.sound.addEventListener(Event.OPEN           ,this.on_event,false,0,true);
            this.sound.addEventListener(Event.ID3            ,this.on_event,false,0,true);
            this.sound.addEventListener(IOErrorEvent.IO_ERROR,this.on_event,false,0,true);
        }

        private function custom_event(type:String) {
            var event = new Event(type);
            this.on_event(event);
        }

        private function on_event(event:Event) {
            this.debug('Event: ' + event.type);
            var params:*;
            if(event.type in this.javascript_listeners) {
                switch(event.type) {
                    case 'id3':
                        params = this.sound.id3;
                        break;
                    case 'pause':
                        params = this.pause_time;
                        break;
                    case 'update':
                        params = {
                            position: this.get_position(),
                            duration: this.get_length()
                        };
                        break;
                    default:
                        params = '';
                }
                ExternalInterface.call(this.javascript_ns + '.' + this.javascript_listeners[event.type],params);
            }
        }

        public function get_id3() {
            return this.sound.id3;
        }

        public function get_bytes_loaded() {
            return this.sound.bytesLoaded;
        }

        public function get_bytes_total() {
            return this.sound.bytesTotal;
        }

        public function get_is_buffering() {
            return this.sound.isBuffering;
        }

        public function get_length() {
            return this.sound.length;
        }

        public function get_position() {
            return this.sound_channel.position;
        }

        public function get_url() {
            this.sound.url;
        }

        public function get_left_peak() {
            this.sound_channel.leftPeak;
        }

        public function get_right_peak() {
            this.sound_channel.rightPeak;
        }

        private function map_ID3(id3:Object) {
            var map:Object = {},
                i:String;
            for(i in id3) {
                if(this.ID3_map[i] != null) {
                    map[this.ID3_map[i]] = id3[i];
                }
            }
            return map;
        }

        public function set_javascript_ns(ns:String) {
            this.javascript_ns = ns;
        }

        private function trace_r(obj:*) {
            for(var key:String in obj) {
                trace(key + ": " + obj[key]);
            }
        }

        public function set_debug(value:Boolean) {
            this.show_debug = value;
        }

        public function debug(str) {
            if(this.show_debug) {
                this[this.debug_type](str);
            }
        }

        private function setup_output() {
            this.output = new TextField();
            this.output.width = 500;
            this.addChild(this.output);
        }

        public function screen(str:String) {
            this.output.text += str + "\n";
        }

        public function console(str:String) {
            ExternalInterface.call('console.log',str);
        }
    }
}

