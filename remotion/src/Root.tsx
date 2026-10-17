import React from "react";
import {Composition} from "remotion";
import {FPS, H, TL, W} from "./lib";
import {Reel} from "./Reel";

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={Math.floor(TL.duration * FPS)}
  />
);
