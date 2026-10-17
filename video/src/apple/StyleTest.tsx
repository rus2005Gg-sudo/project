import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {HZ, HZ_INK, HZ_BLUE, HZ_SUB, StudioBg, Wordmark, Slam} from './brand';

export const StyleTest: React.FC = () => (
	<AbsoluteFill>
		<StudioBg />
		<AbsoluteFill style={{alignItems: 'center', padding: '290px 100px 360px', boxSizing: 'border-box', justifyContent: 'center', gap: 60}}>
			<Slam at={0}><Wordmark size={250} /></Slam>
			<Slam at={8}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 104, lineHeight: 1.02, letterSpacing: -4, color: HZ_INK, textAlign: 'center'}}>
					На связи.<br />На своей волне<span style={{color: HZ_BLUE}}>.</span>
				</div>
			</Slam>
			<Slam at={14}><div style={{fontFamily: HZ, fontWeight: 500, fontSize: 48, color: HZ_SUB}}>Ваш VPN и AI-помощник</div></Slam>
			<Slam at={20}><Img src={staticFile('brand/icon-ref.png')} style={{width: 300, borderRadius: 70, boxShadow: '0 30px 60px rgba(20,30,60,0.18)'}} /></Slam>
		</AbsoluteFill>
	</AbsoluteFill>
);
