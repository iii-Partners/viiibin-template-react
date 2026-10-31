// Ambient light, after the reference deck: two WebGL layers over the Northlight variant (any variant that sets --glow-on: 1).
//   The edge glow: soft light rises from the window's edges in the brand colors, turning slowly around the frame and
//   melting into the ground color as it fades inward. It sits beneath everything, so it shows only where the page is
//   open and, faintly, through the glass panels and the rail. In the deck the music drove it; here it breathes on a slow cycle and swells for a moment whenever the OS
//   records an event (a person acts, or an automation runs), so the light says the system is alive.
//   The aura: a faint, smoke-edged light that trails the cursor behind the glass panels, mixing the brand colors.
// Both are decoration (aria-hidden, no pointer events). Under reduced motion the glow holds still and the aura is off;
// the aura needs a mouse. Settings, Appearance turns both off. Without WebGL, nothing draws.
import { useEffect, useRef, useState } from 'react'
import { usePreferencesStore } from '@/stores/preferences'
import { useVariantStore } from '@/stores/variant'
import { useThemeStore } from '@/stores/theme'
import { useOs } from '@/os/store'

const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'
const HEADER = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

/** The deck's edge waves, softened and without the audio stream: the frame swells gently, colored by two rings of the
 *  palette, and its color eases into the ground's as its strength falls, so there is no edge where it ends. */
const EDGE = `${HEADER}
uniform vec2 u_size;
uniform float u_time, u_level, u_turn, u_fade, u_reach, u_strength, u_max;
uniform vec3 c1, c2, c3, c4, c5, c6, c7, c8, c9, u_ground;
const float TAU = 6.2831853;
vec3 ring(float x, vec3 a, vec3 b, vec3 c, vec3 d, vec3 e) {
  x = fract(x) * 5.0;
  vec3 k = mix(a, b, clamp(x, 0.0, 1.0));
  k = mix(k, c, clamp(x - 1.0, 0.0, 1.0));
  k = mix(k, d, clamp(x - 2.0, 0.0, 1.0));
  k = mix(k, e, clamp(x - 3.0, 0.0, 1.0));
  return mix(k, a, clamp(x - 4.0, 0.0, 1.0));
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = p - 0.5 * u_size;
  float d = min(min(p.x, u_size.x - p.x), min(p.y, u_size.y - p.y));
  float around = atan(q.y, q.x) / TAU + u_turn;
  float swell = 0.55 * sin(TAU * around * 3.0 + u_time * 0.23)
              + 0.30 * sin(TAU * around * 7.0 - u_time * 0.31 + 1.7)
              + 0.15 * sin(TAU * around * 13.0 + u_time * 0.47 + 4.1);
  float x = d / (u_reach * (1.0 + 0.35 * swell));
  if (x > 2.4) discard;
  // a long, eased falloff instead of the deck's ripple band: strongest at the edge, gone well before the content
  float fall = 1.0 - smoothstep(0.0, 2.4, x);
  fall = fall * fall * (3.0 - 2.0 * fall);
  float ripple = 0.5 + 0.5 * sin(x * 3.5 - u_time * 0.5 + swell * 1.2);
  float a = fall * (0.92 + 0.08 * ripple) * (0.65 + 0.35 * u_level) * u_fade * u_strength;
  a += (fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * (1.5 / 255.0);
  vec3 deep = ring(around, c1, c2, c4, c3, c5);
  vec3 bright = ring(around + 0.39, c6, c7, c9, c8, c3);
  vec3 col = mix(deep, bright, 0.45 + 0.15 * ripple);
  // the color itself fades toward the ground as the light weakens, so it blends in rather than stopping
  // the color eases into the ground early and never reaches full strength, so the light stays a soft wash
  col = mix(u_ground, col, smoothstep(0.0, 1.15, fall));
  a = clamp(a, 0.0, u_max);
  gl_FragColor = vec4(col * a, a);
}`

/** The deck's reading wisp, recolored: the trail field is warped by drifting noise, and its color drifts between the
 *  brand's warm, rose and cool lights. */
