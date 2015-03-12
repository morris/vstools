# Vagrant Story Tools

This is an incomplete toolset for Vagrant Story (2000, Square),
written in JavaScript with Three.js.
It contains a partially working model viewer.
Everything is work in progress.

(A prior version was written in Java, which can be found [here](https://github.com/morris/vstools-java).)

## Usage

[Run in browser](rawgit.com/morris/vstools/master/index.html)

Runs in browsers that supports WebGL, like Chrome or Firefox.
The viewer opens individual files obtained from a CD image
which have to be extracted first from your copy of Vagrant Story.

This code is developed for the US Version of Vagrant Story but should work with any.

## Supported file types

- WEP (weapons)
- SHP (characters, partially)
- SEQ (animations, only poses)
- ZUD (basically SHP + SEQ + WEP)

## Acknowledgments

Many thanks to Valendian and other hackers' tremendous work on analyzing VS.

Most information on VS hacking can be found here:
http://datacrystal.romhacking.net/wiki/Vagrant_Story
