
// DJControl_Inpulse_500_script.js
//
// ***************************************************************************
// * Mixxx mapping script file for the Hercules DJControl Inpulse 500.
// * Author: DJ Phatso, contributions by Kerrick Staley
// * Version 1.0c (Fall 2020)
// * Forum: https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-500/19739
// * Wiki: https://mixxx.org/wiki/doku.php/hercules_djcontrol_inpulse_500
//

//  Version 1.0c:
//	* Hot Cue: implementation of the Color API (Work in progress)
//		- Assigned color directly to pad (XML)
//	* Added DECK LED number - On when playing
//  * Moved Beatjump to Pad mode 3 (Slicer)
//	* Set different color for upper (Sampler 1-4) and lower (Sampler 5-8) sampler pads
//
//  Version 1.0 - Based upon Inpulse 300 v1.2 (official)
//
// TO DO: Functions that could be implemented to the script:
//
// * Hot Cue: implementation of the Color API (Work in progress)
// * Loop: Keep SLIP active (if already enabled) when exiting from rolls
// * FX/Filter:
//		- See how to preselect effects for a rack to use button FX1/2/3/4
// * Assing Crossfader curve for swtich
//
// ****************************************************************************
var DJCi500 = {};
///////////////////////////////////////////////////////////////
//                       USER OPTIONS                        //
///////////////////////////////////////////////////////////////

// How fast scratching is.
DJCi500.scratchScale = 1.0;

// How much faster seeking (shift+scratch) is than scratching.
DJCi500.scratchShiftMultiplier = 4;

// How fast bending is.
DJCi500.bendScale = 1.0;
// Other scratch related options
DJCi500.kScratchActionNone = 0;
DJCi500.kScratchActionScratch = 1;
DJCi500.kScratchActionSeek = 2;
DJCi500.kScratchActionBend = 3;
DJCi500.FxLedtimer;

//Ev3nt1ne Global Var:
DJCi500.FxD1Active = [0, 0, 0]; //Here I decided to put only 3 effects
DJCi500.FxD2Active = [0, 0, 0]; //Here I decided to put only 3 effects
DJCi500.FxDeckSel = 0; // state variable for fx4 to decide the deck
DJCi500.pitchRanges = [0.08, 0.32, 1]; //select pitch range
DJCi500.pitchRangesId = [0, 0]; //id of the array, one for each deck
DJCi500.slowPauseSetState = [0, 0];

DJCi500.vuMeterUpdateMaster = function(value, _group, _control) {
    value = (value * 122) + 5;
    midi.sendShortMsg(0xB0, 0x40, value);
    midi.sendShortMsg(0xB0, 0x41, value);
};

DJCi500.vuMeterUpdateDeck = function(value, group, _control, _status) {
	value = (value * 122) + 5;
	var status = (group === "[Channel1]") ? 0xB1 : 0xB2;
	midi.sendShortMsg(status, 0x40, value);
};