const AURA = `${HEADER}
uniform vec2 u_size;
uniform float u_time, u_strength;
uniform vec3 u_a, u_b, u_c;
uniform vec4 u_trail[20];
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.03 + 11.7) + 0.15 * noise(p * 4.01 - 5.3); }
void main() {
  vec2 p = vec2(gl_FragCoord.x, u_size.y - gl_FragCoord.y);
  vec2 q = p * 0.0055;
  vec2 warp = vec2(fbm(q + vec2(u_time * 0.07, 0.0)), fbm(q + vec2(5.2, -u_time * 0.06))) - 0.5;
  vec2 pw = p + warp * 70.0;
  float f = 0.0;
  for (int i = 0; i < 20; i++) {
    vec4 t = u_trail[i];
    if (t.w <= 0.001) continue;
    vec2 d = pw - t.xy;
    f += t.w * exp(-dot(d, d) / (t.z * t.z));
  }
  float a = smoothstep(0.05, 1.1, f) * u_strength;
  float m = fbm(q * 0.8 + vec2(u_time * 0.05, -u_time * 0.04));
  vec3 col = mix(mix(u_a, u_b, smoothstep(0.25, 0.6, m)), u_c, smoothstep(0.55, 0.85, m));
  gl_FragColor = vec4(col * a, a);
}`

function program(gl: WebGLRenderingContext, frag: string) {
  const shader = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  return prog
}

const rgb = (name: string): [number, number, number] => {
  const n = parseInt(getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', ''), 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
/** A fresh canvas for one run of an effect, appended to the host and removed on cleanup with its context released.
 *  (React runs effects twice in development; a canvas reused across runs would hand back a lost context.) */
function mount(host: HTMLElement, className: string) {
  const canvas = document.createElement('canvas')
  canvas.className = className
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl', GL_OPTS)
  const drop = () => { gl?.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove() }
  return { canvas, gl, drop }
}

/** Frame-rate independent easing toward a target, with time constant tau in seconds. */
const ease = (cur: number, to: number, dt: number, tau: number) => cur + (to - cur) * (1 - Math.exp(-dt / tau))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const GL_OPTS: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }

/** How bright the edge glow burns. strength scales the light in each theme (dark is lower, because colored light on a
 *  dark ground reads stronger); maxAlpha is the most opaque the light may get at the very edge, so a swell brightens
 *  it without turning it into paint; reach scales how far it extends inward, cap included (1 is the usual reach).
 *  Every level keeps the color easing into the ground, so a brighter glow still has no edge where it ends. */
export type Glow = { strength?: { light: number; dark: number }; maxAlpha?: number; reach?: number }
const GLOW = { strength: { light: 0.36, dark: 0.22 }, maxAlpha: 0.4, reach: 1 }

function EdgeGlow({ glow }: { glow?: Glow }) {
  const ref = useRef<HTMLSpanElement>(null)
  const { light, dark } = glow?.strength ?? GLOW.strength
  const maxAlpha = glow?.maxAlpha ?? GLOW.maxAlpha
  const scale = glow?.reach ?? GLOW.reach
  useEffect(() => {
    const { canvas, gl, drop } = mount(ref.current!, 'pointer-events-none fixed inset-0 z-0 h-full w-full')
    if (!gl) return drop
    let prog: WebGLProgram
    try { prog = program(gl, EDGE) } catch { return drop }
    const u = (n: string) => gl.getUniformLocation(prog, n)
    for (let i = 1; i <= 9; i++) gl.uniform3f(u(`c${i}`), ...rgb(`--glow-${i}`))
    gl.uniform3f(u('u_ground'), ...rgb('--ground'))
    gl.uniform1f(u('u_strength'), document.documentElement.classList.contains('dark') ? dark : light)
    gl.uniform1f(u('u_max'), maxAlpha)
    let raf = 0, last = 0, t = 0, level = 0.35, fade = 0, reach = 0, turn = 0, bump = 0, skip = false
    // a new event in the OS swells the light for a moment
    let seen = useOs.getState().events.length
    const unsub = useOs.subscribe((s) => { if (s.events.length > seen) bump = 1; seen = s.events.length })
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      skip = !skip
      if (skip && !reduced()) return // 30 frames a second is plenty for light this soft
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 30
      last = now
      const w = document.documentElement.clientWidth, h = document.documentElement.clientHeight, short = Math.min(w, h)
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h) }
      const still = reduced()
      if (!still) { t = (t + dt * (0.5 + 0.6 * level)) % 1000; turn = (turn + dt * 0.006) % 1 }
      bump = ease(bump, 0, dt, 1.6)
      const breath = 0.32 + 0.12 * Math.sin(t * 0.35)
      level = ease(level, still ? 0.3 : Math.min(1, breath + 0.4 * bump), dt, 0.8)
      fade = ease(fade, 1, dt, 1.4)
      // a band at the edge: about 7% of the window's short side, capped so a large window never floods
      reach = ease(reach || short * 0.06 * scale, Math.min(110 * scale, short * (0.06 + 0.06 * level) * scale), dt, 1.1)
      gl.uniform2f(u('u_size'), w, h)
      gl.uniform1f(u('u_time'), t)
      gl.uniform1f(u('u_level'), level)
      gl.uniform1f(u('u_turn'), turn)
      gl.uniform1f(u('u_reach'), reach)
      gl.uniform1f(u('u_fade'), fade * fade * (3 - 2 * fade))
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); unsub(); drop() }
  }, [light, dark, maxAlpha, scale])
  return <span ref={ref} className="contents" />
}

