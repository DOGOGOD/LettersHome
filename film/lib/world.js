// 家书 — paper-theater WebGL engine.
// Every frame is a pure function of t: scenes are built lazily, then drawn from t alone.
import * as THREE from "./three.module.min.js";
THREE.ColorManagement.enabled = false; // hex values are used as authored; output is not re-encoded

// ---------------------------------------------------------------- deterministic helpers
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const inOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const sine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
// smooth flame flicker in ~[0.85, 1.1]
export function flicker(t, seed = 0) {
  const s = seed * 17.17;
  const v =
    0.5 * Math.sin(t * 7.3 + s) +
    0.3 * Math.sin(t * 12.9 + s * 1.7) +
    0.2 * Math.sin(t * 23.1 + s * 2.3) +
    0.15 * Math.sin(t * 3.1 + s * 0.3);
  return 0.97 + 0.07 * v;
}

// ---------------------------------------------------------------- GLSL chunks
export const GLSL = /* glsl */ `
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*vnoise(p);p=m*p;a*=.5;}return v;}
float fbm3(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){v+=a*vnoise(p);p=m*p;a*=.5;}return v;}
`;

const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vWorld;
void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

// ---------------------------------------------------------------- canvas → texture
export function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  t.userData.canvas = c;
  return t;
}
// blurred copy of an alpha texture's canvas/image, used as a cast shadow
export function blurredTex(src, blurPx) {
  const img = src.image;
  const w = img.width,
    h = img.height;
  const pad = 0;
  return canvasTex(w, h, (g) => {
    g.filter = `blur(${blurPx}px)`;
    g.drawImage(img, pad, pad, w, h);
  });
}