DJCi500.init = function() {
    // Scratch button state
    DJCi500.scratchButtonState = true;
    // Scratch Action
    DJCi500.scratchAction = {
    1: DJCi500.kScratchActionNone,
    2: DJCi500.kScratchActionNone
    };

	DJCi500.AutoHotcueColors = true;

    // Turn On Vinyl buttons LED(one for each deck).
    midi.sendShortMsg(0x91, 0x03, 0x7F);
    midi.sendShortMsg(0x92, 0x03, 0x7F);
	//Turn On Browser button LED
	midi.sendShortMsg(0x90, 0x05, 0x10);
	//Softtakeover for Pitch fader
    engine.softTakeover("[Channel1]", "rate", true);
    engine.softTakeover("[Channel2]", "rate", true);
    engine.softTakeoverIgnoreNextValue("[Channel1]", "rate");
    engine.softTakeoverIgnoreNextValue("[Channel2]", "rate");

	// Connect the VUMeters
    engine.connectControl("[Channel1]", "VuMeter", "DJCi500.vuMeterUpdateDeck");
	engine.getValue("[Channel1]", "VuMeter", "DJCi500.vuMeterUpdateDeck");
    engine.connectControl("[Channel2]", "VuMeter", "DJCi500.vuMeterUpdateDeck");
	engine.getValue("[Channel2]", "VuMeter", "DJCi500.vuMeterUpdateDeck");
    engine.connectControl("[Master]", "VuMeterL", "DJCi500.vuMeterUpdateMaster");
    engine.connectControl("[Master]", "VuMeterR", "DJCi500.vuMeterUpdateMaster");

	engine.getValue("[Master]", "VuMeterL", "DJCi500.vuMeterUpdateMaster");
    engine.getValue("[Master]", "VuMeterR", "DJCi500.vuMeterUpdateMaster");
	engine.getValue("[Controls]", "AutoHotcueColors", "DJCi500.AutoHotcueColors");

    //Ev3nt1ne Code
    var fx1D1Connection = engine.makeConnection('[EffectRack1_EffectUnit1_Effect1]', 'enabled', DJCi500.fx1D1Callback);
    var fx2D1Connection = engine.makeConnection('[EffectRack1_EffectUnit1_Effect2]', 'enabled', DJCi500.fx2D1Callback);
    var fx3D1Connection = engine.makeConnection('[EffectRack1_EffectUnit1_Effect3]', 'enabled', DJCi500.fx3D1Callback);
    var fx1D2Connection = engine.makeConnection('[EffectRack1_EffectUnit2_Effect1]', 'enabled', DJCi500.fx1D2Callback);
    var fx2D2Connection = engine.makeConnection('[EffectRack1_EffectUnit2_Effect2]', 'enabled', DJCi500.fx2D2Callback);
    var fx3D2Connection = engine.makeConnection('[EffectRack1_EffectUnit2_Effect3]', 'enabled', DJCi500.fx3D2Callback);
    //var fx4Connection = engine.makeConnection('[EffectRack1_EffectUnit1_Effect4]', 'enabled', DJCi500.fx4Callback);

	// Ask the controller to send all current knob/slider values over MIDI, which will update
    // the corresponding GUI controls in MIXXX.
    midi.sendShortMsg(0xB0, 0x7F, 0x7F);

    DJCi500.FxLedtimer = engine.beginTimer(250,"DJCi500.blinkFxLed()");
};


// The Vinyl button, used to enable or disable scratching on the jog wheels (One per deck).

DJCi500.vinylButton = function(_channel, _control, value, status, _group) {
    if (value) {
        if (DJCi500.scratchButtonState) {
            DJCi500.scratchButtonState = false;
            midi.sendShortMsg(status, 0x03, 0x00);

        } else {
            DJCi500.scratchButtonState = true;
            midi.sendShortMsg(status, 0x03, 0x7F);

        }
    }
};

DJCi500._scratchEnable = function(deck) {
    var alpha = 1.0/8;
    var beta = alpha/32;
    engine.scratchEnable(deck, 248, 33 + 1/3, alpha, beta);
};


DJCi500._convertWheelRotation = function (value) {
    // When you rotate the jogwheel, the controller always sends either 0x1
    // (clockwise) or 0x7F (counter clockwise). 0x1 should map to 1, 0x7F
    // should map to -1 (IOW it's 7-bit signed).
    return value < 0x40 ? 1 : -1;
};


// The touch action on the jog wheel's top surface
DJCi500.wheelTouch = function(channel, control, value, _status, _group) {
    var deck = channel;
    if (value > 0) {
        //  Touching the wheel.
        if (engine.getValue("[Channel" + deck + "]", "play") !== 1 || DJCi500.scratchButtonState) {
            DJCi500._scratchEnable(deck);
            DJCi500.scratchAction[deck] = DJCi500.kScratchActionScratch;
        } else {
            DJCi500.scratchAction[deck] = DJCi500.kScratchActionBend;
        }
    } else {
        // Released the wheel.
        engine.scratchDisable(deck);
        DJCi500.scratchAction[deck] = DJCi500.kScratchActionNone;
    }
};


