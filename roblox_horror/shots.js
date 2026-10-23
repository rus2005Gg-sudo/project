// Camera shots, anchored to voice-over cues (CUE.t). Studs; hero ~6 studs tall, feet at y.
(function () {
  const t = CUE.t;
  const lerp = (a, b, u) => a + (b - a) * u;
  const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const E = (u) => u * u * (3 - 2 * u);
  const hp = (S) => S.hs, zp = (S) => S.zp;
  const list = [
    // --- bright "normal" Roblox world
    [0, 62, 0.08, (u, S) => [L3([0, 14, 66], [0, 10, 48], u), [0, 5, -6]]],
    [t.intro2, 55, 0.08, (u, S) => { const h = hp(S); return [[h.x + 3.5, h.y + 6.5, h.z + 10], [h.x, h.y + 4, h.z - 8]]; }],
    [t.sun, 72, 0.06, (u, S) => { const h = hp(S); return [[h.x - 6, h.y + 2, h.z + 8], [60, 40 + u * 20, -120]]; }],
    [t.empty, 60, 0.1, (u, S) => [L3([60, 46, 70], [24, 36, 52], u), [0, 2, -6]]],
    [t.chat1, 40, 0.05, (u, S) => { const h = hp(S); return [[h.x - 2.4, h.y + 5.8, h.z - 6.5], [h.x, h.y + 5.3, h.z]]; }],
    // --- the entity appears
    [t.zeroAppear, 52, 0.06, (u, S) => { const h = hp(S); return [[h.x + 4, h.y + 7, h.z + 11], [0, 5, 0]]; }],
    [t.smiling, 34, 0.05, (u, S) => [L3([2.5, 5.5, 13], [1.6, 5.4, 9.5], u), [0, 5.3, 0]]],
    [t.hisName, 38, 0.04, (u, S) => [[1, 8.8, 10], [0, 8.2, 0]]],
    [t.rule1, 46, 0.05, (u, S) => [[48, 12, 13], [0, 5, 13]]],
    [t.blinked, 34, 0.12, (u, S) => { const h = hp(S); return [[h.x - 1.5, h.y + 5.6, h.z - 3.4], [h.x, h.y + 5.4, h.z]]; }],
    [t.closer, 52, 0.07, (u, S) => { const h = hp(S); return [[h.x + 4, h.y + 6, h.z + 10], [0, 5, 12]]; }],
    [t.rule2, 44, 0.07, (u, S) => { const h = hp(S), z = zp(S); return [[h.x + 2.5, h.y + 6.5, h.z + 5], [z.x, z.y + 5, z.z]]; }],
    [t.typed, 34, 0.08, (u, S) => { const h = hp(S); return [[h.x - 1.8, h.y + 5.6, h.z - 4.2], [h.x, h.y + 5.4, h.z]]; }],
    [t.musicSlow, 50, 0.3, (u, S) => { const z = zp(S); return [[2, 2, z.z - 7], [z.x, z.y + 5.5, z.z]]; }],
    // --- the chase
    [t.run, 56, 0.15, (u, S) => { const h = hp(S); return [[h.x + 3, h.y + 6, h.z + 13], [h.x, h.y + 4, h.z - 4]]; }],
    [t.lava, 50, 0.12, (u, S) => { const h = hp(S); return [[h.x + 17, h.y + 5, h.z + 3], [h.x, h.y + 3, h.z + 3]]; }],
    [t.everyTime, 66, 0.15, (u, S) => { const h = hp(S), z = zp(S); return [[h.x + 1.8, h.y + 5.6, h.z + 0.8], [z.x, z.y + 5, z.z]]; }],
    [t.there, 36, 0.1, (u, S) => { const z = zp(S); return [[z.x + 1.8, z.y + 5.6, z.z + 7.5], [z.x, z.y + 5.4, z.z]]; }],
    [t.skyRed, 62, 0.2, (u, S) => { const h = hp(S); return [[h.x - 5, h.y + 1.5, h.z - 12], [h.x, h.y + 16, h.z + 30]]; }],
    [t.platforms, 56, 0.12, (u, S) => { const h = hp(S); return [[h.x + 3, h.y + 13, h.z - 6], [h.x, h.y, h.z + 2]]; }],
    // --- the end of the bridge
    [t.rule3, 52, 0.08, (u, S) => { const h = hp(S); return [[h.x + 14, h.y + 6, h.z - 2], [h.x, h.y + 4, h.z - 2]]; }],
    [t.pressed, 42, 0.06, (u, S) => { const h = hp(S); return [[h.x + 7, h.y + 6, h.z - 3.5], [h.x, h.y + 5, h.z - 1]]; }],
    [t.looked, 44, 0.06, (u, S) => { const h = hp(S); return [[h.x - 6, h.y + 6, h.z - 8], [h.x, h.y + 5, h.z - 2]]; }],
    [t.said, 40, 0.05, (u, S) => { const h = hp(S); return [L3([h.x - 1, h.y + 7, h.z - 9], [h.x - 0.5, h.y + 6.8, h.z - 7], u), [h.x, h.y + 6.7, h.z]]; }],
    [t.chat2, 50, 0.05, (u, S) => { const h = hp(S); return [L3([h.x - 1, h.y + 6.5, h.z - 8], [h.x - 1, h.y + 9, h.z - 18], E(u)), [h.x, h.y + 5, h.z]]; }],
    [t.farAway, 52, 0.06, (u, S) => [L3([0, 8, 66], [0, 7, 50], u), [0, 6, 0]]],
  ];
  window.SHOTS_DEF = list.map((s, i) => ({ a: s[0], b: i + 1 < list.length ? list[i + 1][0] : 1e9, f: s[1], shake: s[2], c: (tt, u, S) => s[3](u, S) }));
})();