// ---------------------------------------------------------------- materials
export function paperMaterial(o = {}) {
  const u = {
    uMap: { value: o.map || null },
    uHasMap: { value: o.map ? 1 : 0 },
    uTone: { value: new THREE.Color(o.tone ?? 0x15110d) },
    uLight: { value: new THREE.Color(o.light ?? 0xffb25a) },
    uLightPos: { value: new THREE.Vector2(...(o.lightPos || [0.5, 0.2])) },
    uLightAmt: { value: o.lightAmt ?? 0.0 },
    uLightFall: { value: o.lightFall ?? 3.0 },
    uRim: { value: o.rim ?? 0.0 },
    uRimDir: { value: new THREE.Vector2(...(o.rimDir || [0, -1])) },
    uRimW: { value: o.rimW ?? 0.004 },
    uFog: { value: o.fog ?? 0.0 },
    uFogColor: { value: new THREE.Color(o.fogColor ?? 0x000000) },
    uFiber: { value: o.fiber ?? 0.05 },
    uFiberScale: { value: o.fiberScale ?? 140.0 },
    uAspect: { value: o.aspect ?? 1.0 },
    uBurn: { value: o.burn ?? -1.0 },
    uBurnScale: { value: o.burnScale ?? 3.0 },
    uOpacity: { value: o.opacity ?? 1.0 },
    uFlick: { value: 1.0 },
    uTime: { value: 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${GLSL}
      varying vec2 vUv; varying vec3 vWorld;
      uniform sampler2D uMap; uniform float uHasMap;
      uniform vec3 uTone, uLight, uFogColor; uniform vec2 uLightPos, uRimDir;
      uniform float uLightAmt, uLightFall, uRim, uRimW, uFog, uFiber, uFiberScale, uAspect, uBurn, uBurnScale, uOpacity, uFlick, uTime;
      void main(){
        float a = uHasMap > .5 ? texture2D(uMap, vUv).a : 1.0;
        float aw = max(fwidth(a), 1e-3);
        float m = smoothstep(.5 - aw, .5 + aw, a);
        if (m < .01) discard;
        vec2 q = vec2(vUv.x * uAspect, vUv.y);
        float fib = (fbm(q * uFiberScale) - .5) * 2.0 * uFiber + (vnoise(q * uFiberScale * 6.) - .5) * uFiber * .6;
        vec3 col = uTone * (1.0 + fib);
        float d = distance(q, vec2(uLightPos.x * uAspect, uLightPos.y));
        float lit = uLightAmt * exp(-d * d * uLightFall) * uFlick;
        col += uLight * lit;
        if (uHasMap > .5 && uRim > 0.) {
          float a2 = texture2D(uMap, vUv + uRimDir * uRimW).a;
          float rim = m * (1.0 - smoothstep(.3, .7, a2));
          col += uLight * rim * uRim * (.35 + lit) * uFlick;
        }
        col = mix(col, uFogColor, uFog);
        float alpha = m * uOpacity;
        if (uBurn > -0.5) {
          float n = fbm(vWorld.xy * uBurnScale * .35) * .7 + vnoise(vWorld.xy * uBurnScale * 2.) * .3;
          float e = n - uBurn;
          if (e < 0.) discard;
          float char_ = 1.0 - smoothstep(0., .06, e);
          float glow = 1.0 - smoothstep(0., .018, e);
          col = mix(col, vec3(.03, .02, .015), char_);
          col += vec3(1.0, .45, .1) * glow * 2.2;
        }
        gl_FragColor = vec4(col, alpha);
      }`,
  });
}

export function shadowMaterial(map, opacity = 0.45) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uOpacity: { value: opacity } },
    transparent: true,
    depthWrite: false,
    vertexShader: VERT,
    fragmentShader: /* glsl */ `varying vec2 vUv; uniform sampler2D uMap; uniform float uOpacity;
      void main(){ float a = texture2D(uMap, vUv).a; gl_FragColor = vec4(0.,0.,0., a * uOpacity); }`,
  });
}

// Sky / backdrop: gradient + clouds or smoke + stars + moon + horizon fire glow.
export function skyMaterial(o = {}) {
  const u = {
    uTop: { value: new THREE.Color(o.top ?? 0x05060a) },
    uMid: { value: new THREE.Color(o.mid ?? 0x1a1410) },
    uBot: { value: new THREE.Color(o.bot ?? 0x3a1a0c) },
    uMidY: { value: o.midY ?? 0.45 },
    uCloud: { value: o.cloud ?? 0.0 },
    uCloudColor: { value: new THREE.Color(o.cloudColor ?? 0x2a1a14) },
    uCloudScale: { value: o.cloudScale ?? 2.0 },
    uCloudSpeed: { value: new THREE.Vector2(...(o.cloudSpeed || [0.01, 0.0])) },
    uCloudY: { value: new THREE.Vector2(...(o.cloudY || [0.0, 1.0])) },
    uStars: { value: o.stars ?? 0.0 },
    uMoon: { value: new THREE.Vector3(...(o.moon || [0.7, 0.75, 0.0])) },
    uMoonColor: { value: new THREE.Color(o.moonColor ?? 0xdfe8ff) },
    uGlow: { value: o.glow ?? 0.0 },
    uGlowColor: { value: new THREE.Color(o.glowColor ?? 0xff5a14) },
    uGlowY: { value: o.glowY ?? 0.2 },
    uGlowX: { value: new THREE.Vector2(...(o.glowX || [0.5, 0.6])) },
    uAspect: { value: o.aspect ?? 1.777 },
    uTime: { value: 0 },
    uFlick: { value: 1.0 },
    uLightning: { value: 0.0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u,
    depthWrite: false,
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${GLSL}
      varying vec2 vUv;
      uniform vec3 uTop,uMid,uBot,uCloudColor,uMoonColor,uGlowColor,uMoon; uniform vec2 uCloudSpeed,uCloudY,uGlowX;
      uniform float uMidY,uCloud,uCloudScale,uStars,uGlow,uGlowY,uAspect,uTime,uFlick,uLightning;
      void main(){
        vec2 uv=vUv; vec2 q=vec2(uv.x*uAspect,uv.y);
        vec3 col = uv.y > uMidY ? mix(uMid,uTop,smoothstep(uMidY,1.,uv.y)) : mix(uBot,uMid,smoothstep(0.,uMidY,uv.y));
        if(uStars>0.){
          vec2 g=q*220.; vec2 id=floor(g); float h=hash12(id);
          float s=step(.9965,h)*smoothstep(.5,.0,length(fract(g)-.5));
          float tw=.6+.4*sin(uTime*(1.+h*3.)+h*40.);
          col+=vec3(.85,.9,1.)*s*tw*uStars*smoothstep(.25,.75,uv.y);
        }
        if(uMoon.z>0.){
          float d=distance(q,vec2(uMoon.x*uAspect,uMoon.y));
          col+=uMoonColor*smoothstep(uMoon.z,uMoon.z*.9,d)*1.2;
          col+=uMoonColor*.35*exp(-d*d/(uMoon.z*uMoon.z*30.));
          col+=uMoonColor*.08*exp(-d*3.);
        }
        if(uGlow>0.){
          float gx=smoothstep(uGlowX.x-.45,uGlowX.x,uv.x)*smoothstep(uGlowX.y+.45,uGlowX.y,uv.x);
          float gy=exp(-pow(max(uv.y-uGlowY,0.)*3.2,1.4));
          float fl=.85+.15*fbm(vec2(uv.x*6.,uTime*1.3));
          col+=uGlowColor*uGlow*gx*gy*fl*uFlick;
        }
        if(uCloud>0.){
          vec2 p=q*uCloudScale+uCloudSpeed*uTime;
          float w=fbm(p+fbm(p*1.7+uTime*.02)*1.2);
          float band=smoothstep(uCloudY.x,uCloudY.x+.15,uv.y)*smoothstep(uCloudY.y,uCloudY.y-.15,uv.y);
          float c=smoothstep(.35,.85,w)*band*uCloud;
          vec3 cc=uCloudColor*(.7+.6*w);
          if(uGlow>0.) cc+=uGlowColor*uGlow*.5*exp(-pow(max(uv.y-uGlowY,0.)*2.2,1.3))*uFlick;
          col=mix(col,cc,c);
        }
        col+=vec3(.75,.8,1.)*uLightning;
        gl_FragColor=vec4(col,1.);
      }`,
  });
}

