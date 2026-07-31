(() => {
  'use strict';

  const canvas = document.querySelector('#pelican-canvas');
  const ctx = canvas.getContext('2d');
  const W = 1600;
  const H = 900;
  const LOOP = 12;
  const TAU = Math.PI * 2;

  const C = {
    ink: '#173642',
    deepInk: '#102b35',
    cream: '#fff7df',
    paper: '#f8edcf',
    coral: '#e8644a',
    coralDark: '#c84e3d',
    peach: '#ee9a72',
    apricot: '#f2b07e',
    sun: '#f7d386',
    sea: '#337f88',
    seaDeep: '#245e68',
    seaLight: '#7bb9ae',
    mint: '#a7c6ae',
    grass: '#2e6663',
    gold: '#e6aa52'
  };

  let cssWidth = innerWidth;
  let cssHeight = innerHeight;
  let dpr = 1;
  let startedAt = performance.now();
  const requestedTime = Number(new URLSearchParams(location.search).get('t'));
  let manualTime = Number.isFinite(requestedTime) && location.search.includes('t=')
    ? ((requestedTime % LOOP) + LOOP) % LOOP
    : null;

  const mod = (n, m) => ((n % m) + m) % m;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);

  function resize() {
    cssWidth = innerWidth;
    cssHeight = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }

  function path(fill, stroke = null, width = 1) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  function line(points, color, width, close = false) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    if (close) ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function ellipse(x, y, rx, ry, fill, rotation = 0, stroke = null, width = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
    path(fill, stroke, width);
  }

  function circle(x, y, r, fill, stroke = null, width = 1) {
    ellipse(x, y, r, r, fill, 0, stroke, width);
  }

  function drawSky(p, cycle) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 620);
    gradient.addColorStop(0, '#e77a5f');
    gradient.addColorStop(.46, '#ef9c75');
    gradient.addColorStop(1, '#f4c696');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const halo = ctx.createRadialGradient(1268, 178, 20, 1268, 178, 226);
    halo.addColorStop(0, 'rgba(255,244,190,.9)');
    halo.addColorStop(.34, 'rgba(248,214,139,.45)');
    halo.addColorStop(1, 'rgba(248,214,139,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(1020, -60, 500, 500);
    circle(1268, 178, 84, C.sun);
    circle(1268, 178, 67, '#f9dda0');

    ctx.globalAlpha = .12;
    for (let i = 0; i < 7; i++) {
      const y = 96 + i * 49;
      const drift = Math.sin(cycle + i * .8) * (8 + i * 2);
      ctx.beginPath();
      ctx.moveTo(560 + drift, y);
      ctx.bezierCurveTo(765, y - 30, 960, y + 20, 1160, y - 8);
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawCloud(705 + Math.sin(cycle) * 24, 158, .82, .38);
    drawCloud(1425 + Math.sin(cycle + 2) * 18, 304, .54, .26);
    drawCloud(410 + Math.sin(cycle + 4) * 14, 358, .42, .18);

    ctx.globalAlpha = .7;
    drawBird(795 + Math.sin(cycle) * 10, 277, 1.1, cycle * 3);
    drawBird(845 + Math.sin(cycle + 1) * 8, 307, .7, cycle * 3 + 1);
    drawBird(1470 + Math.sin(cycle + 2) * 8, 232, .55, cycle * 3 + 2);
    ctx.globalAlpha = 1;
  }

  function drawCloud(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.moveTo(-112, 24);
    ctx.bezierCurveTo(-104, -7, -72, -16, -50, -5);
    ctx.bezierCurveTo(-39, -54, 31, -65, 52, -15);
    ctx.bezierCurveTo(83, -29, 116, -2, 110, 26);
    ctx.bezierCurveTo(58, 38, -48, 39, -112, 24);
    ctx.fill();
    ctx.restore();
  }

  function drawBird(x, y, scale, flap) {
    const wing = Math.sin(flap) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.quadraticCurveTo(-10, -11 - wing, 0, 0);
    ctx.quadraticCurveTo(11, -11 + wing, 24, 2);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function drawSea(p, cycle) {
    const sea = ctx.createLinearGradient(0, 420, 0, 650);
    sea.addColorStop(0, C.seaLight);
    sea.addColorStop(.48, C.sea);
    sea.addColorStop(1, C.seaDeep);
    ctx.fillStyle = sea;
    ctx.beginPath();
    ctx.moveTo(0, 436);
    ctx.bezierCurveTo(320, 418, 595, 452, 900, 431);
    ctx.bezierCurveTo(1170, 414, 1375, 440, 1600, 424);
    ctx.lineTo(1600, 680);
    ctx.lineTo(0, 680);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 420, W, 250);
    ctx.clip();

    const shimmer = ctx.createLinearGradient(1130, 430, 1390, 640);
    shimmer.addColorStop(0, 'rgba(255,236,174,.42)');
    shimmer.addColorStop(1, 'rgba(255,236,174,0)');
    ctx.fillStyle = shimmer;
    ctx.beginPath();
    ctx.moveTo(1215, 430);
    ctx.lineTo(1330, 430);
    ctx.lineTo(1445, 670);
    ctx.lineTo(1030, 670);
    ctx.closePath();
    ctx.fill();

    for (let row = 0; row < 8; row++) {
      const y = 459 + row * 26;
      const amp = 3 + row * .35;
      const phase = cycle * (1 + row);
      ctx.beginPath();
      for (let x = -180; x <= W + 180; x += 10) {
        const yy = y + Math.sin(x * .035 + phase + row) * amp;
        if (x === -180) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = row % 2 ? 'rgba(255,247,223,.2)' : 'rgba(255,247,223,.38)';
      ctx.lineWidth = row % 3 === 0 ? 3 : 1.6;
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#3a6e69';
    ctx.beginPath();
    ctx.moveTo(0, 503);
    ctx.bezierCurveTo(145, 462, 266, 484, 375, 500);
    ctx.bezierCurveTo(505, 520, 575, 493, 706, 487);
    ctx.lineTo(706, 535);
    ctx.lineTo(0, 550);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#285954';
    ctx.beginPath();
    ctx.moveTo(1374, 476);
    ctx.bezierCurveTo(1460, 442, 1530, 450, 1600, 430);
    ctx.lineTo(1600, 550);
    ctx.lineTo(1408, 536);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad(p, cycle) {
    ctx.fillStyle = '#e6b178';
    ctx.beginPath();
    ctx.moveTo(0, 609);
    ctx.bezierCurveTo(350, 570, 610, 620, 900, 596);
    ctx.bezierCurveTo(1190, 573, 1415, 586, 1600, 565);
    ctx.lineTo(1600, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 624);
    ctx.bezierCurveTo(350, 585, 610, 635, 900, 611);
    ctx.bezierCurveTo(1190, 588, 1415, 601, 1600, 580);
    ctx.strokeStyle = 'rgba(255,247,223,.72)';
    ctx.lineWidth = 7;
    ctx.stroke();

    const travel = p * 3600;
    ctx.fillStyle = 'rgba(255,247,223,.62)';
    for (let x = -400; x < W + 400; x += 300) {
      const px = mod(x - travel, 2100) - 260;
      ctx.save();
      ctx.translate(px, 790);
      ctx.transform(1, 0, -.18, 1, 0, 0);
      ctx.fillRect(0, 0, 118, 10);
      ctx.restore();
    }

    ctx.globalAlpha = .1;
    for (let i = 0; i < 14; i++) {
      const x = mod(i * 173 - travel * .5, 1800) - 150;
      ellipse(x, 700 + (i % 4) * 47, 48 + (i % 3) * 13, 4, C.ink, -.08);
    }
    ctx.globalAlpha = 1;

    drawRoadsidePlants(travel, cycle);
  }

  function drawRoadsidePlants(travel, cycle) {
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const x = mod(i * 119 - travel * .5, 1800) - 100;
      const y = 608 + (i % 4) * 8;
      const scale = .48 + (i % 5) * .08;
      const sway = Math.sin(cycle * 3 + i) * 5;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.rotate(sway * Math.PI / 360);
      ctx.strokeStyle = i % 3 ? C.grass : C.ink;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(3 + sway, -24, -2, -68);
      ctx.moveTo(0, -15);
      ctx.quadraticCurveTo(-22, -29, -31, -48);
      ctx.moveTo(0, -32);
      ctx.quadraticCurveTo(20, -42, 28, -62);
      ctx.stroke();
      if (i % 5 === 0) {
        circle(-3, -72, 9, i % 10 ? C.cream : C.coral);
        circle(-10, -68, 6, C.sun);
        circle(5, -66, 6, C.sun);
        circle(-3, -62, 6, C.sun);
        circle(-3, -68, 3, C.coralDark);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawForeground(travel, cycle) {
    ctx.save();
    for (let i = 0; i < 13; i++) {
      const x = mod(i * 223 - travel, 1800) - 130;
      const baseY = 920;
      const height = 52 + (i % 5) * 18;
      const sway = Math.sin(cycle * 2 + i * .7) * 6;
      ctx.strokeStyle = i % 3 === 0 ? C.deepInk : C.grass;
      ctx.lineWidth = 5 + (i % 2);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x + sway, baseY - height * .5, x + sway * .7, baseY - height);
      ctx.stroke();
      for (let j = 1; j <= 2; j++) {
        const yy = baseY - height * (j * .28 + .12);
        ctx.beginPath();
        ctx.moveTo(x + sway * .3, yy);
        ctx.quadraticCurveTo(x - 29, yy - 18, x - 37, yy - 42);
        ctx.moveTo(x + sway * .35, yy - 8);
        ctx.quadraticCurveTo(x + 27, yy - 20, x + 36, yy - 45);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawWheel(cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    for (let i = 0; i < 18; i++) {
      const a = i * TAU / 18;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10));
      ctx.strokeStyle = 'rgba(23,54,66,.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
    circle(cx, cy, r, null, C.deepInk, 11);
    circle(cx, cy, r - 13, null, C.cream, 3);
    circle(cx, cy, 10, C.sun, C.deepInk, 5);
  }

  function drawBike(p, cycle) {
    const gx = 970;
    const gy = 520;
    const wheelAngle = p * TAU * 5;
    const bob = Math.sin(cycle * 9) * 4.5;
    const pedalAngle = p * TAU * 9;
    const rear = { x: -190, y: 175 };
    const front = { x: 190, y: 175 };
    const crank = { x: 10, y: 175 };
    const seatPost = { x: -48, y: 18 };
    const head = { x: 126, y: 22 };

    ctx.save();
    ctx.translate(gx, gy);

    ellipse(0, 302, 352, 28, 'rgba(16,43,53,.14)');
    drawWheel(rear.x, rear.y, 118, wheelAngle);
    drawWheel(front.x, front.y, 118, wheelAngle);

    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rear.x, rear.y);
    ctx.lineTo(seatPost.x, seatPost.y);
    ctx.lineTo(crank.x, crank.y);
    ctx.lineTo(rear.x, rear.y);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(crank.x, crank.y);
    ctx.lineTo(front.x, front.y);
    ctx.moveTo(seatPost.x, seatPost.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();

    line([[head.x, head.y], [113, -29], [157, -47]], C.deepInk, 10);
    line([[151, -47], [180, -47]], C.deepInk, 9);
    line([[-48, 18], [-73, -18]], C.deepInk, 9);
    line([[-92, -20], [-44, -20]], C.deepInk, 12);

    drawBasket(162, -20, cycle);

    const pedalA = {
      x: crank.x + Math.cos(pedalAngle) * 43,
      y: crank.y + Math.sin(pedalAngle) * 43
    };
    const pedalB = {
      x: crank.x - Math.cos(pedalAngle) * 43,
      y: crank.y - Math.sin(pedalAngle) * 43
    };
    line([[pedalA.x, pedalA.y], [pedalB.x, pedalB.y]], C.deepInk, 6);
    circle(crank.x, crank.y, 24, C.sun, C.deepInk, 6);

    drawScarf(cycle, bob);
    drawLeg({ x: -66, y: -13 + bob }, pedalB, -44, .9);
    drawLeg({ x: -20, y: -4 + bob }, pedalA, 44, 1);
    drawPelican(cycle, bob);

    ctx.restore();
  }

  function drawBasket(x, y, cycle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = C.deepInk;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.quadraticCurveTo(20, -15, 52, 4);
    ctx.stroke();

    ctx.fillStyle = C.gold;
    ctx.strokeStyle = C.deepInk;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(60, 0);
    ctx.lineTo(48, 55);
    ctx.lineTo(-5, 55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = .45;
    for (let yy = 12; yy < 51; yy += 12) line([[-7, yy], [51, yy]], C.deepInk, 2);
    for (let xx = 5; xx < 51; xx += 14) line([[xx, 5], [xx - 4, 51]], C.deepInk, 2);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(20, 10 + Math.sin(cycle * 4) * 1.5);
    ctx.rotate(-.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, 27, 10, 0, 0, TAU);
    ctx.fillStyle = C.seaDeep;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(-42, -13);
    ctx.lineTo(-39, 13);
    ctx.closePath();
    ctx.fill();
    circle(16, -2, 2.2, C.cream);
    ctx.restore();

    for (let i = 0; i < 4; i++) {
      const sway = Math.sin(cycle * 3 + i) * 3;
      line([[11 + i * 11, 2], [7 + i * 12 + sway, -30 - i * 5]], C.grass, 3);
      circle(7 + i * 12 + sway, -34 - i * 5, 6, i % 2 ? C.cream : C.coral);
      circle(7 + i * 12 + sway, -34 - i * 5, 2, C.sun);
    }
    ctx.restore();
  }

  function drawLeg(hip, foot, bend, alpha) {
    const midX = (hip.x + foot.x) / 2 + bend;
    const midY = (hip.y + foot.y) / 2 - 10;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.quadraticCurveTo(midX, midY, foot.x, foot.y);
    ctx.strokeStyle = '#df8a52';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();
    line([[foot.x - 11, foot.y + 4], [foot.x + 24, foot.y + 4]], C.deepInk, 7);
    ctx.globalAlpha = 1;
  }

  function drawScarf(cycle, bob) {
    const lift = Math.sin(cycle * 5) * 8;
    ctx.beginPath();
    ctx.moveTo(8, -151 + bob);
    ctx.bezierCurveTo(-70, -176 + lift + bob, -137, -132 - lift + bob, -219, -171 + bob);
    ctx.bezierCurveTo(-155, -112 - lift + bob, -76, -128 + lift + bob, 13, -119 + bob);
    ctx.closePath();
    path(C.coral, C.deepInk, 6);

    ctx.beginPath();
    ctx.moveTo(-168, -154 + bob);
    ctx.lineTo(-218, -195 + lift + bob);
    ctx.lineTo(-207, -157 + bob);
    ctx.closePath();
    ctx.fillStyle = C.cream;
    ctx.globalAlpha = .75;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawPelican(cycle, bob) {
    ctx.save();
    ctx.translate(0, bob);
    ctx.rotate(Math.sin(cycle * 9) * .009);

    ctx.beginPath();
    ctx.moveTo(-165, -77);
    ctx.bezierCurveTo(-199, -115, -172, -169, -114, -186);
    ctx.bezierCurveTo(-36, -211, 51, -167, 68, -91);
    ctx.bezierCurveTo(82, -27, 25, 32, -61, 28);
    ctx.bezierCurveTo(-119, 26, -157, -12, -165, -77);
    path(C.paper, C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(-157, -73);
    ctx.bezierCurveTo(-139, -18, -76, 10, -13, -4);
    ctx.bezierCurveTo(-77, 38, -157, 11, -166, -53);
    ctx.closePath();
    ctx.fillStyle = '#e7d9ba';
    ctx.globalAlpha = .72;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(-154, -83);
    ctx.lineTo(-220, -101);
    ctx.quadraticCurveTo(-176, -121, -145, -137);
    ctx.closePath();
    path(C.paper, C.deepInk, 6);

    ctx.beginPath();
    ctx.moveTo(-66, -144);
    ctx.bezierCurveTo(-23, -177, 2, -216, -5, -260);
    ctx.bezierCurveTo(-13, -313, 20, -357, 79, -358);
    ctx.bezierCurveTo(133, -360, 158, -324, 143, -280);
    ctx.bezierCurveTo(127, -232, 80, -195, 76, -112);
    ctx.bezierCurveTo(74, -70, 60, -39, 40, -20);
    ctx.bezierCurveTo(25, -88, -4, -134, -66, -144);
    path(C.cream, C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(11, -261);
    ctx.bezierCurveTo(31, -222, 74, -200, 87, -159);
    ctx.bezierCurveTo(98, -123, 77, -78, 42, -51);
    ctx.bezierCurveTo(57, -122, 17, -180, 11, -261);
    ctx.fillStyle = '#eadfc6';
    ctx.globalAlpha = .66;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(18, -307);
    ctx.bezierCurveTo(-7, -344, -47, -351, -70, -322);
    ctx.bezierCurveTo(-32, -330, -4, -312, 15, -282);
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, -329);
    ctx.bezierCurveTo(0, -376, -40, -380, -65, -351);
    ctx.stroke();

    const blinkPulse = Math.max(0, 1 - Math.abs(mod(cycle / TAU * LOOP, 4) - 3.82) / .09);
    const eyeH = lerp(12, 1.6, ease(Math.min(1, blinkPulse)));
    ellipse(91, -316, 14, eyeH + 4, C.sun, 0, C.deepInk, 4.5);
    ellipse(95, -315, 5, Math.max(1.2, eyeH * .45), C.deepInk);
    circle(98, -319, 1.5, C.cream);

    ctx.beginPath();
    ctx.moveTo(126, -309);
    ctx.bezierCurveTo(210, -313, 291, -289, 346, -257);
    ctx.bezierCurveTo(360, -249, 355, -239, 334, -234);
    ctx.bezierCurveTo(247, -211, 173, -219, 121, -239);
    ctx.closePath();
    path('#ee9554', C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(122, -239);
    ctx.bezierCurveTo(188, -218, 270, -214, 335, -235);
    ctx.bezierCurveTo(292, -170, 211, -150, 147, -181);
    ctx.bezierCurveTo(127, -192, 118, -211, 122, -239);
    ctx.closePath();
    path(C.apricot, C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(159, -214);
    ctx.bezierCurveTo(213, -185, 278, -197, 314, -226);
    ctx.strokeStyle = 'rgba(255,247,223,.52)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    const wingLift = Math.sin(cycle * 9) * 7;
    ctx.beginPath();
    ctx.moveTo(-110, -146 + wingLift);
    ctx.bezierCurveTo(-73, -195 + wingLift, 2, -178 + wingLift * .6, 47, -126);
    ctx.bezierCurveTo(81, -88, 121, -63, 159, -51);
    ctx.bezierCurveTo(129, -27, 88, -32, 58, -51);
    ctx.bezierCurveTo(16, -17, -50, -10, -102, -44);
    ctx.bezierCurveTo(-140, -69, -144, -110, -110, -146);
    path(C.cream, C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(-93, -113 + wingLift * .55);
    ctx.bezierCurveTo(-34, -66 + wingLift * .35, 18, -65, 65, -82);
    ctx.strokeStyle = '#d4c6aa';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-93, -82);
    ctx.bezierCurveTo(-39, -40, 8, -43, 48, -57);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(142, -62);
    ctx.quadraticCurveTo(160, -49, 179, -48);
    ctx.strokeStyle = '#df8a52';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    line([[175, -48], [188, -47]], C.deepInk, 7);

    ctx.beginPath();
    ctx.moveTo(-11, -169);
    ctx.bezierCurveTo(25, -148, 55, -144, 82, -151);
    ctx.lineTo(85, -119);
    ctx.bezierCurveTo(53, -111, 19, -118, -18, -139);
    ctx.closePath();
    path(C.coral, C.deepInk, 5);

    ctx.restore();
  }

  function drawVignette() {
    const vignette = ctx.createRadialGradient(W * .54, H * .48, 280, W * .54, H * .5, 980);
    vignette.addColorStop(.55, 'rgba(16,43,53,0)');
    vignette.addColorStop(1, 'rgba(16,43,53,.18)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function draw(time) {
    const t = mod(time, LOOP);
    const p = t / LOOP;
    const cycle = p * TAU;
    const travel = p * 3600;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(cssWidth / W, cssHeight / H);
    const ox = (cssWidth - W * scale) / 2;
    const oy = (cssHeight - H * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

    drawSky(p, cycle);
    drawSea(p, cycle);
    drawRoad(p, cycle);
    drawBike(p, cycle);
    drawForeground(travel, cycle);
    drawVignette();
  }

  function frame(now) {
    const elapsed = manualTime === null ? (now - startedAt) / 1000 : manualTime;
    try {
      draw(elapsed);
    } catch (error) {
      const report = document.createElement('pre');
      report.id = 'animation-error';
      report.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:99;max-width:90vw;padding:16px;background:#fff;color:#900;white-space:pre-wrap';
      report.textContent = error && error.stack ? error.stack : String(error);
      document.body.appendChild(report);
      throw error;
    }
    if (manualTime === null) requestAnimationFrame(frame);
  }

  window.pelicanAnimation = {
    setTime(seconds) {
      manualTime = mod(Number(seconds) || 0, LOOP);
      draw(manualTime);
    },
    play() {
      if (manualTime !== null) {
        startedAt = performance.now() - manualTime * 1000;
        manualTime = null;
        requestAnimationFrame(frame);
      }
    },
    get loopDuration() { return LOOP; }
  };

  addEventListener('resize', resize);
  resize();
  frame(performance.now());
})();
