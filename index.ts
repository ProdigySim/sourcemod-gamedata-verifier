import * as vdf from "https://raw.githubusercontent.com/node-steam/vdf/ddefb113c8336ff968b965ff690fcb47f1fb1825/src/index.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

/**
 * Remove comments from keyvalues
 * (node-steam/vdf does not support comments in keyvalues files)
 * @param txt gamedata text
 */
function cleanGameDataText(txt: string) {
  let s = "";
  let insideComment = false;
  for (let i = 0; i < txt.length;) {
    const cur = txt[i];
    const next = txt[i + 1];
    if (insideComment) {
      if (cur === "*" && next === "/") {
        insideComment = false;
        i += 2;
      } else {
        i++;
      }
    } else if (cur === "/" && next === "*") {
      insideComment = true;
      i += 2;
    } else {
      s += cur;
      i++;
    }
  }
  return s;
}

type SigEntry = {
  library: string;
  linux?: string;
  windows?: string;
};

type NamedSigEntry = SigEntry & { name: string };

// Predicates for make typescript happy
function isEntryWithWindowsSig(
  value: NamedSigEntry,
): value is Omit<NamedSigEntry, "windows"> & { windows: string } {
  return !!value.windows;
}

/**
 * Parse SourceMod-style byte string signatures into Uint8Array
 * @param sig signature string
 */
function parseSig(sig: string) {
  const output = new Uint8Array(sig.length / 4);
  let i = 0;
  sig.replace(/\*/g, "\\x2A").split("\\x").filter((x) => !!x).forEach((byte) => {
    if (byte.length !== 2) {
      console.error(sig);
      throw new Error("Failed to parse sig. Byte longer than expected");
    }
    const val = parseInt(byte, 16);
    if (isNaN(val)) {
      console.error(sig);
      throw new Error("Failed to parse sig. Byte was not a number");
    }
    output[i++] = val;
  });
  // console.log(`INPUT  ${sig}`);
  // console.log(`OUTPUT ${Array.from(output).map(x => x.toString(16))}`)
  return output;
}

/**
 * Search the target for the given signature.
 * @param target Target memory blob to search through (haystack)
 * @param sig Signature to search for (needle)
 */
function sigScan(target: Uint8Array, sig: Uint8Array): number {
  return target.findIndex((value, idx, obj) => {
    for (let i = 0; i < sig.length; i++) {
      if (sig[i] === 0x2A) {
        continue;
      }
      if (obj[idx + i] === sig[i]) {
        continue;
      }
      return false;
    }
    return true;
  });
}

/**
 * Print Ghidra-compatible search string for signature.
 * @param sig A signature
 */
function ghidraText(sig: Uint8Array) {
  return Array.from(sig).map((value) =>
    value == 0x2A ? ".." : value.toString(16).padStart(2, "0")
  ).join(" ");
}

async function main(
  dllpath: string,
  gamedatapath: string,
  targetLib: string,
  printFound: boolean,
) {
  const serverBin = await Deno.readFile(dllpath);
  const gamedata = vdf.parse(
    cleanGameDataText(await Deno.readTextFile(gamedatapath)),
  );
  const games = Object.values(gamedata.Games as Record<string, any>);
  const sigs = games.flatMap((g) =>
    g.Signatures ? Object.entries(g.Signatures) : []
  ) as Array<[string, SigEntry]>;
  sigs.map(([key, value]) => ({
    ...value,
    name: key,
  }))
    .filter(isEntryWithWindowsSig)
    .filter((entry) => entry.library === targetLib)
    .map((entry) => ({
      name: entry.name,
      txtSig: entry.windows,
      sig: parseSig(entry.windows),
    }))
    .forEach((entry) => {
      const result = sigScan(serverBin, entry.sig);
      if (result >= 0) {
        if (printFound) {
          console.log(`${entry.name} FOUND@${result}`);
        }
      } else {
        console.log(`${entry.name} NOT FOUND`);
        console.log(ghidraText(entry.sig));
      }
    });
}

const {
  dll,
  gamedata,
  lib,
  quiet,
} = parse(Deno.args) as {
  dll?: string;
  gamedata?: string;
  lib?: string;
  quiet?: boolean;
};

if (!dll) {
  console.error("Please use -dll to specify a dll");
}
if (!gamedata) {
  console.error("Please use -gamedata to specify a gamedata file");
}
if (!dll || !gamedata) {
  Deno.exit(1);
}

await main(dll, gamedata, lib ?? "server", !(quiet ?? false));
