<?php 

class MusicController extends BaseController{

    //this should have a trailing slash
    private $music_root = '/media/data/Music/';
    //private $music_root = '//creasetoph/Music/';
    
    public function index() {

        if($this->User->isValid) {
            
    //        $this->loadSRC($this->_registry->request, array(
    //            '../www/js/music.js'
    //        ),'js');
            $this->loadSRC($this->_registry->request, array(
                '../www/css/music.css'
            ),'css');
            $path = '/media/data/Music/';

            $this->Template->info = $this->getDirStructure($this->music_root, '/\.mp3$/');
            $this->Template->music_json = json_encode($this->Template->info);

            $this->Template->render('music');
        }
        $this->Template->error_msg = "This is the music section of the site, you can come here to stream all of creasetophs music collection.";
        $this->Template->render('access_denied', 'Access Denied');
    }

    public function music_new() {
        $this->loadSRC($this->_registry->request, array(
            '../www/css/music_new.css'
        ),'css');
        //$this->loadSRC($this->_registry->request, array(
            //'../www/js/music_new.js'
        //),'js');
        $this->Template->info = $this->getDirStructure($this->music_root, '/\.mp3$/');
        $this->Template->music_json = json_encode($this->Template->info);
        $this->Template->render('music_new');
    }

    public function fetch() {
        echo json_encode(array(
            'libraries' => array(
                'mine' => $this->getDirStructure($this->music_root, '/\.mp3$/'),
                'other_library' => $this->getDirStructure($this->music_root, '/\.mp3$/'),
             ),
            'playlists' => array(
                'great' => array(
                    array(
                        'artist' => 'The Beatles',
                        'album' => 'The White Album',
                        'track' => 'Dear Prudence'
                    ),
                    array(
                        'artist' => 'The Beatles',
                        'album' => 'The White Album',
                        'track' => 'Obla Dee Obla Da'
                    )
                ),
                'awesome' => ''
            )
        ));
    }

    public function stream() {
        $path = urldecode($this->music_root . $this->_registry->params[0] . '/' . $this->_registry->params[1] . '/' . $this->_registry->params[2]);

        if(file_exists($path)) {
	        $song = file_get_contents($path);
	        header('Last-Modified: ');
	        header('ETag: ');
	        header('Accept-Ranges: bytes');
	        header('Content-Length: '.filesize($path));
	        header('Connection: close');
	        header('Content-Type: audio/mpeg');
	        echo $song;
        }
    }

    private function getDirInfo($path) {
        $info = array();
        if(is_dir($path)) {
            if($dh = opendir($path)) {
                while(($file = readdir($dh)) !== false) {
                    if($file != '.' && $file != '..') {
                        $type = filetype($path.$file);
                        if($type === 'dir') {
                            $info[$file] = $this->getDirInfo($path.$file.'/');
                        }else if(strpos($file,'.mp3')) {
                            $info[] = $file;
                        }
                    }
                }
            }
        }
        if($type === 'dir') {
            ksort($info);
        }else {
            sort($info);
        }
        return $info;
    }
}
