
var Model = {},
    View = {},
    Controller = {};

// ===================== Default user vars ============= //

Model.songDuration = 60,     // in seconds
Model.bpm = 123,              // beat per minute
Model.bpi = 16,               // beats per interval
Model.bpf = 4;                // beats per fraction

Model.notes = {};

// ======================= App ====================== //

$(document).ready(function() {

    Controller.element = $('body');

    View.$screenPlay = $('.screen-play');
    View.$screenConfig = $('.screen-config');

    View.$pista = $('.pista'),
    View.$intervalos = $('.intervalos'),
    View.$meta = $('.meta'),
    View.$metronomo = $('.metronomo'),
    View.$playBtn = $('.play-btn');
    View.$restartBtn = $('.restart-btn');
    View.$backBtn = $('.back-btn');

    View.$userData = $('form.song-config');
    View.$customNotesContainer = $('.custom-notes');
    View.$addBtn = $('.add-btn');
    View.$goBtn = $('.go-btn');

    View.$metronomo.on('animationend', function() {
        View.$metronomo.removeClass('boom');
    });

    View.$addBtn.click(addCustomNote);

    View.$goBtn.click(function() {
        var valid = validateForm();
        if (valid) {
            setAppValues();
            renderSong();
        }
    });

    View.$backBtn.click(function() {
        clearInterval(Controller.timeEngineBeats);
        clearInterval(Controller.timeEngineAnimation);
        shiftBack();
        renderConfig();
    });

    View.$restartBtn.click(function() {
        clearInterval(Controller.timeEngineBeats);
        clearInterval(Controller.timeEngineAnimation);
        $(this).fadeOut('fast');
        View.$playBtn.removeClass('shrink');
        View.$playBtn.fadeIn();
        View.$restartBtn.fadeOut();
        View.$metronomo.fadeOut();
        shiftBack();
    });

    View.$playBtn.click(function(){
        View.$playBtn.addClass('shrink');
        View.$playBtn.fadeOut();
        View.$restartBtn.fadeIn();
        View.$metronomo.fadeIn(500, function(){
            Controller.element.trigger('play:clicked');
        });
    });

    Controller.element.on('play:clicked', function(){

        var beatHeight = View.$intervalos.children()[0].offsetHeight / Model.bpi;
        var pxPerMove = beatHeight*Controller.resolution/Controller.timePerBeat;

        // Voices and Metronome
        Controller.timeEngineBeats = setInterval(function(){
            beep(.1);
            Controller.synth.speak(Controller.voice[Controller.indexVoice]);
            Controller.indexVoice = (Controller.indexVoice + 1) % Model.bpf;
            Controller.indexBeat++;
            View.$metronomo.addClass('boom');
            if (Controller.indexBeat == Controller.totalBeats + Model.bpi) {
                clearInterval(Controller.timeEngineBeats);
                clearInterval(Controller.timeEngineAnimation);
            }
        }, Controller.timePerBeat);

        // Animation
        setTimeout(function(){
            Controller.timeEngineAnimation = setInterval(function(){
                Controller.position += pxPerMove;
                View.$intervalos.css('transform', 'translate3d(0px, ' + Controller.position + 'px, 1px)');
            }, Controller.resolution);
        }, Controller.timePerBeat);

    });

    // Functions

    function validateForm() {
        var inputs = View.$userData.find('input');
        var notes = View.$customNotesContainer.find('input');

        for (var i=0; i<inputs.length; i++) {
            if (!$(inputs[i]).val()) {
                alert('Fields cannot be blank');
                return false;
            }
            else if (!$.isNumeric($(inputs[i]).val())) {
                alert('Values need to be numerical');
                return false;
            }
        }
        if ($(inputs[0]).val() < 10) {
            alert('That is a shitty song duration. Come on, try harder.');
            return false;
        }
        if ($(inputs[1]).val() < 10 || $(inputs[1]).val() > 200) {
            alert('That BPM is either a piece of shit or too fast for you my dear.');
            return false;
        }
        if ($(inputs[3]).val() < 1 || $(inputs[3]).val() > 5) {
            alert('I think you did not understand what I meant with "beats per fraction". Try again.');
            return false;
        }

        for (var i=0; i<notes.length; i++) {
            var val = $(notes[i]).val();
            if (val.length && ($(notes[i]).hasClass('custom-note-interval') && (!$.isNumeric(val) ||  val < 1 || val > Controller.totalIntervals) )) {
                alert('Note intervals need to be a number between 1 and the total number of intervals');
                return false;
            }
        }

        return true;
    };

    function prefillUserData() {
        $('.song-duration').val(Model.songDuration);
        $('.bpm').val(Model.bpm);
        $('.bpi').val(Model.bpi);
        $('select.bpf').val(Model.bpf);
    };

    function setAppValues() {

        var inputs = View.$userData.find('input');

        Model.songDuration = parseInt($(inputs[0]).val());
        Model.bpm = parseInt($(inputs[1]).val());
        Model.bpi = parseInt($(inputs[2]).val());
        Model.bpf = parseInt($('select.bpf').val());
        Model.notes = {};

        $('.custom-note').each(function(index, note){
            var text = $(note).find('.custom-note-text').val();
            var interval = $(note).find('.custom-note-interval').val();
            var color = $(note).find('.jscolor').val();

            if (!Model.notes[interval]) { Model.notes[interval] = [] }

            Model.notes[interval].push({
                'color': ('#' + color),
                'texto': text
            });
        });

        Controller.totalBeats = Math.floor(Model.songDuration*Model.bpm/60);
        Controller.totalIntervals = Math.ceil(Controller.totalBeats/Model.bpi);
        Controller.playingInterval = 0;
        Controller.indexVoice = 0;
        Controller.indexBeat = 0;
        Controller.position = 0;
        Controller.timePerBeat = Model.songDuration * 1000 / Controller.totalBeats;
        Controller.resolution = 30;

        Controller.synth = window.speechSynthesis;
        Controller.voice = [
            new SpeechSynthesisUtterance('one'),
            new SpeechSynthesisUtterance('two'),
            new SpeechSynthesisUtterance('three'),
            new SpeechSynthesisUtterance('four'),
        ];
        Controller.voice.forEach(function(voz){
        	voz.rate = Model.bpm/60;
        });
    };

    function addCustomNote() {
        var customNote = '<div class="custom-note"><input class="custom-note-text" placeholder="Note text"></input><input class="custom-note-interval" placeholder="Interval number"></input>';
        var input = document.createElement('input');
        input.classList.add('jscolor')
        var picker = new jscolor(input);
        picker.fromRGB(240, 230, 140);
        customNote = $(customNote).append(input);
        View.$customNotesContainer.append(customNote);
    };

    function shiftBack() {
        Controller.indexBeat = 0;
        Controller.indexVoice = 0;
        Controller.position = 0;
        View.$intervalos.css('transform', 'translate3d(0px, 0px, 1px)');
    };

    function renderConfig() {
        View.$screenPlay.fadeOut();
        View.$playBtn.removeClass('shrink');
        View.$playBtn.fadeIn();
        View.$restartBtn.fadeOut();
        View.$metronomo.fadeOut();
        View.$intervalos.empty();
        prefillUserData();

        View.$screenConfig.fadeIn();
    };

    function renderSong() {

        View.$screenConfig.fadeOut();

        var intervaloMarkup = '<div class="intervalo"></div>',
            notaMarkup = '<div class="nota"></div>',
            beatMarkup = '<div class="beat"></div>';

        // Crear intervalos

        for (var i = 0; i < Controller.totalIntervals; i++) {

            var intervaloElement = $(intervaloMarkup);
            intervaloElement.addClass('i' + i);
            intervaloElement.css('height', 25*Model.bpi+'px');
            View.$intervalos.append(intervaloElement);

            // Crear beats en los intervalos

            for (var j = 1; j < Model.bpi; j++) {
                var beatElement = $(beatMarkup);
                beatElement.css('bottom', j*100/Model.bpi + '%');
                $(View.$intervalos.children()[i]).append(beatElement);
            }

            // Crear notas en los intervalos

            if (Model.notes[Controller.totalIntervals - i]) {
                for (var j = 0; j < Model.notes[Controller.totalIntervals - i].length; j++) {
                    var notaElement = $(notaMarkup);
                    notaElement.css({
                        'background-color' : Model.notes[Controller.totalIntervals - i][j].color,
                        'bottom'           : 50 * j + 'px'
                    });
                    notaElement.html(Model.notes[Controller.totalIntervals - i][j].texto);
                    $(View.$intervalos.children()[i]).append(notaElement);
                }
            }

        }

        View.$intervalos.css('bottom', 100 + 25*Model.bpi + 'px');
        View.$screenPlay.fadeIn();

    };

    function beep(duration) {
        Controller.osc.start(Controller.ctx.currentTime); // InvalidStateError (DOM Exception 11): The object is in an invalid state
        Controller.osc.stop(Controller.ctx.currentTime + duration);
    };

    // ========= Calls on first init ============= //

    prefillUserData();

    // iOS Allow sound

    View.$goBtn.click(function(){

        Controller.ctx = null, usingWebAudio = true;

        try {
          if (typeof AudioContext !== 'undefined') {
              Controller.ctx = new AudioContext();
          } else if (typeof webkitAudioContext !== 'undefined') {
              Controller.ctx = new webkitAudioContext();
          } else {
              usingWebAudio = false;
          }
        } catch(e) {
            usingWebAudio = false;
        }

        // context state at this time is `undefined` in iOS8 Safari
        if (usingWebAudio && Controller.ctx.state === 'suspended') {
            Controller.ctx.resume();
        }

        Controller.osc = Controller.ctx.createOscillator();
        Controller.osc.connect(Controller.ctx.destination);

    });
});
