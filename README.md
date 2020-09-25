# sourcemod-gamedata-verifier
 Automatically verify your sourcemod gamedata

This is a deno program that will take a dll and a SourceMod Gamedata and search for all of the sigs in it.

Currently only supports windows signatures, and only byte strings (no symbols/labels).

Prior art / More complete solutions:
[Psychonic's SourceMod GDC tool](https://github.com/alliedmodders/sourcemod/tree/master/tools/gdc-psyfork)
[Scag's IDA gamedata checker](https://github.com/Scags/IDA-Scripts/blob/master/gamedata_checker.py)


## Usage
For now, just:
```bash
deno run --allow-read index.ts --dll path/to/server.dll --gamedata path/to/gamedata.txt
```

Other options:
* `--lib server` or `--lib engine` to specify which "library" we should check the sigs for. Defaults to `server`.
* `--quiet`: Only print out not found signatures. Defaults to printing both found & not found.
