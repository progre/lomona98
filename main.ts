#!/usr/bin/env -S deno run

import { parse } from "https://deno.land/x/ini@v2.1.0/mod.ts";
import encoding from "https://cdn.skypack.dev/encoding-japanese";

function encodeToSjis(str: string) {
  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(str);
  const sjisBytesArray = encoding.convert(utf8Bytes, {
    from: "UTF8",
    to: "SJIS",
  });
  return Uint8Array.from(sjisBytesArray);
}

const nameTxtBytes = await Deno.readFile("src/lomona/NAME.TXT");
const decoder = new TextDecoder("shift-jis");
const nameTxtRaw = decoder.decode(nameTxtBytes);

const nameTxt = parse(nameTxtRaw);

try {
  await Deno.mkdir("dst/disk1", { recursive: true });
  await Deno.mkdir("dst/disk2", { recursive: true });
  await Deno.mkdir("dst/disk3", { recursive: true });
} catch (e) {
  if (e.name !== "AlreadyExists") {
    throw e;
  }
}

const mapList = [...Array(nameTxt.entry.MAP).keys()].map((x) => nameTxt[x]);

const extra = [
  ["ぷりんあらもーど", "advanced", 46],
  ["狭城に野心を抱け", "advanced", 39],
  ["摩天楼に消える夢", "advanced", 27],
  ["闇の回廊を抜けて", "advanced", 16],
  ["よ～い　ドン！！", "original", 14],
  ["シンメトリブース", "original", 43],
  ["猶予なき大侵略戦", "original", 40],
  ["騒乱！駅前商店街", "original", 37],
  ["魔峡を征す大君主", "original", 47],
];

[...Array(3).keys()].forEach((disk) => {
  let diskNameTxt = mapList.slice(52 * disk, 52 * disk + 52).map((x) =>
    (<string> x.NAME).padEnd(8, "　")
  ).join("");
  if (disk === 2) {
    diskNameTxt += extra.map((x) => x[0]).join("");
  }
  const target = `dst/disk${disk + 1}/NAME.TXT`;
  // console.log(`Write to ${target}`);
  // console.log(diskNameTxt);
  Deno.writeFile(target, encodeToSjis(diskNameTxt));
});

[...Array(nameTxt.entry.MAP).keys()].forEach((idx) => {
  const disk = idx / 52 | 0;
  const diskIdx = idx % 52;
  const from = `src/lomona/${mapList[idx].FILE}`;
  const to = `dst/disk${disk + 1}/B_${String(diskIdx).padStart(3, "0")}.MAP`;
  // console.log(`copy from ${from} to ${to}`);
  Deno.copyFile(from, to);
});

extra.forEach((item, i) => {
  const from = `src/${item[1]}/B_${String(item[2]).padStart(3, "0")}.MAP`;
  const to = `dst/disk3/B_${
    String(nameTxt.entry.MAP % 52 + i).padStart(3, "0")
  }.MAP`;
  console.log(`copy from ${from} to ${to}`);
  // WTF: どうもタイムスタンプの xx:xx:62 をフラグとして圧縮形式を認識してるっぽく、上手く圧縮形式を扱うことができない。
  // Deno.copyFile(from, to);
});
