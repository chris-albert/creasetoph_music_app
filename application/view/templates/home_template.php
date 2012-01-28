<!-- Start of the home template -->
<div class="fullscreen">
    <div class="music_container vbox box-pack-start">
        <div class="status_bar box"></div>
        <div class="controlls_container box">
            <div class="player_container" id="player">
                <div class="player_top">
                    <div class="large_play_button music_button">
                        <div class="play_triangle"></div>
                    </div>
                    <div class="player_playing_container">
                        <ul class="player_playing_title_container">
                            <li class="player_playing_title">Artist:</li>
                            <li class="player_playing_title">Album:</li>
                            <li class="player_playing_title">Track:</li>
                        </ul>
                        <ul class="player_playing_content_container">
                            <li class="player_playing_content player_artist">The Beatles</li>
                            <li class="player_playing_content player_album">The White Album</li>
                            <li class="player_playing_content player_track">Dear Prudence</li>
                        </ul>
                    </div>
                </div>
                <div class="player_bottom">
                    <div class="player_prev_button music_button">
                        <div class="player_prev_triangle_left"></div>
                        <div class="player_prev_triangle_right"></div>
                    </div>
                    <div class="player_status_container">
                        <div class="player_status_bar">
                            <div class="player_status_bar_progress"></div>
                        </div>
                        <div class="player_status_seeker music_button"></div>
                    </div>
                    <div class="player_next_button music_button">
                        <div class="player_next_triangle_left"></div>
                        <div class="player_next_triangle_right"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="explorer_container hbox box-flex-1">
            <div class="explorer_left_container hbox box-flex-1">
                <div class="explorer_side_bar_container vbox">
                    <div class="status_bar status_bar_left"></div>
                    <div class="explorer_side_bar box-flex" id="library_side_bar"></div>
                </div>
                <div class="explorer_content_container box-flex-1 vbox">
                    <div class="status_bar status_bar_center"></div>
                    <div class="explorer_content box-flex" id="library_explorer"></div>
                </div>
            </div>
            <div class="explorer_right_container hbox box-flex-1">
                <div class="explorer_content_container  box-flex-1 vbox">
                    <div class="status_bar status_bar_center"></div>
                    <div class="explorer_content box-flex" id="playlist_explorer"></div>
                </div>
                <div class="explorer_side_bar_container vbox">
                    <div class="status_bar status_bar_right"></div>
                    <div class="explorer_side_bar box-flex"  id="playlist_side_bar"></div>
                </div>
            </div>
        </div>
    </div>
</div>