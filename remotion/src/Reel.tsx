import React, {useEffect, useState} from "react";
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, OffthreadVideo, Sequence, staticFile} from "remotion";
import {Captions} from "./Captions";
import {f, FONT_AR, FONT_TITLE, FONT_UI} from "./lib";
import {Scenes, sfxCues} from "./scenes";
import {PersonOverlay, ZeroToHeroTitle} from "./ZeroToHero";

const FONTS: [string, string, string][] = [
  [FONT_AR, "fonts/Alexandria.ttf", "100 900"],
  [FONT_UI, "fonts/SpaceGrotesk.ttf", "300 700"],
  [FONT_TITLE, "fonts/Anton-Regular.ttf", "400"],
];

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      FONTS.map(([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, {weight});
        return face.load().then((loaded) => document.fonts.add(loaded));
      }),
    )
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle]);
};

export const Reel: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{backgroundColor: "#000"}}>
      {/* 1. edited footage: cuts, grade, zooms, transitions, cleaned voice + ducked music */}
      <OffthreadVideo src={staticFile("base.mp4")} />
      {/* 2. title sits behind the speaker */}
      <ZeroToHeroTitle layer="back" />
      <PersonOverlay />
      <ZeroToHeroTitle layer="front" />
      {/* 3. foreground: UI/UX motion graphics + kinetic captions */}
      <Scenes />
      <Captions />
      {/* 4. UI sound design */}
      {sfxCues().map((c, i) => (
        <Sequence key={i} from={Math.max(0, f(c.t))} durationInFrames={f(1.2)}>
          <Audio src={staticFile(`sfx/${c.s}.wav`)} volume={c.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
