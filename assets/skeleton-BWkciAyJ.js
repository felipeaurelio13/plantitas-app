import{z as o,r as i,j as e,m as h,K as I}from"./index-CV3zzXnm.js";/**
 * @license lucide-react v0.411.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("Droplets",[["path",{d:"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",key:"1ptgy4"}],["path",{d:"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",key:"1sl1rz"}]]);/**
 * @license lucide-react v0.411.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=o("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);/**
 * @license lucide-react v0.411.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=o("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.411.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=o("Wind",[["path",{d:"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2",key:"1k4u03"}],["path",{d:"M9.6 4.6A2 2 0 1 1 11 8H2",key:"b7d0fd"}],["path",{d:"M12.6 19.4A2 2 0 1 0 14 16H2",key:"1p5cb3"}]]),f=(t,{onIntersect:r,threshold:n=0,rootMargin:c="0px",once:l=!0})=>{i.useEffect(()=>{const a=t.current;if(!a)return;const s=new IntersectionObserver(([u])=>{u.isIntersecting&&(r(),l&&s.unobserve(a))},{threshold:n,rootMargin:c});return s.observe(a),()=>{s.unobserve(a)}},[t,r,n,c,l])},k=({src:t,alt:r,className:n="",placeholder:c="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+",onLoad:l,onError:a})=>{const[s,u]=i.useState(!1),[d,v]=i.useState(!1),[m,b]=i.useState(!1),g=i.useRef(null);f(g,{onIntersect:()=>b(!0),threshold:.1});const p=()=>{u(!0),l==null||l()},x=()=>{v(!0),a==null||a()};return e.jsxs("div",{ref:g,className:`relative overflow-hidden ${n}`,children:[!s&&!d&&e.jsx(h.img,{src:c,alt:"",className:"w-full h-full object-cover filter blur-sm",initial:{opacity:1},animate:{opacity:m?.5:1}}),m&&!d&&e.jsx(h.img,{src:t,alt:r,className:"w-full h-full object-cover",onLoad:p,onError:x,initial:{opacity:0},animate:{opacity:s?1:0},transition:{duration:.3}}),d&&e.jsx("div",{className:"w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"w-8 h-8 mx-auto mb-2 text-gray-400",children:e.jsx("svg",{fill:"currentColor",viewBox:"0 0 20 20",children:e.jsx("path",{fillRule:"evenodd",d:"M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z",clipRule:"evenodd"})})}),e.jsx("p",{className:"text-xs text-gray-500",children:"Error loading image"})]})}),m&&!s&&!d&&e.jsx("div",{className:"absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800",children:e.jsx("div",{className:"w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"})})]})};function S({className:t,...r}){return e.jsx("div",{className:I("animate-shimmer rounded-md","bg-[linear-gradient(110deg,var(--color-neutral-200)_8%,var(--color-neutral-300)_18%,var(--color-neutral-200)_33%)]","dark:bg-[linear-gradient(110deg,var(--color-neutral-800)_8%,var(--color-neutral-700)_18%,var(--color-neutral-800)_33%)]","bg-[length:200%_100%]",t),...r})}export{j as D,k as L,M,N as P,S,Z as W};