// The touch action on the jog wheel's top surface while holding shift
DJCi500.wheelTouchShift = function(channel, control, value, _status, _group) {
    var deck = channel - 3;
    // We always enable scratching regardless of button state.
    if (value > 0) {
        DJCi500._scratchEnable(deck);
        DJCi500.scratchAction[deck] = DJCi500.kScratchActionSeek;

    } else {
        // Released the wheel.
        engine.scratchDisable(deck);
        DJCi500.scratchAction[deck] = DJCi500.kScratchActionNone;
    }
};


// Scratching on the jog wheel (rotating it while pressing the top surface)
DJCi500.scratchWheel = function(channel, control, value, status, _group) {
    var deck;
    switch (status) {
    case 0xB1:
    case 0xB4:
        deck  = 1;
        break;
    case 0xB2:
    case 0xB5:
        deck  = 2;
        break;
    default:
        return;
    }
    var interval = DJCi500._convertWheelRotation(value);
    var scratchAction = DJCi500.scratchAction[deck];

    if (scratchAction === DJCi500.kScratchActionScratch) {
        engine.scratchTick(deck, interval * DJCi500.scratchScale);
    } else if (scratchAction === DJCi500.kScratchActionSeek) {
        engine.scratchTick(deck,
            interval *  DJCi500.scratchScale *
            DJCi500.scratchShiftMultiplier);
    } else {
        engine.setValue(
            "[Channel" + deck + "]", "jog", interval * DJCi500.bendScale);
    }
};

// Bending on the jog wheel (rotating using the edge)
DJCi500.bendWheel = function(channel, control, value, _status, _group) {
    var interval = DJCi500._convertWheelRotation(value);
    engine.setValue(
        "[Channel" + channel + "]", "jog", interval * DJCi500.bendScale);
};
//Loop Encoder
DJCi500.loopHalveDouble = function (channel, control, value, status, group) {
    if (value > 64) {
        script.toggleControl(group, "loop_halve");
    } else {
        script.toggleControl(group, "loop_double");
    }
};

