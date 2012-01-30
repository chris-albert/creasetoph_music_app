<?php

class FlashController extends BaseController{

    private $flash_root = '/flash/';

    public function index() {
        $path  = getcwd() . urldecode($this->flash_root . $this->_registry->params[0]);
        $flash = file_get_contents($path);
        header('Last-Modified: ');
        header('ETag: ');
        header('Accept-Ranges: bytes');
        header('Content-Length: '.filesize($path));
        header('Connection: close');
        header('Content-Type: application/x-shockwave-flash');
        echo $flash;
    }
}
