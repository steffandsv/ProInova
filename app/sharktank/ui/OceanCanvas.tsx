"use client";

import { useEffect, useRef } from "react";

/**
 * Oceano em WebGL (shader próprio, sem biblioteca):
 * cáusticas + raios de luz da superfície + neve marinha que vira bioluminescência,
 * escurecendo conforme a pessoa "mergulha" (rola) a página. O mouse vira uma lanterna.
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uDepth;
uniform vec2 uMouse;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p; float c = 1.0; float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

float rays(vec2 uv, float t, float aspect){
  vec2 src = vec2(0.5 + 0.12 * sin(t * 0.07), 1.3);
  vec2 d = vec2((uv.x - src.x) * aspect, uv.y - src.y);
  float ang = atan(d.x, -d.y);
  float r = noise(vec2(ang * 13.0, t * 0.12)) * 0.6 + noise(vec2(ang * 29.0 + 3.0, -t * 0.08)) * 0.4;
  r = smoothstep(0.42, 0.95, r);
  return r * smoothstep(1.8, 0.15, length(d));
}

float snow(vec2 uv, float scale, float speed, float t, float seed){
  uv *= scale;
  uv.y += t * speed;
  uv.x += sin(uv.y * 0.35 + seed) * 0.35;
  vec2 id = floor(uv);
  vec2 f = fract(uv) - 0.5;
  float h = hash(id + seed);
  vec2 off = (vec2(hash(id + seed + 1.3), hash(id + seed + 2.7)) - 0.5) * 0.6;
  float d = length(f - off);
  float s = mix(0.03, 0.085, hash(id + seed + 4.1));
  float tw = 0.55 + 0.45 * sin(t * 1.7 + h * 40.0);
  return step(0.74, h) * smoothstep(s, 0.0, d) * tw;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime;
  float dep = uDepth;

  vec3 surf = vec3(0.02, 0.33, 0.50);
  vec3 mid  = vec3(0.008, 0.11, 0.21);
  vec3 deep = vec3(0.0, 0.018, 0.045);
  vec3 top = mix(surf, mid, smoothstep(0.0, 0.42, dep));
  top = mix(top, deep, smoothstep(0.42, 1.0, dep));
  vec3 bottom = mix(mid * 0.5, deep, smoothstep(0.0, 0.55, dep));
  bottom = mix(bottom, vec3(0.0, 0.005, 0.014), smoothstep(0.5, 1.0, dep));
  vec3 col = mix(bottom, top, pow(uv.y, 1.25));

  float light = 1.0 - smoothstep(0.0, 0.75, dep);

  vec2 cuv = vec2(uv.x * aspect, uv.y) * 0.5 + vec2(0.0, dep * 1.4);
  float c = caustic(cuv, t * 0.33);
  col += vec3(0.35, 0.85, 1.0) * c * 0.24 * light * (0.3 + 0.7 * uv.y);

  col += vec3(0.42, 0.84, 1.0) * rays(uv, t, aspect) * 0.21 * light;

  vec2 puv = vec2(uv.x * aspect, uv.y) + vec2(0.0, dep * 2.4);
  float s1 = snow(puv, 13.0, 0.025, t, 1.0);
  float s2 = snow(puv + vec2(3.1, 0.0), 25.0, 0.04, t, 7.0);
  float s3 = snow(puv + vec2(7.7, 0.0), 6.5, 0.015, t, 13.0);
  float bio = smoothstep(0.35, 0.85, dep);
  vec3 snowCol = mix(vec3(0.72, 0.9, 1.0), vec3(0.2, 1.0, 0.92), bio);
  col += snowCol * (s1 * 0.5 + s2 * 0.32 + s3 * 0.85) * mix(0.2, 0.62, bio);

  vec2 m = vec2((uv.x - uMouse.x) * aspect, uv.y - uMouse.y);
  col += vec3(0.04, 0.26, 0.34) * exp(-dot(m, m) * 6.0) * (0.22 + 0.78 * bio);

  vec2 v = uv - 0.5;
  col *= 1.0 - dot(v, v) * 0.85;
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * (2.0 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compilar(gl: WebGLRenderingContext, tipo: number, fonte: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("[ocean] shader:", gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export default function OceanCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
    if (!gl || gl.isContextLost()) {
      canvas.dataset.fallback = "1";
      return;
    }
    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.dataset.fallback = "1";
      return;
    }
    delete canvas.dataset.fallback;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uDepth = gl.getUniformLocation(prog, "uDepth");
    const uMouse = gl.getUniformLocation(prog, "uMouse");

    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const celular = window.matchMedia("(max-width: 760px)").matches;
    // Água é macia: renderizar em resolução menor e ampliar via CSS custa pouco e fica igual.
    const escala = (celular ? 0.42 : 0.55) * Math.min(window.devicePixelRatio || 1, 1.5);

    function redimensionar() {
      canvas!.width = Math.max(2, Math.round(window.innerWidth * escala));
      canvas!.height = Math.max(2, Math.round(window.innerHeight * escala));
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
    }
    redimensionar();
    window.addEventListener("resize", redimensionar);

    let alvoProf = 0, prof = 0;
    const mouse = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6 };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      alvoProf = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };
    onScroll();
    prof = alvoProf;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0, ultimo = 0;
    const inicio = performance.now();
    const intervalo = celular ? 1000 / 30 : 0;

    function quadro(agora: number) {
      raf = requestAnimationFrame(quadro);
      if (document.hidden) return;
      if (intervalo && agora - ultimo < intervalo) return;
      ultimo = agora;
      prof += (alvoProf - prof) * 0.06;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl!.uniform1f(uTime, movimentoReduzido ? 12 : (agora - inicio) / 1000);
      gl!.uniform1f(uDepth, prof);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(quadro);
    canvas.dataset.pronto = "1";

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", redimensionar);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      // não destruir o contexto: o React (modo estrito) remonta o componente no mesmo canvas
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={ref} className="st-ocean" aria-hidden />;
}
