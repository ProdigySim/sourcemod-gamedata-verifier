# sourcemod-gamedata-verifier
 Automatically verify your sourcemod gamedata

This is a deno program that will take a dll and a SourceMod Gamedata and search for all of the sigs in it.


## Usage
For now, just:
```bash
deno run --allow-read index.ts --dll path/to/server.dll --gamedata .\left4dhooks.l4d2.txt
```

Other options:
* `--lib server` or `--lib engine` to specify which "library" we should check the sigs for. Defaults to `server`.
* `--quiet`: Only print out not found signatures. Defaults to printing both found & not found.
