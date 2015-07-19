# Vagrant Story Tools

This is an incomplete toolset for Vagrant Story (2000, Square),
written in JavaScript with Three.js.
It contains a partially working model viewer.
Everything is work in progress.

<img src="https://rawgit.com/morris/vstools/master/dragon.png">

(A prior version was written in Java, which can be found [here](https://github.com/morris/vstools-java).)

## Usage

[Run in browser](https://rawgit.com/morris/vstools/master/index.html)

Runs in browsers that supports WebGL, like Chrome or Firefox.
The viewer opens individual files obtained from a CD image
which have to be extracted first from your copy of Vagrant Story.

This code is developed for the US Version of Vagrant Story but should work with any.

## Supported file types

- WEP (weapons)
- SHP (characters, partially)
- SEQ (animations, 90%)
- ZUD (basically SHP + SEQ + WEP)
- ZND (zone data)
- MPD (map)
- ARM (minimap)

To open an MPD file, you'll need the correct ZND file.
You can find the Zone/Map list
[here](http://datacrystal.romhacking.net/wiki/Vagrant_Story:rooms_list).

## Motivation

Reverse engineering is ridiculously rewarding.
You get to know assembly, debuggers, system architecture, hacking live programs and much more.
Making sense of undocumented file formats is great, kind of archeological fun.

Vagrant Story itself is a unique piece of art,
featuring an outstanding character and level design that has no equal.

## Acknowledgments

Many thanks to Valendian and other people's tremendous work on analyzing Vagrant Story.

Most information on VS hacking can be found here:
http://datacrystal.romhacking.net/wiki/Vagrant_Story
