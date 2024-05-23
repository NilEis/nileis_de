
var lua_wasm = (() => {
  var _scriptName =
      typeof document != 'undefined' ? document.currentScript?.src : undefined;

  return (function(moduleArg = {}) {
    var moduleRtn;

    var f = Object.assign({}, moduleArg), k, t, aa = new Promise((a, b) => {
                                                  k = a;
                                                  t = b
                                                });
    if ('undefined' === typeof SharedArrayBuffer) {
      const a = new WebAssembly.Memory({initial: 0, maximum: 0, X: !0});
      globalThis.SharedArrayBuffer = a.buffer.constructor
    }
    f = {
      print: a => {
        const b = document.getElementById('output');
        1 < a.length && (a = Array.prototype.slice.call(a).join(''));
        console.log('log: ' + a);
        b && (b.innerText += a + '\n')
      }
    };
    f.printErr = f.print;
    var ba = Object.assign({}, f), ca = './this.program', v = (a, b) => {
      throw b;
    }, x = '';
    'undefined' != typeof document && document.currentScript &&
        (x = document.currentScript.src);
    _scriptName && (x = _scriptName);
    x.startsWith('blob:') ?
        x = '' :
        x = x.substr(0, x.replace(/[?#].*/, '').lastIndexOf('/') + 1);
    var da = f.print || console.log.bind(console),
        y = f.printErr || console.error.bind(console);
    Object.assign(f, ba);
    ba = null;
    f.thisProgram && (ca = f.thisProgram);
    f.quit && (v = f.quit);
    var z;
    f.wasmBinary && (z = f.wasmBinary);
    var A, C = !1, D, E, F, G;
    function ea() {
      var a = A.buffer;
      f.HEAP8 = D = new Int8Array(a);
      f.HEAP16 = new Int16Array(a);
      f.HEAPU8 = E = new Uint8Array(a);
      f.HEAPU16 = new Uint16Array(a);
      f.HEAP32 = F = new Int32Array(a);
      f.HEAPU32 = G = new Uint32Array(a);
      f.HEAPF32 = new Float32Array(a);
      f.HEAPF64 = new Float64Array(a)
    }
    var fa = [], ha = [], ia = [], ja = [];
    function ka() {
      var a = f.preRun.shift();
      fa.unshift(a)
    }
    var H = 0, J = null, K = null;
    function la(a) {
      f.onAbort?.(a);
      a = 'Aborted(' + a + ')';
      y(a);
      C = !0;
      a = new WebAssembly.RuntimeError(
          a + '. Build with -sASSERTIONS for more info.');
      t(a);
      throw a;
    }
    var ma = a => a.startsWith('data:application/octet-stream;base64,'), L;
    function na(a) {
      if (a == L && z) return new Uint8Array(z);
      throw 'both async and sync fetching of the wasm failed';
    }
    function oa(a) {
      return z || 'function' != typeof fetch ?
          Promise.resolve().then(() => na(a)) :
          fetch(a, {credentials: 'same-origin'})
              .then(b => {
                if (!b.ok) throw `failed to load wasm binary file at '${a}'`;
                return b.arrayBuffer()
              })
              .catch(() => na(a))
    }
    function pa(a, b, c) {
      return oa(a).then(e => WebAssembly.instantiate(e, b)).then(c, e => {
        y(`failed to asynchronously prepare wasm: ${e}`);
        la(e)
      })
    }
    function qa(a, b) {
      var c = L;
      return z || 'function' != typeof WebAssembly.instantiateStreaming ||
              ma(c) || 'function' != typeof fetch ?
          pa(c, a, b) :
          fetch(c, {credentials: 'same-origin'})
              .then(
                  e => WebAssembly.instantiateStreaming(e, a).then(
                      b, function(g) {
                        y(`wasm streaming compile failed: ${g}`);
                        y('falling back to ArrayBuffer instantiation');
                        return pa(c, a, b)
                      }))
    }
    var M;
    function ra(a) {
      this.name = 'ExitStatus';
      this.message = `Program terminated with exit(${a})`;
      this.status = a
    }
    var N =
            a => {
              for (; 0 < a.length;) a.shift()(f)
            },
        sa = f.noExitRuntime || !0,
        ta = 'undefined' != typeof TextDecoder ? new TextDecoder('utf8') :
                                                 void 0,
        O =
            (a, b) => {
              for (var c = b + NaN, e = b; a[e] && !(e >= c);) ++e;
              if (16 < e - b && a.buffer && ta)
                return ta.decode(a.subarray(b, e));
              for (c = ''; b < e;) {
                var g = a[b++];
                if (g & 128) {
                  var h = a[b++] & 63;
                  if (192 == (g & 224))
                    c += String.fromCharCode((g & 31) << 6 | h);
                  else {
                    var n = a[b++] & 63;
                    g = 224 == (g & 240) ?
                        (g & 15) << 12 | h << 6 | n :
                        (g & 7) << 18 | h << 12 | n << 6 | a[b++] & 63;
                    65536 > g ? c += String.fromCharCode(g) :
                                (g -= 65536,
                                 c += String.fromCharCode(
                                     55296 | g >> 10, 56320 | g & 1023))
                  }
                } else
                  c += String.fromCharCode(g)
              }
              return c
            },
        P = a => 0 === a % 4 && (0 !== a % 100 || 0 === a % 400),
        ua = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335],
        va = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
        Q =
            (a, b, c, e) => {
              if (0 < e) {
                e = c + e - 1;
                for (var g = 0; g < a.length; ++g) {
                  var h = a.charCodeAt(g);
                  if (55296 <= h && 57343 >= h) {
                    var n = a.charCodeAt(++g);
                    h = 65536 + ((h & 1023) << 10) | n & 1023
                  }
                  if (127 >= h) {
                    if (c >= e) break;
                    b[c++] = h
                  } else {
                    if (2047 >= h) {
                      if (c + 1 >= e) break;
                      b[c++] = 192 | h >> 6
                    } else {
                      if (65535 >= h) {
                        if (c + 2 >= e) break;
                        b[c++] = 224 | h >> 12
                      } else {
                        if (c + 3 >= e) break;
                        b[c++] = 240 | h >> 18;
                        b[c++] = 128 | h >> 12 & 63
                      }
                      b[c++] = 128 | h >> 6 & 63
                    }
                    b[c++] = 128 | h & 63
                  }
                }
                b[c] = 0
              }
            },
        R = {},
        xa =
            () => {
              if (!S) {
                var a = {
                  USER: 'web_user',
                  LOGNAME: 'web_user',
                  PATH: '/',
                  PWD: '/',
                  HOME: '/home/web_user',
                  LANG: ('object' == typeof navigator && navigator.languages &&
                             navigator.languages[0] ||
                         'C')
                            .replace('-', '_') +
                      '.UTF-8',
                  _: ca || './this.program'
                },
                    b;
                for (b in R) void 0 === R[b] ? delete a[b] : a[b] = R[b];
                var c = [];
                for (b in a) c.push(`${b}=${a[b]}`);
                S = c
              }
              return S
            },
        S, T = 0,
        ya =
            a => {
              sa || 0 < T || (f.onExit?.(a), C = !0);
              v(a, new ra(a))
            },
        za = [null, [], []],
        Aa = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        Ba = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], U = a => {
          for (var b = 0, c = 0; c < a.length; ++c) {
            var e = a.charCodeAt(c);
            127 >= e                     ? b++ :
                2047 >= e                ? b += 2 :
                55296 <= e && 57343 >= e ? (b += 4, ++c) :
                                           b += 3
          }
          return b
        };
    function Ca(a) {
      var b = Array(U(a) + 1);
      Q(a, b, 0, b.length);
      return b
    }
    function Da() {
      var a = V, b = {};
      for (let [c, e] of Object.entries(a))
        b[c] = 'function' == typeof e ? (...g) => {
          Ea.push(c);
          try {
            return e(...g)
          } finally {
            C || Ea.pop()
          }
        } : e;
      return b
    }
    var Ea = [],
        Fa =
            (a, b, c, e, g) => {
              var h = {
                string: l => {
                  var w = 0;
                  if (null !== l && void 0 !== l && 0 !== l) {
                    w = U(l) + 1;
                    var I = W(w);
                    Q(l, E, I, w);
                    w = I
                  }
                  return w
                },
                array: l => {
                  var w = W(l.length);
                  D.set(l, w);
                  return w
                }
              };
              a = f['_' + a];
              var n = [], u = 0;
              if (e)
                for (var q = 0; q < e.length; q++) {
                  var r = h[c[q]];
                  r ? (0 === u && (u = X()), n[q] = r(e[q])) : n[q] = e[q]
                }
              c = a(...n);
              g = g?.async;
              T += 1;
              c = function(l) {
                --T;
                0 !== u && Y(u);
                return 'string' === b ? l ? O(E, l) : '' :
                    'boolean' === b   ? !!l :
                                        l
              }(c);
              return g ? Promise.resolve(c) : c
            },
        Ia = {
          v: () => {},
          c: function() {
            return 0
          },
          y: function() {
            return 0
          },
          d: function() {},
          r: () => {},
          s: () => {},
          e: () => {},
          h: () => {la('')},
          f: () => 1,
          g: (a, b, c) => E.copyWithin(a, b, b + c),
          q: a => a ? -52 : 0,
          m: () => {
            throw Infinity;
          },
          i: function(a, b, c) {
            a = new Date(
                1E3 *
                (b + 2097152 >>> 0 < 4194305 - !!a ?
                     (a >>> 0) + 4294967296 * b :
                     NaN));
            F[c >> 2] = a.getUTCSeconds();
            F[c + 4 >> 2] = a.getUTCMinutes();
            F[c + 8 >> 2] = a.getUTCHours();
            F[c + 12 >> 2] = a.getUTCDate();
            F[c + 16 >> 2] = a.getUTCMonth();
            F[c + 20 >> 2] = a.getUTCFullYear() - 1900;
            F[c + 24 >> 2] = a.getUTCDay();
            F[c + 28 >> 2] =
                (a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) /
                    864E5 |
                0
          },
          j: function(a, b, c) {
            a = new Date(
                1E3 *
                (b + 2097152 >>> 0 < 4194305 - !!a ?
                     (a >>> 0) + 4294967296 * b :
                     NaN));
            F[c >> 2] = a.getSeconds();
            F[c + 4 >> 2] = a.getMinutes();
            F[c + 8 >> 2] = a.getHours();
            F[c + 12 >> 2] = a.getDate();
            F[c + 16 >> 2] = a.getMonth();
            F[c + 20 >> 2] = a.getFullYear() - 1900;
            F[c + 24 >> 2] = a.getDay();
            F[c + 28 >> 2] =
                (P(a.getFullYear()) ? ua : va)[a.getMonth()] + a.getDate() - 1 |
                0;
            F[c + 36 >> 2] = -(60 * a.getTimezoneOffset());
            b = (new Date(a.getFullYear(), 6, 1)).getTimezoneOffset();
            var e = (new Date(a.getFullYear(), 0, 1)).getTimezoneOffset();
            F[c + 32 >> 2] =
                (b != e && a.getTimezoneOffset() == Math.min(e, b)) | 0
          },
          k: function(a) {
            var b = new Date(
                    F[a + 20 >> 2] + 1900, F[a + 16 >> 2], F[a + 12 >> 2],
                    F[a + 8 >> 2], F[a + 4 >> 2], F[a >> 2], 0),
                c = F[a + 32 >> 2], e = b.getTimezoneOffset(),
                g = (new Date(b.getFullYear(), 6, 1)).getTimezoneOffset(),
                h = (new Date(b.getFullYear(), 0, 1)).getTimezoneOffset(),
                n = Math.min(h, g);
            0 > c ? F[a + 32 >> 2] = Number(g != h && n == e) :
                    0 < c != (n == e) &&
                    (g = Math.max(h, g),
                     b.setTime(b.getTime() + 6E4 * ((0 < c ? n : g) - e)));
            F[a + 24 >> 2] = b.getDay();
            F[a + 28 >> 2] =
                (P(b.getFullYear()) ? ua : va)[b.getMonth()] + b.getDate() - 1 |
                0;
            F[a >> 2] = b.getSeconds();
            F[a + 4 >> 2] = b.getMinutes();
            F[a + 8 >> 2] = b.getHours();
            F[a + 12 >> 2] = b.getDate();
            F[a + 16 >> 2] = b.getMonth();
            F[a + 20 >> 2] = b.getYear();
            a = b.getTime();
            a = isNaN(a) ? -1 : a / 1E3;
            Ga((M = a,
                1 <= +Math.abs(M) ?
                    0 < M ?
                    +Math.floor(M / 4294967296) >>> 0 :
                    ~~+Math.ceil((M - +(~~M >>> 0)) / 4294967296) >>> 0 :
                    0));
            return a >>> 0
          },
          o: (a, b, c, e) => {
            var g = (new Date).getFullYear(), h = new Date(g, 0, 1),
                n = new Date(g, 6, 1);
            g = h.getTimezoneOffset();
            var u = n.getTimezoneOffset();
            G[a >> 2] = 60 * Math.max(g, u);
            F[b >> 2] = Number(g != u);
            a = q => q.toLocaleTimeString(void 0, {
                        hour12: !1,
                        timeZoneName: 'short'
                      }).split(' ')[1];
            h = a(h);
            n = a(n);
            u < g ? (Q(h, E, c, 17), Q(n, E, e, 17)) :
                    (Q(h, E, e, 17), Q(n, E, c, 17))
          },
          a: () => Date.now(),
          n: a => {
            var b = E.length;
            a >>>= 0;
            if (2147483648 < a) return !1;
            for (var c = 1; 4 >= c; c *= 2) {
              var e = b * (1 + .2 / c);
              e = Math.min(e, a + 100663296);
              var g = Math;
              e = Math.max(a, e);
              a: {
                g = (g.min.call(
                         g, 2147483648, e + (65536 - e % 65536) % 65536) -
                     A.buffer.byteLength + 65535) /
                    65536;
                try {
                  A.grow(g);
                  ea();
                  var h = 1;
                  break a
                } catch (n) {} h = void 0
              } if (h) return !0
            }
            return !1
          },
          t: (a, b) => {
            var c = 0;
            xa().forEach((e, g) => {
              var h = b + c;
              g = G[a + 4 * g >> 2] = h;
              for (h = 0; h < e.length; ++h) D[g++] = e.charCodeAt(h);
              D[g] = 0;
              c += e.length + 1
            });
            return 0
          },
          u: (a, b) => {
            var c = xa();
            G[a >> 2] = c.length;
            var e = 0;
            c.forEach(g => e += g.length + 1);
            G[b >> 2] = e;
            return 0
          },
          p: a => {ya(a)},
          b: () => 52,
          x: () => 52,
          l: function() {
            return 70
          },
          w: (a, b, c, e) => {
            for (var g = 0, h = 0; h < c; h++) {
              var n = G[b >> 2], u = G[b + 4 >> 2];
              b += 8;
              for (var q = 0; q < u; q++) {
                var r = E[n + q], l = za[a];
                0 === r || 10 === r ?
                    ((1 === a ? da : y)(O(l, 0)), l.length = 0) :
                    l.push(r)
              }
              g += u
            }
            G[e >> 2] = g;
            return 0
          },
          A: Ha,
          z: (a, b, c, e) => {
            function g(d, m, p) {
              for (d = 'number' == typeof d ? d.toString() : d || '';
                   d.length < m;)
                d = p[0] + d;
              return d
            }
            function h(d, m) {
              return g(d, m, '0')
            }
            function n(d, m) {
              function p(wa) {
                return 0 > wa ? -1 : 0 < wa ? 1 : 0
              }
              var B;
              0 === (B = p(d.getFullYear() - m.getFullYear())) &&
                  0 === (B = p(d.getMonth() - m.getMonth())) &&
                  (B = p(d.getDate() - m.getDate()));
              return B
            }
            function u(d) {
              switch (d.getDay()) {
                case 0:
                  return new Date(d.getFullYear() - 1, 11, 29);
                case 1:
                  return d;
                case 2:
                  return new Date(d.getFullYear(), 0, 3);
                case 3:
                  return new Date(d.getFullYear(), 0, 2);
                case 4:
                  return new Date(d.getFullYear(), 0, 1);
                case 5:
                  return new Date(d.getFullYear() - 1, 11, 31);
                case 6:
                  return new Date(d.getFullYear() - 1, 11, 30)
              }
            }
            function q(d) {
              var m = d.G;
              for (d = new Date((new Date(d.O + 1900, 0, 1)).getTime());
                   0 < m;) {
                var p = d.getMonth(), B = (P(d.getFullYear()) ? Aa : Ba)[p];
                if (m > B - d.getDate())
                  m -= B - d.getDate() + 1, d.setDate(1),
                      11 > p ?
                      d.setMonth(p + 1) :
                      (d.setMonth(0), d.setFullYear(d.getFullYear() + 1));
                else {
                  d.setDate(d.getDate() + m);
                  break
                }
              }
              p = new Date(d.getFullYear() + 1, 0, 4);
              m = u(new Date(d.getFullYear(), 0, 4));
              p = u(p);
              return 0 >= n(m, d) ?
                  0 >= n(p, d) ? d.getFullYear() + 1 : d.getFullYear() :
                  d.getFullYear() - 1
            }
            var r = G[e + 40 >> 2];
            e = {
              V: F[e >> 2],
              U: F[e + 4 >> 2],
              P: F[e + 8 >> 2],
              S: F[e + 12 >> 2],
              R: F[e + 16 >> 2],
              O: F[e + 20 >> 2],
              F: F[e + 24 >> 2],
              G: F[e + 28 >> 2],
              Y: F[e + 32 >> 2],
              T: F[e + 36 >> 2],
              W: r ? r ? O(E, r) : '' : ''
            };
            c = c ? O(E, c) : '';
            r = {
              '%c': '%a %b %d %H:%M:%S %Y',
              '%D': '%m/%d/%y',
              '%F': '%Y-%m-%d',
              '%h': '%b',
              '%r': '%I:%M:%S %p',
              '%R': '%H:%M',
              '%T': '%H:%M:%S',
              '%x': '%m/%d/%y',
              '%X': '%H:%M:%S',
              '%Ec': '%c',
              '%EC': '%C',
              '%Ex': '%m/%d/%y',
              '%EX': '%H:%M:%S',
              '%Ey': '%y',
              '%EY': '%Y',
              '%Od': '%d',
              '%Oe': '%e',
              '%OH': '%H',
              '%OI': '%I',
              '%Om': '%m',
              '%OM': '%M',
              '%OS': '%S',
              '%Ou': '%u',
              '%OU': '%U',
              '%OV': '%V',
              '%Ow': '%w',
              '%OW': '%W',
              '%Oy': '%y'
            };
            for (var l in r) c = c.replace(new RegExp(l, 'g'), r[l]);
            var w = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'
                        .split(' '),
                I = 'January February March April May June July August September October November December'
                        .split(' ');
            r = {
              '%a': d => w[d.F].substring(0, 3),
              '%A': d => w[d.F],
              '%b': d => I[d.R].substring(0, 3),
              '%B': d => I[d.R],
              '%C': d => h((d.O + 1900) / 100 | 0, 2),
              '%d': d => h(d.S, 2),
              '%e': d => g(d.S, 2, ' '),
              '%g': d => q(d).toString().substring(2),
              '%G': q,
              '%H': d => h(d.P, 2),
              '%I': d => {
                d = d.P;
                0 == d ? d = 12 : 12 < d && (d -= 12);
                return h(d, 2)
              },
              '%j': d => {
                for (var m = 0, p = 0; p <= d.R - 1;
                     m += (P(d.O + 1900) ? Aa : Ba)[p++]);
                return h(d.S + m, 3)
              },
              '%m': d => h(d.R + 1, 2),
              '%M': d => h(d.U, 2),
              '%n': () => '\n',
              '%p': d => 0 <= d.P && 12 > d.P ? 'AM' : 'PM',
              '%S': d => h(d.V, 2),
              '%t': () => '\t',
              '%u': d => d.F || 7,
              '%U': d => h(Math.floor((d.G + 7 - d.F) / 7), 2),
              '%V': d => {
                var m = Math.floor((d.G + 7 - (d.F + 6) % 7) / 7);
                2 >= (d.F + 371 - d.G - 2) % 7 && m++;
                if (m)
                  53 == m &&
                      (p = (d.F + 371 - d.G) % 7,
                       4 == p || 3 == p && P(d.O) || (m = 1));
                else {
                  m = 52;
                  var p = (d.F + 7 - d.G - 1) % 7;
                  (4 == p || 5 == p && P(d.O % 400 - 1)) && m++
                }
                return h(m, 2)
              },
              '%w': d => d.F,
              '%W': d => h(Math.floor((d.G + 7 - (d.F + 6) % 7) / 7), 2),
              '%y': d => (d.O + 1900).toString().substring(2),
              '%Y': d => d.O + 1900,
              '%z': d => {
                d = d.T;
                var m = 0 <= d;
                d = Math.abs(d) / 60;
                return (m ? '+' : '-') +
                    String('0000' + (d / 60 * 100 + d % 60)).slice(-4)
              },
              '%Z': d => d.W,
              '%%': () => '%'
            };
            c = c.replace(/%%/g, '\x00\x00');
            for (l in r)
              c.includes(l) && (c = c.replace(new RegExp(l, 'g'), r[l](e)));
            c = c.replace(/\0\0/g, '%');
            l = Ca(c);
            if (l.length > b) return 0;
            D.set(l, a);
            return l.length - 1
          }
        },
        V = function() {
          function a(c) {
            V = c.exports;
            V = Da();
            A = V.B;
            ea();
            ha.unshift(V.C);
            H--;
            f.monitorRunDependencies?.(H);
            0 == H &&
                (null !== J && (clearInterval(J), J = null),
                 K && (c = K, K = null, c()));
            return V
          }
          var b = {a: Ia};
          H++;
          f.monitorRunDependencies?.(H);
          if (f.instantiateWasm) try {
              return f.instantiateWasm(b, a)
            } catch (c) {
              y(`Module.instantiateWasm callback failed with error: ${c}`), t(c)
            }
          L ||= ma('lua_wasm.wasm') ? 'lua_wasm.wasm' :
              f.locateFile          ? f.locateFile('lua_wasm.wasm', x) :
                                      x + 'lua_wasm.wasm';
          qa(b, function(c) {
            a(c.instance)
          }).catch(t);
          return {}
        }(), Ja = f._main = (a, b) => (Ja = f._main = V.D)(a, b);
    f._run_lua = a => (f._run_lua = V.E)(a);
    var Ka = a => (Ka = V.H)(a), La = (a, b) => (La = V.I)(a, b),
        Ga = a => (Ga = V.J)(a), Y = a => (Y = V.K)(a), W = a => (W = V.L)(a),
        X = () => (X = V.M)(),
        dynCall_vii = f.dynCall_vii = (a, b, c) =>
            (dynCall_vii = f.dynCall_vii = V.N)(a, b, c);
    function Ha(a, b, c) {
      var e = X();
      try {
        dynCall_vii(a, b, c)
      } catch (g) {
        Y(e);
        if (g !== g + 0) throw g;
        La(1, 0)
      }
    }
    f.ccall = Fa;
    f.cwrap = (a, b, c, e) => {
      var g = !c || c.every(h => 'number' === h || 'boolean' === h);
      return 'string' !== b && g && !e ? f['_' + a] :
                                         (...h) => Fa(a, b, c, h, e)
    };
    f.stringToNewUTF8 = a => {
      var b = U(a) + 1, c = Ka(b);
      c && Q(a, E, c, b);
      return c
    };
    var Z;
    K = function Ma() {
      Z || Na();
      Z || (K = Ma)
    };
    function Na() {
      function a() {
        if (!Z && (Z = !0, f.calledRun = !0, !C)) {
          N(ha);
          N(ia);
          k(f);
          if (f.onRuntimeInitialized) f.onRuntimeInitialized();
          if (Oa) {
            var b = Ja;
            try {
              var c = b(0, 0);
              ya(c)
            } catch (e) {
              e instanceof ra || 'unwind' == e || v(1, e)
            }
          }
          if (f.postRun)
            for ('function' == typeof f.postRun && (f.postRun = [f.postRun]);
                 f.postRun.length;)
              b = f.postRun.shift(), ja.unshift(b);
          N(ja)
        }
      }
      if (!(0 < H)) {
        if (f.preRun)
          for ('function' == typeof f.preRun && (f.preRun = [f.preRun]);
               f.preRun.length;)
            ka();
        N(fa);
        0 < H ||
            (f.setStatus ? (f.setStatus('Running...'), setTimeout(function() {
                              setTimeout(function() {
                                f.setStatus('')
                              }, 1);
                              a()
                            }, 1)) : a())
      }
    }
    if (f.preInit)
      for ('function' == typeof f.preInit && (f.preInit = [f.preInit]);
           0 < f.preInit.length;)
        f.preInit.pop()();
    var Oa = !0;
    f.noInitialRun && (Oa = !1);
    Na();
    moduleRtn = aa;


    return moduleRtn;
  });
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = lua_wasm;
else if (typeof define === 'function' && define['amd'])
  define([], () => lua_wasm);
export {lua_wasm};