// Ev3nt1ne code
DJCi500.fx1D1Callback = function (value, group, control) {
    DJCi500.FxD1Active[0] = value;

    //LED
    if (DJCi500.FxD1Active[0] && DJCi500.FxD2Active[0])
    {
        midi.sendShortMsg(0x90, 0x14, 0x7F);
    }
    //XOR
    /*
    else if ((DJCi500.FxD1Active[0] && !DJCi500.FxD2Active[0]) || (!DJCi500.FxD1Active[0] && DJCi500.FxD2Active[0])) {
        if (!DJCi500.blinkingLed)
        {
            DJCi500.timer[0] = engine.beginTimer(250,"DJCi500.blinkFxLed()");
        }
        DJCi500.blinkingLed = DJCi500.blinkingLed + 1;
    }
    // both 0
    else {
    */
    else if (!DJCi500.FxD1Active[0] && !DJCi500.FxD2Active[0]){
        midi.sendShortMsg(0x90, 0x14, 0x0);
    }

};
DJCi500.fx2D1Callback = function (value, group, control) {
    DJCi500.FxD1Active[1] = value;

    //LED
    if (DJCi500.FxD1Active[1] && DJCi500.FxD2Active[1])
    {
        midi.sendShortMsg(0x90, 0x15, 0x7F);
    }
    else if (!DJCi500.FxD1Active[1] && !DJCi500.FxD2Active[1]){
        midi.sendShortMsg(0x90, 0x15, 0x0);
    }
};
DJCi500.fx3D1Callback = function (value, group, control) {
    DJCi500.FxD1Active[2] = value;

    //LED
    if (DJCi500.FxD1Active[2] && DJCi500.FxD2Active[2])
    {
        midi.sendShortMsg(0x90, 0x16, 0x7F);
    }
    else if (!DJCi500.FxD1Active[2] && !DJCi500.FxD2Active[2]){
        midi.sendShortMsg(0x90, 0x16, 0x0);
    }
};
DJCi500.fx1D2Callback = function (value, group, control) {
    DJCi500.FxD2Active[0] = value;

    //LED
    if (DJCi500.FxD1Active[0] && DJCi500.FxD2Active[0])
    {
        midi.sendShortMsg(0x90, 0x14, 0x7F);
    }
    else if (!DJCi500.FxD1Active[0] && !DJCi500.FxD2Active[0]){
        midi.sendShortMsg(0x90, 0x14, 0x0);
    }

};
DJCi500.fx2D2Callback = function (value, group, control) {
    DJCi500.FxD2Active[1] = value;

    //LED
    if (DJCi500.FxD1Active[1] && DJCi500.FxD2Active[1])
    {
        midi.sendShortMsg(0x90, 0x15, 0x7F);
    }
    else if (!DJCi500.FxD1Active[1] && !DJCi500.FxD2Active[1]){
        midi.sendShortMsg(0x90, 0x15, 0x0);
    }
};
DJCi500.fx3D2Callback = function (value, group, control) {
    DJCi500.FxD2Active[2] = value;

    //LED
    if (DJCi500.FxD1Active[2] && DJCi500.FxD2Active[2])
    {
        midi.sendShortMsg(0x90, 0x16, 0x7F);
    }
    else if (!DJCi500.FxD1Active[2] && !DJCi500.FxD2Active[2]){
        midi.sendShortMsg(0x90, 0x16, 0x0);
    }
};
DJCi500.fx4Callback = function (value, group, control) {
    //DJCi500.FxActive[0] = value;
};
DJCi500.filterKnob1 = function (channel, control, value, status, group) {
    var fx_active = (DJCi500.FxD1Active[0] || DJCi500.FxD1Active[1] || DJCi500.FxD1Active[2]);
    var deck_sel = (DJCi500.FxDeckSel == 0) || (DJCi500.FxDeckSel == 1);
    //engine.getValue(string group, string key);
    if (fx_active && deck_sel) {
        engine.setValue("[EffectRack1_EffectUnit1]", "mix", script.absoluteNonLin(value, 0.0, 0.5, 1.0, 0, 127));
    } else {
        engine.setValue("[QuickEffectRack1_[Channel1]]", "super1", script.absoluteNonLin(value, 0.0, 0.5, 1.0, 0, 127));
    }
};
DJCi500.filterKnob2 = function (channel, control, value, status, group) {
    var fx_active = (DJCi500.FxD2Active[0] || DJCi500.FxD2Active[1] || DJCi500.FxD2Active[2]);
    var deck_sel = (DJCi500.FxDeckSel == 0) || (DJCi500.FxDeckSel == 2);
    //engine.getValue(string group, string key);
    if (fx_active && deck_sel) {
        engine.setValue("[EffectRack1_EffectUnit2]", "mix", script.absoluteNonLin(value, 0.0, 0.5, 1.0, 0, 127));
    } else {
        engine.setValue("[QuickEffectRack1_[Channel2]]", "super1", script.absoluteNonLin(value, 0.0, 0.5, 1.0, 0, 127));
    }
};

