import React from 'react';
import {Composition} from 'remotion';
import {Welcome} from './Welcome';
import {FPS, REEL_FRAMES, Reel} from './reel/Reel';
import {PoseTest} from './gym/PoseTest';
import {GYM_FPS, GYM_FRAMES, Gym} from './gym/Gym';
import {PROMO_FRAMES, P_FPS, Promo} from './promo/Promo';
import {RobotTest} from './giveaway/RobotTest';
import {GIVEAWAY_FRAMES, G_FPS, Giveaway} from './giveaway/Giveaway';
import {MONTH_FRAMES, M_FPS, Month} from './month/Month';
import {StyleFrames} from './style/StyleFrames';
import {Avatar} from './profile/Avatar';
import {CHALLENGE_FRAMES, CH_FPS, Challenge} from './apple/Challenge';
import {MONTH_APPLE_FRAMES, MA_FPS, MonthApple} from './apple/MonthApple';

export const Root: React.FC = () => (
	<>
		<Composition id="Welcome" component={Welcome} durationInFrames={150} fps={30} width={960} height={540} />
		<Composition id="Reel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={1080} height={1920} />
		<Composition id="Gym" component={Gym} durationInFrames={GYM_FRAMES} fps={GYM_FPS} width={1080} height={1920} />
		<Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={P_FPS} width={1080} height={1920} />
		<Composition id="MonthApple" component={MonthApple} durationInFrames={MONTH_APPLE_FRAMES} fps={MA_FPS} width={1080} height={1920} />
		<Composition id="Challenge" component={Challenge} durationInFrames={CHALLENGE_FRAMES} fps={CH_FPS} width={1080} height={1920} />
		<Composition id="Avatar" component={Avatar} durationInFrames={1} fps={30} width={1080} height={1080} />
		<Composition id="Styles" component={StyleFrames} durationInFrames={1} fps={30} width={3240} height={1920} />
		<Composition id="Month" component={Month} durationInFrames={MONTH_FRAMES} fps={M_FPS} width={1080} height={1920} />
		<Composition id="Giveaway" component={Giveaway} durationInFrames={GIVEAWAY_FRAMES} fps={G_FPS} width={1080} height={1920} />
		<Composition id="RobotTest" component={RobotTest} durationInFrames={1} fps={30} width={1080} height={960} />
		<Composition id="PoseTest" component={PoseTest} durationInFrames={1} fps={30} width={1080} height={1920} />
	</>
);