// Drifting smoke / fog sheet.
export function smokeMaterial(o = {}) {
  const u = {
    uColor: { value: new THREE.Color(o.color ?? 0x2a2420) },
    uLit: { value: new THREE.Color(o.lit ?? 0x000000) },
    uDensity: { value: o.density ?? 0.6 },
    uScale: { value: o.scale ?? 2.5 },
    uSpeed: { value: new THREE.Vector2(...(o.speed || [0.02, 0.05])) },
    uSeed: { value: o.seed ?? 0.0 },
    uEdge: { value: new THREE.Vector4(...(o.edge || [0.0, 0.25, 1.0, 0.75])) }, // y fade in/out: from,to , from,to
    uAspect: { value: o.aspect ?? 1.777 },
    uTime: { value: 0 },
    uOpacity: { value: o.opacity ?? 1.0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${GLSL}
      varying vec2 vUv; uniform vec3 uColor,uLit; uniform vec2 uSpeed; uniform vec4 uEdge;
      uniform float uDensity,uScale,uSeed,uAspect,uTime,uOpacity;
      void main(){
        vec2 q=vec2(vUv.x*uAspect,vUv.y)*uScale + uSeed*7.1;
        vec2 p=q - uSpeed*uTime*uScale;
        float w=fbm(p+vec2(fbm(p+uTime*.03),fbm(p*1.3-uTime*.02))*1.6);
        float a=smoothstep(.3,.9,w)*uDensity;
        a*=smoothstep(uEdge.x,uEdge.y,vUv.y)*smoothstep(uEdge.z,uEdge.w,vUv.y);
        a*=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
        vec3 c=uColor*(.75+.5*w)+uLit*w;
        gl_FragColor=vec4(c,a*uOpacity);
      }`,
  });
}

// Candle / lamp flame sprite. Plane UV: flame base at v≈0.18, tip near v≈0.9.
export function flameMaterial(o = {}) {
  const u = {
    uTime: { value: 0 },
    uSeed: { value: o.seed ?? 0.0 },
    uSize: { value: o.size ?? 1.0 },
    uOut: { value: 0.0 }, // 0 burning → 1 extinguished
    uHalo: { value: o.halo ?? 1.0 },
    uWind: { value: 0.0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${GLSL}
      varying vec2 vUv; uniform float uTime,uSeed,uSize,uOut,uHalo,uWind;
      void main(){
        vec2 p=vUv*2.-1.; p.y=(vUv.y-.18)/.72*2.-1.;   // p.y -1 at base, +1 at tip
        float t=uTime;
        float h=clamp((p.y+1.)*.5,0.,1.);
        float sway=(vnoise(vec2(t*2.3,uSeed))-.5)*.18 + (vnoise(vec2(t*7.,uSeed+3.))-.5)*.06 + uWind;
        p.x-=sway*h*h*1.4;
        float stretch=1.0+.12*(vnoise(vec2(t*5.,uSeed+9.))-.5);
        float life=1.-uOut;
        float wdt=.30*sqrt(max(1.-h,0.))*(.55+.45*smoothstep(0.,.25,h))*life;
        float body=smoothstep(wdt,wdt*.25,abs(p.x))*smoothstep(-1.02,-.85,p.y)*smoothstep(1.*stretch*life,.35*life,p.y);
        float core=smoothstep(wdt*.55,0.,abs(p.x))*smoothstep(-.95,-.6,p.y)*smoothstep(.25*life,-.4,p.y);
        float blue=smoothstep(wdt*.9,wdt*.2,abs(p.x))*smoothstep(-1.05,-.9,p.y)*smoothstep(-.55,-.85,p.y);
        vec3 col=vec3(1.,.42,.08)*body*1.2 + vec3(1.,.86,.55)*core*1.6 + vec3(.15,.25,.9)*blue*.5;
        float d=length(vec2(vUv.x-.5,(vUv.y-.42)*.9));
        float halo=exp(-d*d*28.)*.55 + exp(-d*d*6.)*.18;
        col+=vec3(1.,.55,.2)*halo*uHalo*life;
        gl_FragColor=vec4(col,1.);
      }`,
  });
}

