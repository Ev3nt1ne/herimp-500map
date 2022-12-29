# herimp-500map
Mixxx: Hercules Impulse 500 mappings

## Descrition

Only the buttons/knobs that are coded, and depend on Mixxx are presented.
Others, such [Aux], [Mic], [Master], and [HeadPhones] are not described, since they are hardware feature that do not depend on Mixxx.

![Global View](https://github.com/Ev3nt1ne/herimp-500map/other/global.jpg?raw=true)

 - [Browse Enc]: Rotate to select from the Library (atm you need to be focused on Mixxx)
 	- [Shift]: To expand
 - [Browse Push]: Move Horizontally
 	- [Shift]: Maximize Library
 - [XFader]: CrossFader
 - [XFader Curve]: Crossfader Curve selection. From left: Linear(default), Steep(scratch), Disabled
 - [Mix Help]: Activate the BeatMatch Guide (fully implemented in Mappings by me). Default On
 - [Filter Fx 1, 2, 3]:
 	* Mode [FxDefault]: Toggle the relative effect in both Deck1 and Deck2
	* Mode [FxDeck x]: Toggle only the Fx effect on the relative deck
	LED On: both active, LED Off: both inactive, LED blinking: only one active
 	- [Shift]: Deactivate the relative effect in both Deck1 and Deck2
 - [Filter Fx 4]: Mode FxDeck1 (LED On), Mode FxDeck2 (LED blinking), Mode FxDefault (LED off)
 	- [Shift]: Mode FxDefault
 - [NRJ]: Toggle AutoDJ

![Deck View](https://github.com/Ev3nt1ne/herimp-500map/other/global.jpg?raw=true)

 - [Vinyl]: Toggle Scratch on wheel
 	- [Shift]: Toggle Slow Pause feature (fully implemented on mappings)
 - [Slip]: Slip Function
 	- [Shift]: /
 - [Quantize]: Toggle Quantize
 	- [Shift]: Toggle pitch Lock
 - [Load]: Load selected track
 	- [Double press]: Load the same track playing on the other deck, at the same point, and play it
 - [Gain]: Gain
 - [High]: High EQ
 - [Mid]: Mid EQ
 - [Low]: Low EQ
 - [Jog Touch]: Pause ("block") the track
 - [Jog Scratch]: Scratch
 	- [Shift]: Move around (Scratch) with x4 speed
 - [Jog]: Bend (adjust phase)
 - [Loop Push]: Toggle Loop. If inactive and "behind" it will jump to it
 	- [Shift]: Toggle a 4 bar loop
 - [Loop Enc]: Doubles/Halves loop duration
 - [In]: Select loop start
 	- [Shift]: go to loop start
	- [Long Press]: Move loop start with play cursor
 - [Out]: Select loop end and activate the loop
 	- [Shift]: go to loop end
	- [Long Press]: Move loop end with play cursor
 - [Sync]: Sync tempo with the other deck
 	- [Shift]: Sync Key with other deck
	- [Long Press]: Activate "linked tempo" feature
 - [Cue]: Cue
 	- [Shift]: jump to start of the song //TODO: move to S+Play?
 - [Play]: Play
 	- [Shift]: jump to Cue point //TODO: move to S+Cue?
 - [Mode 1]: Hotcue
 	- [Shift]: delete hotcue
 - [Mode 2]: Toggle Loop (1/8, 1/4, 1/2, 1, 2, 4, 8, 16)
 - [Mode 3]: Slicer (fully implemented in mappings, not perfectly working. You can create loops, but you cannot use [Slip] function)
 - [Mode 4]: Beat Jump (-1, +1, -2, +2, -4, +4, -8, +8). If a loop is active it will mode the loop
 	- [Shift]: Beat Jump (-16, +16, -32, +32, -64, +64). If a loop is active it will mode the loop
 - [Mode 5] (Shift + Mode 1):
 	* -1 tone pitch (pitch down -1)
		- [Shift]: Reset original key
	* -1 semitone pitch (pitch down -1/2)
		- [Shift]: Reset original key
	* +1 semitone pitch (pitch up + 1/2)
		- [Shift]: Reset original key
	* +1 tone pitch (pitch up +1)
		- [Shift]: Reset original key
	* spinback
	* decrease max tempo pitch slider (8, 32, 100)
	* increase max tempo pitch slider (8, 32, 100)
	* reverse (play back)
 - [Mode 6] (Shift + Mode 1): [Press and Hold] Loop Rolls (1/8, 1/4, 1/2, 1, 2, 4, 8, 16). It will create a loop of the relative dimension and activate the [Slip] function. On button release it will deactivate the loop and use the [Slip] to jump.
 - [Mode 8] (Shift + Mode 4): Play Sampler
 	- [Shift]: Cue Sampler (i.e. pause it) //TODO
 - [Pitch]: Tempo pitch
 - [Vol]: Volume
 - [Filter]:
 	* If no effect is active, [Filter Knob] will act as Filter
	* If at least one effect is active, [Filter Knob] will act as global (for all 3) effect Knob ([Super Knob])
	* In Mode FxDeck, [Filter Knob] of other decks will always act as Filters



### Whole Description on Fx effects:
At the moment, if no effect is active, [Filter Knob] will act as Filter, independently for each Deck.
If at least one effect is active, [Filter Knob] will act as global (for all 3) effect Knob ([Super Knob]).
In Mode FxDeck, [Filter Fx N] will only toggle the Fx effect on the relative deck. Even if there are Fx Effects active, [Filter Knobs] of other decks will only act as Filters.