DJCi500.Fx1Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        if (DJCi500.FxDeckSel == 0) {
            //XOR
            if ((DJCi500.FxD1Active[0] && !DJCi500.FxD2Active[0]) || (!DJCi500.FxD1Active[0] && DJCi500.FxD2Active[0])) {
                engine.setValue("[EffectRack1_EffectUnit1_Effect1]", "enabled", 1);
                engine.setValue("[EffectRack1_EffectUnit2_Effect1]", "enabled", 1);
            }
            else {
                script.toggleControl("[EffectRack1_EffectUnit1_Effect1]", "enabled");
                script.toggleControl("[EffectRack1_EffectUnit2_Effect1]", "enabled");
            }
        }
        else if (DJCi500.FxDeckSel == 1)
        {
            script.toggleControl("[EffectRack1_EffectUnit1_Effect1]", "enabled");
        }
        else if (DJCi500.FxDeckSel == 2)
        {
            script.toggleControl("[EffectRack1_EffectUnit2_Effect1]", "enabled");
        }
    }

};
DJCi500.Fx2Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        if (DJCi500.FxDeckSel == 0) {
            //XOR
            if ((DJCi500.FxD1Active[1] && !DJCi500.FxD2Active[1]) || (!DJCi500.FxD1Active[1] && DJCi500.FxD2Active[1])) {
                engine.setValue("[EffectRack1_EffectUnit1_Effect2]", "enabled", 1);
                engine.setValue("[EffectRack1_EffectUnit2_Effect2]", "enabled", 1);
            }
            else {
                script.toggleControl("[EffectRack1_EffectUnit1_Effect2]", "enabled");
                script.toggleControl("[EffectRack1_EffectUnit2_Effect2]", "enabled");
            }
        }
        else if (DJCi500.FxDeckSel == 1)
        {
            script.toggleControl("[EffectRack1_EffectUnit1_Effect2]", "enabled");
        }
        else if (DJCi500.FxDeckSel == 2)
        {
            script.toggleControl("[EffectRack1_EffectUnit2_Effect2]", "enabled");
        }
    }
};
DJCi500.Fx3Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        if (DJCi500.FxDeckSel == 0) {
            //XOR
            if ((DJCi500.FxD1Active[2] && !DJCi500.FxD2Active[2]) || (!DJCi500.FxD1Active[2] && DJCi500.FxD2Active[2])) {
                engine.setValue("[EffectRack1_EffectUnit1_Effect3]", "enabled", 1);
                engine.setValue("[EffectRack1_EffectUnit2_Effect3]", "enabled", 1);
            }
            else {
                script.toggleControl("[EffectRack1_EffectUnit1_Effect3]", "enabled");
                script.toggleControl("[EffectRack1_EffectUnit2_Effect3]", "enabled");
            }
        }
        else if (DJCi500.FxDeckSel == 1)
        {
            script.toggleControl("[EffectRack1_EffectUnit1_Effect3]", "enabled");
        }
        else if (DJCi500.FxDeckSel == 2)
        {
            script.toggleControl("[EffectRack1_EffectUnit2_Effect3]", "enabled");
        }
    }
};
////SHIFT
DJCi500.ShiftFx1Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        engine.setValue("[EffectRack1_EffectUnit1_Effect1]", "enabled", 0);
        engine.setValue("[EffectRack1_EffectUnit2_Effect1]", "enabled", 0);
    }
};
DJCi500.ShiftFx2Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        engine.setValue("[EffectRack1_EffectUnit1_Effect2]", "enabled", 0);
        engine.setValue("[EffectRack1_EffectUnit2_Effect2]", "enabled", 0);
    }
};
DJCi500.ShiftFx3Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        engine.setValue("[EffectRack1_EffectUnit1_Effect3]", "enabled", 0);
        engine.setValue("[EffectRack1_EffectUnit2_Effect3]", "enabled", 0);
    }
};
///Deck Select - FX4
DJCi500.Fx4Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        DJCi500.FxDeckSel = DJCi500.FxDeckSel + 1;
        if (DJCi500.FxDeckSel > 2)
        {
            DJCi500.FxDeckSel = 0;
        }

        //LED
        if (DJCi500.FxDeckSel == 0)
        {
            midi.sendShortMsg(0x90, 0x17, 0x0);
        }
        else if (DJCi500.FxDeckSel == 1){
            midi.sendShortMsg(0x90, 0x17, 0x7F);
        }
    }
};
DJCi500.ShiftFx4Key = function (channel, control, value, status, group) {

    if (value == 0x7F){
        DJCi500.FxDeckSel = 0;

        //LED
        midi.sendShortMsg(0x90, 0x17, 0x0);
    }
};
//Led
DJCi500.blinkFxLed = function () {

    DJCi500.blinkFxLedStatus = !DJCi500.blinkFxLedStatus;

    //FX1
    //XOR
    if ((DJCi500.FxD1Active[0] && !DJCi500.FxD2Active[0]) || (!DJCi500.FxD1Active[0] && DJCi500.FxD2Active[0])) {
        if (DJCi500.blinkFxLedStatus) {
            midi.sendShortMsg(0x90, 0x14, 0x7F);
        }
        else {
            midi.sendShortMsg(0x90, 0x14, 0x0);
        }
    }
    //FX2
    //XOR
    if ((DJCi500.FxD1Active[1] && !DJCi500.FxD2Active[1]) || (!DJCi500.FxD1Active[1] && DJCi500.FxD2Active[1])) {
        if (DJCi500.blinkFxLedStatus) {
            midi.sendShortMsg(0x90, 0x15, 0x7F);
        }
        else {
            midi.sendShortMsg(0x90, 0x15, 0x0);
        }
    }
    //FX3
    //XOR
    if ((DJCi500.FxD1Active[2] && !DJCi500.FxD2Active[2]) || (!DJCi500.FxD1Active[2] && DJCi500.FxD2Active[2])) {
        if (DJCi500.blinkFxLedStatus) {
            midi.sendShortMsg(0x90, 0x16, 0x7F);
        }
        else {
            midi.sendShortMsg(0x90, 0x16, 0x0);
        }
    }
    //FX4
    if (DJCi500.FxDeckSel == 2) {
        if (DJCi500.blinkFxLedStatus) {
            midi.sendShortMsg(0x90, 0x17, 0x7F);
        }
        else {
            midi.sendShortMsg(0x90, 0x17, 0x0);
        }
    }
};
///Pad 7
DJCi500.pitchUpTone = function (channel, control, value, status, group) {
    if (value == 0x7F){
        engine.setValue(group, "pitch_up", 1);
        engine.setValue(group, "pitch_up", 1);
    }
};
DJCi500.pitchDownTone = function (channel, control, value, status, group) {
    if (value == 0x7F){
        engine.setValue(group, "pitch_down", 1);
        engine.setValue(group, "pitch_down", 1);
    }
};