// GPU particles: per-instance seed; trajectory is a pure function of uTime.
// mode 0 embers (rise, additive), 1 rain (streaks), 2 snow, 3 petals/paper bits, 4 dust motes
export function particleSystem(o) {
  const n = o.count;
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;
  const seeds = new Float32Array(n * 4);
  const r = rng(o.seed ?? 1);
  for (let i = 0; i < n; i++) {
    seeds[i * 4] = r();
    seeds[i * 4 + 1] = r();
    seeds[i * 4 + 2] = r();
    seeds[i * 4 + 3] = r();
  }
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geo.instanceCount = n;
  const u = {
    uTime: { value: 0 },
    uMode: { value: o.mode ?? 0 },
    uBox: { value: new THREE.Vector3(...(o.box || [20, 12, 6])) }, // w,h,depth
    uCenter: { value: new THREE.Vector3(...(o.center || [0, 0, 0])) },
    uSize: { value: o.size ?? 0.05 },
    uSpeed: { value: o.speed ?? 1.0 },
    uColor: { value: new THREE.Color(o.color ?? 0xff8a3a) },
    uOpacity: { value: o.opacity ?? 1.0 },
    uWind: { value: o.wind ?? 0.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; varying vec2 vUv; varying float vA; varying vec4 vS;
      uniform float uTime,uMode,uSize,uSpeed,uWind; uniform vec3 uBox,uCenter;
      void main(){
        vUv=uv; vS=aSeed; float t=uTime*uSpeed;
        vec3 p; float sx=uSize, sy=uSize; float a=1.; float rot=0.;
        if(uMode<0.5){ // embers rise
          float life=3.0+aSeed.w*4.0; float ph=fract(t/life+aSeed.z);
          p=vec3((aSeed.x-.5)*uBox.x + sin(t*.7+aSeed.y*30.)*.6*ph + uWind*ph*4., -uBox.y*.5 + ph*uBox.y, (aSeed.y-.5)*uBox.z);
          a=smoothstep(0.,.1,ph)*smoothstep(1.,.6,ph)*(.5+.5*sin(t*9.+aSeed.x*50.));
          sx=sy=uSize*(.4+aSeed.w);
        } else if(uMode<1.5){ // rain streaks
          float ph=fract(t*(1.2+aSeed.w*.6)+aSeed.z);
          p=vec3((aSeed.x-.5)*uBox.x - uWind*ph*2., uBox.y*.5 - ph*uBox.y, (aSeed.y-.5)*uBox.z);
          sx=uSize*.06; sy=uSize*(1.2+aSeed.w); a=.55+.45*aSeed.w; rot=uWind*.25;
        } else if(uMode<2.5){ // snow
          float ph=fract(t*.06*(.6+aSeed.w)+aSeed.z);
          p=vec3((aSeed.x-.5)*uBox.x + sin(t*.5+aSeed.y*20.)*.5 + uWind*ph*3., uBox.y*.5 - ph*uBox.y, (aSeed.y-.5)*uBox.z);
          sx=sy=uSize*(.35+aSeed.w*.9); a=smoothstep(0.,.05,ph)*smoothstep(1.,.92,ph);
        } else if(uMode<3.5){ // petals / paper bits drifting down & sideways
          float ph=fract(t*.05*(.6+aSeed.w)+aSeed.z);
          p=vec3((aSeed.x-.5)*uBox.x + ph*uBox.x*.35*uWind + sin(t*.9+aSeed.y*20.)*.4, uBox.y*.5 - ph*uBox.y, (aSeed.y-.5)*uBox.z);
          sx=uSize*(.6+aSeed.w*.6); sy=sx*.7; rot=t*(1.+aSeed.y*2.)+aSeed.x*6.28; a=smoothstep(0.,.05,ph)*smoothstep(1.,.9,ph);
          sy*= .35+.65*abs(sin(t*1.7+aSeed.w*9.));
        } else { // dust motes, slow brownian
          p=vec3((aSeed.x-.5)*uBox.x + sin(t*.13+aSeed.z*40.)*.4, (aSeed.y-.5)*uBox.y + sin(t*.11+aSeed.w*40.)*.3, (aSeed.z-.5)*uBox.z);
          sx=sy=uSize*(.3+aSeed.w); a=.35+.65*sin(t*.5+aSeed.x*30.)*.5+.3;
        }
        vA=a;
        vec4 mv=modelViewMatrix*vec4(p+uCenter,1.);
        float c=cos(rot),s=sin(rot);
        vec2 off=vec2(position.x*sx,position.y*sy); off=vec2(c*off.x-s*off.y,s*off.x+c*off.y);
        mv.xy+=off;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying float vA; varying vec4 vS; uniform vec3 uColor; uniform float uOpacity,uMode;
      void main(){
        vec2 p=vUv-.5; float a;
        if(uMode>.5&&uMode<1.5){ a=smoothstep(.5,.0,abs(p.x)*2.)*smoothstep(.5,.2,abs(p.y)); }
        else if(uMode>2.5&&uMode<3.5){ a=smoothstep(.5,.42,length(p*vec2(1.,1.3))); }
        else { float d=length(p); a=exp(-d*d*28.); }
        vec3 c=uColor*(uMode<0.5? (1.2+vS.x*.6):1.0);
        gl_FragColor=vec4(c, a*vA*uOpacity);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.userData.u = u;
  return mesh;
}

// ---------------------------------------------------------------- shot / stage
// A Stage is a three.js scene plus an update(t) function; the World schedules shots on a global clock.
export class Stage {
  constructor(world, opts = {}) {
    this.world = world;
    this.scene = new THREE.Scene();
    this.fov = opts.fov ?? 35;
    this.camera = new THREE.PerspectiveCamera(this.fov, 1920 / 1080, 0.1, 400);
    this.camera.position.set(0, 0, 10);
    this.updaters = [];
    this.timed = []; // uniforms that need uTime
    this.grade = Object.assign({ lift: [0, 0, 0], gain: [1, 1, 1], gamma: 1.0, sat: 1.0, exposure: 1.0 }, opts.grade || {});
  }
  // height of the frustum at distance d from the camera
  viewH(d) {
    return 2 * d * Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
  }
  // a quad that fills the frame at depth z (camera assumed at z=camZ), with overscan
  fillSize(z, camZ = 10, over = 1.2) {
    const h = this.viewH(camZ - z) * over;
    return [h * (16 / 9), h];
  }
  add(obj) {
    this.scene.add(obj);
    return obj;
  }
  onUpdate(fn) {
    this.updaters.push(fn);
  }
  // paper layer helper: tex may be null (solid sheet)
  layer(o) {
    const [fw, fh] = o.size || this.fillSize(o.z, o.camZ ?? 10, o.over ?? 1.25);
    const w = o.w ?? fw,
      h = o.h ?? (o.tex && o.keepAspect ? w * (o.tex.image.height / o.tex.image.width) : fh);
    const mat = paperMaterial(Object.assign({ map: o.tex, aspect: w / h }, o));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(o.x ?? 0, o.y ?? 0, o.z);
    if (o.flipX) mesh.scale.x = -1;
    this.add(mesh);
    this.timed.push(mat.uniforms);
    if (o.shadow && o.tex) {
      const st = o.shadowTex || blurredTex(o.tex, o.shadowBlur ?? 6);
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), shadowMaterial(st, o.shadow));
      const off = o.shadowOff || [0.06, -0.08];
      sm.position.set((o.x ?? 0) + off[0], (o.y ?? 0) + off[1], o.z - 0.02);
      if (o.flipX) sm.scale.x = -1;
      this.add(sm);
      mesh.userData.shadow = sm;
    }
    mesh.userData.u = mat.uniforms;
    return mesh;
  }
  sky(o) {
    const z = o.z ?? -80;
    const [w, h] = this.fillSize(z, 10, o.over ?? 1.4);
    const mat = skyMaterial(Object.assign({ aspect: w / h }, o));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(o.x ?? 0, o.y ?? 0, z);
    m.renderOrder = -10;
    this.add(m);
    this.timed.push(mat.uniforms);
    m.userData.u = mat.uniforms;
    return m;
  }
  smoke(o) {
    const [fw, fh] = this.fillSize(o.z, 10, o.over ?? 1.3);
    const w = o.w ?? fw,
      h = o.h ?? fh;
    const mat = smokeMaterial(Object.assign({ aspect: w / h }, o));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(o.x ?? 0, o.y ?? 0, o.z);
    this.add(m);
    this.timed.push(mat.uniforms);
    m.userData.u = mat.uniforms;
    return m;
  }
  flame(o) {
    const mat = flameMaterial(o);
    const s = o.size ?? 1;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.55, s), mat);
    m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    this.add(m);
    this.timed.push(mat.uniforms);
    m.userData.u = mat.uniforms;
    return m;
  }
  // additive radial burst: cannon / muzzle flashes, explosions, a magnesium flare. uAmt drives it.
  glow(o) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(o.color ?? 0xffc078) }, uAmt: { value: o.amt ?? 0 }, uCore: { value: o.core ?? 1.0 }, uTime: { value: 0 } },
      vertexShader: VERT,
      fragmentShader: /* glsl */ `${GLSL} varying vec2 vUv; uniform vec3 uColor; uniform float uAmt,uCore,uTime;
        void main(){ vec2 p=vUv-.5; float d=length(p);
          float a=atan(p.y,p.x); float rays=.75+.25*vnoise(vec2(a*6.,uTime*8.));
          float c=exp(-d*d*180.)*uCore*1.6 + exp(-d*d*26.)*.8*rays + exp(-d*d*5.)*.25;
          float edge=smoothstep(.5,.3,d);
          gl_FragColor=vec4((uColor*c*uAmt + vec3(1.)*exp(-d*d*600.)*uCore*uAmt)*edge, 1.); }`,
    });
    const s = o.size ?? 1;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), mat);
    m.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    this.add(m);
    this.timed.push(mat.uniforms);
    m.userData.u = mat.uniforms;
    return m;
  }
  // crepuscular rays: light breaking through smoke or mist from a source point (uv of the plane)
  rays(o) {
    const [fw, fh] = this.fillSize(o.z, 10, o.over ?? 1.4);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uSrc: { value: new THREE.Vector2(...(o.src || [0.6, 0.45])) }, uColor: { value: new THREE.Color(o.color ?? 0xffd8a0) }, uAmt: { value: o.amt ?? 0.5 }, uTime: { value: 0 }, uAspect: { value: fw / fh }, uSeed: { value: o.seed ?? 1 } },
      vertexShader: VERT,
      fragmentShader: /* glsl */ `${GLSL} varying vec2 vUv; uniform vec2 uSrc; uniform vec3 uColor; uniform float uAmt,uTime,uAspect,uSeed;
        void main(){ vec2 d=(vUv-uSrc)*vec2(uAspect,1.); float r=length(d); float a=atan(d.y,d.x);
          float b=vnoise(vec2(a*9.+uSeed, uTime*.05))*.65+vnoise(vec2(a*23.+uSeed*3., uTime*.08))*.35;
          b=smoothstep(.45,.9,b);
          float fall=exp(-r*1.6)*smoothstep(0.,.08,r);
          float core=exp(-r*r*40.)*.6;
          gl_FragColor=vec4(uColor*(b*fall+core)*uAmt,1.); }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), mat);
    m.position.set(o.x ?? 0, o.y ?? 0, o.z);
    this.add(m);
    this.timed.push(mat.uniforms);
    m.userData.u = mat.uniforms;
    return m;
  }
  particles(o) {
    const m = particleSystem(o);
    this.add(m);
    this.timed.push(m.userData.u);
    return m;
  }
  update(t, local, dur) {
    for (const u of this.timed) if (u.uTime) u.uTime.value = t;
    for (const f of this.updaters) f(local, dur, t);
  }
}

// ---------------------------------------------------------------- the world (one canvas, many shots)
export class World {
  constructor(canvas, shots) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(1920, 1080, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.rtA = new THREE.WebGLRenderTarget(1920, 1080, { samples: 4, type: THREE.HalfFloatType });
    this.rtB = new THREE.WebGLRenderTarget(1920, 1080, { samples: 4, type: THREE.HalfFloatType });
    this.shots = shots; // [{id,start,dur,build:(world)=>Stage, tin:{type,dur}, }]
    this.cache = new Map();
    this.order = [];
    this.post = this._makePost();
  }
  stage(shot) {
    if (!this.cache.has(shot.id)) {
      this.cache.set(shot.id, shot.build(this, shot));
      this.order.push(shot.id);
      while (this.order.length > 6) {
        const old = this.order.shift();
        const st = this.cache.get(old);
        this.cache.delete(old);
        st.scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            for (const v of Object.values(o.material.uniforms || {})) if (v.value && v.value.isTexture && !v.value.userData.keep) v.value.dispose();
            o.material.dispose();
          }
        });
      }
    } else {
      const i = this.order.indexOf(shot.id);
      this.order.splice(i, 1);
      this.order.push(shot.id);
    }
    return this.cache.get(shot.id);
  }
  _renderShot(shot, t, rt) {
    const st = this.stage(shot);
    const local = t - shot.start;
    st.update(t, local, shot.dur);
    this.renderer.setRenderTarget(rt);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.clear();
    this.renderer.render(st.scene, st.camera);
    return st;
  }
  render(t) {
    // active shots: the one containing t, plus the next if we are inside its incoming transition
    let cur = null,
      nxt = null;
    for (const s of this.shots) {
      if (t >= s.start && t < s.start + s.dur) cur = s;
    }
    if (cur) {
      for (const s of this.shots) {
        const td = s.tin?.dur ?? 0;
        if (s !== cur && td > 0 && t >= s.start - td && t < s.start) nxt = s;
      }
    }
    const P = this.post.uniforms;
    if (!cur) {
      P.uMix.value = 0;
      P.uA.value = null;
      this.renderer.setRenderTarget(null);
      this.renderer.setClearColor(0x000000, 1);
      this.renderer.clear();
      return;
    }
    const sa = this._renderShot(cur, t, this.rtA);
    P.uA.value = this.rtA.texture;
    this._setGrade(P, sa.grade, "A");
    P.uFadeA.value = this._fade(cur, t);
    if (nxt) {
      const sb = this._renderShot(nxt, t, this.rtB);
      P.uB.value = this.rtB.texture;
      this._setGrade(P, sb.grade, "B");
      const k = clamp((t - (nxt.start - nxt.tin.dur)) / nxt.tin.dur);
      P.uMix.value = nxt.tin.type === "cut" ? 0 : k;
      P.uMode.value = { dissolve: 0, burn: 1, black: 2, flash: 3 }[nxt.tin.type] ?? 0;
      P.uFadeB.value = this._fade(nxt, Math.max(t, nxt.start));
    } else {
      P.uMix.value = 0;
    }
    P.uTime.value = t;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);
  }
  _fade(s, t) {
    // fade from/to black at shot edges
    let f = 1;
    if (s.fadeIn) f *= sstep(s.start, s.start + s.fadeIn, t);
    if (s.fadeOut) f *= 1 - sstep(s.start + s.dur - s.fadeOut, s.start + s.dur, t);
    return f;
  }
  _setGrade(P, g, k) {
    P["uLift" + k].value.set(...g.lift);
    P["uGain" + k].value.set(...g.gain);
    P["uGamma" + k].value = g.gamma;
    P["uSat" + k].value = g.sat;
    P["uExp" + k].value = g.exposure;
  }
  _makePost() {
    const U = (v) => ({ value: v });
    const uniforms = {
      uA: U(null),
      uB: U(null),
      uMix: U(0),
      uMode: U(0),
      uTime: U(0),
      uFadeA: U(1),
      uFadeB: U(1),
      uLiftA: U(new THREE.Vector3()),
      uGainA: U(new THREE.Vector3(1, 1, 1)),
      uGammaA: U(1),
      uSatA: U(1),
      uExpA: U(1),
      uLiftB: U(new THREE.Vector3()),
      uGainB: U(new THREE.Vector3(1, 1, 1)),
      uGammaB: U(1),
      uSatB: U(1),
      uExpB: U(1),
      uGrain: U(0.05),
      uVignette: U(0.22),
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: /* glsl */ `
        ${GLSL}
        varying vec2 vUv; uniform sampler2D uA,uB; uniform float uMix,uMode,uTime,uFadeA,uFadeB,uGrain,uVignette;
        uniform vec3 uLiftA,uGainA,uLiftB,uGainB; uniform float uGammaA,uSatA,uExpA,uGammaB,uSatB,uExpB;
        vec3 grade(vec3 c, vec3 lift, vec3 gain, float gam, float sat, float ex){
          c*=ex; c=c*gain+lift*(1.-c); c=pow(max(c,0.),vec3(1./gam));
          float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,sat);
          return c;
        }
        vec3 tonemap(vec3 c){ return c/(1.+max(c-1.,0.)*.6); }
        void main(){
          vec3 a=grade(texture2D(uA,vUv).rgb,uLiftA,uGainA,uGammaA,uSatA,uExpA)*uFadeA;
          vec3 col=a;
          if(uMix>0.){
            vec3 b=grade(texture2D(uB,vUv).rgb,uLiftB,uGainB,uGammaB,uSatB,uExpB)*uFadeB;
            if(uMode<.5){ col=mix(a,b,smoothstep(0.,1.,uMix)); }
            else if(uMode<1.5){ // burn-through: paper chars from a seeded centre outward
              vec2 q=vec2(vUv.x*1.777,vUv.y);
              float n=fbm(q*3.)*.6+fbm(q*11.)*.25+length((vUv-vec2(.55,.45))*vec2(1.6,1.))*.55;
              float th=mix(-.05,1.25,uMix);
              float e=n-th;
              float hole=1.-smoothstep(-.005,.005,e);
              float edge=1.-smoothstep(0.,.07,abs(e));
              float charr=smoothstep(.0,.12,e)*(1.-smoothstep(.12,.3,e));
              col=mix(a*(1.-.85*(1.-smoothstep(0.,.14,e))),b,hole);
              col+=vec3(1.,.42,.08)*edge*(1.-hole)*2.5;
              col*= 1.-.0*charr;
            } else if(uMode<2.5){ // dip to black
              float k=uMix; col= k<.5? a*(1.-k*2.) : b*((k-.5)*2.);
            } else { col=mix(a,b,smoothstep(.0,1.,uMix)); col+=vec3(1.)*(1.-abs(uMix*2.-1.))*.6; }
          }
          col=tonemap(col);
          vec2 d=vUv-.5; d.x*=1.6;
          col*=1.-uVignette*smoothstep(.2,.95,length(d));
          float g=hash12(vUv*vec2(1920.,1080.)+fract(uTime*24.)*vec2(97.,13.))-.5;
          col+=g*uGrain*(.4+.6*(1.-dot(col,vec3(.33))));
          gl_FragColor=vec4(col,1.);
        }`,
      depthTest: false,
    });
    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return mat;
  }
}

export { THREE };