function Aura() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (reduced() || !matchMedia('(hover: hover)').matches) return
    const { canvas, gl, drop } = mount(ref.current!, 'pointer-events-none fixed inset-0 z-0 h-full w-full')
    if (!gl) return drop
    let prog: WebGLProgram
    try { prog = program(gl, AURA) } catch { return drop }
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const dark = document.documentElement.classList.contains('dark')
    // warm sun, rose and sky: the palette's lighter tints, so the aura reads as light, not paint
    gl.uniform3f(u('u_a'), ...rgb('--glow-9'))
    gl.uniform3f(u('u_b'), ...rgb('--glow-6'))
    gl.uniform3f(u('u_c'), ...rgb('--glow-8'))
    gl.uniform1f(u('u_strength'), dark ? 0.14 : 0.16)
    const N = 20, CORE = 120
    const trail: { x: number; y: number; r: number; s: number }[] = []
    let target: { x: number; y: number } | null = null, head: { x: number; y: number } | null = null
    let present = 0, presentTarget = 0, lastSample = 0, last = 0, t = 0, raf = 0
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      t += dt
      const w = canvas.clientWidth, h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h) }
      let moving = false
      if (target) {
        if (!head) head = { ...target }
        const hx = ease(head.x, target.x, dt, 0.16), hy = ease(head.y, target.y, dt, 0.16)
        moving = Math.abs(hx - head.x) + Math.abs(hy - head.y) > 0.3
        head = { x: hx, y: hy }
      }
      present = ease(present, presentTarget, dt, 0.45)
      if (head && moving && now - lastSample > 30) {
        trail.unshift({ x: head.x, y: head.y, r: CORE * 0.8, s: 0.9 })
        lastSample = now
        if (trail.length > N - 1) trail.pop()
      }
      trail.forEach((p) => { p.s *= Math.exp(-dt / 0.55); p.r += dt * 45 })
      while (trail.length && trail[trail.length - 1].s < 0.01) trail.pop()
      const data = new Float32Array(N * 4)
      if (head) data.set([head.x, head.y, CORE, present], 0)
      trail.forEach((p, i) => data.set([p.x, p.y, p.r, p.s * present], (i + 1) * 4))
      gl.uniform2f(u('u_size'), w, h)
      gl.uniform1f(u('u_time'), t)
      gl.uniform4fv(u('u_trail'), data)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      // keep drawing only while something moves or fades
      raf = moving || trail.length || Math.abs(present - presentTarget) > 0.004 ? requestAnimationFrame(frame) : 0
    }
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame) } }
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; target = { x: e.clientX, y: e.clientY }; presentTarget = 1; kick() }
    const onLeave = () => { presentTarget = 0; kick() }
    addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      drop()
    }
  }, [])
  return <span ref={ref} className="contents" />
}

/** Mounts the ambient light when the variant asks for it (--glow-on: 1) and the viewer has not turned it off. Keyed by
 *  variant and theme, so the colors are read again when either changes. glow sets the edge glow's brightness; without
 *  it the glow burns at its usual level. */
export function Ambient({ glow }: { glow?: Glow } = {}) {
  const on = usePreferencesStore((s) => s.ambient)
  const variant = useVariantStore((s) => s.id)
  const mode = useThemeStore((s) => s.mode)
  const [lit, setLit] = useState(false)
  useEffect(() => {
    // read after the variant's attribute and the theme's class have applied
    const id = requestAnimationFrame(() => setLit(on && getComputedStyle(document.documentElement).getPropertyValue('--glow-on').trim() === '1'))
    return () => cancelAnimationFrame(id)
  }, [on, variant, mode])
  if (!lit) return null
  return (
    <span key={`${variant}-${mode}`} className="contents">
      <EdgeGlow glow={glow} />
      <Aura />
    </span>
  )
}