DJCi500.pitchSliderIncrease = function (channel, control, value, status, group) {

    if (value == 0x7F){
        var deck = 0;
        if (group == "[Channel1]") {
            deck = 0;
        }
        else if (group == "[Channel2]") {
            deck = 1;
        }

        DJCi500.pitchRangesId[deck] = DJCi500.pitchRangesId[deck] + 1;
        if (DJCi500.pitchRangesId[deck] > 2)
        {
            DJCi500.pitchRangesId[deck] = 2;
        }
        engine.setValue(group, "rateRange", DJCi500.pitchRanges[DJCi500.pitchRangesId[deck]]);
    }
};
DJCi500.pitchSliderDecrease = function (channel, control, value, status, group) {

    if (value == 0x7F){
        var deck = 0;
        if (group == "[Channel1]") {
            deck = 0;
        }
        else if (group == "[Channel2]") {
            deck = 1;
        }

        DJCi500.pitchRangesId[deck] = DJCi500.pitchRangesId[deck] - 1;
        if (DJCi500.pitchRangesId[deck] < 0)
        {
            DJCi500.pitchRangesId[deck] = 0;
        }
        engine.setValue(group, "rateRange", DJCi500.pitchRanges[DJCi500.pitchRangesId[deck]]);
    }
};
DJCi500.pitchSliderReset = function (channel, control, value, status, group) {
    if (value == 0x7F){
        var deck = 0;
        if (group == "[Channel1]") {
            deck = 0;
        }
        else if (group == "[Channel2]") {
            deck = 1;
        }
        DJCi500.pitchRangesId[deck] = 0;
        engine.setValue(group, "rateRange", DJCi500.pitchRanges[DJCi500.pitchRangesId[deck]]);
    }
};

DJCi500.play = function (channel, control, value, status, group) {

    if (value == 0x7F){
        if (engine.getValue(group, "play_indicator")){
            var deck = parseInt(group.substring(8, 9)) - 1;
            if (DJCi500.slowPauseSetState[deck]){
                engine.brake((deck+1),
                    1,//((status & 0xF0) !== 0x80 && value > 0),
                    54);
            }
            else {
                engine.setValue(group, "play", 0);
            }
        }
        else{
            engine.setValue(group, "play", 1);
        }
    }
};

DJCi500.slowPauseSet = function (channel, control, value, status, group) {

    if (value == 0x7F){
        var deck = parseInt(group.substring(8, 9)) - 1;
        DJCi500.slowPauseSetState[deck] = !DJCi500.slowPauseSetState[deck];
    }

};


/////

DJCi500.shutdown = function() {

    //cleanup
    engine.stopTimer(DJCi500.FxLedtimer);

	midi.sendShortMsg(0xB0, 0x7F, 0x7E);
};
