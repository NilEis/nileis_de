// Support for growable heap + pthreads, where the buffer may change, so JS views
// must be updated.
function GROWABLE_HEAP_I8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP8;
}
function GROWABLE_HEAP_U8() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU8;
}
function GROWABLE_HEAP_I16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP16;
}
function GROWABLE_HEAP_U16() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU16;
}
function GROWABLE_HEAP_I32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAP32;
}
function GROWABLE_HEAP_U32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPU32;
}
function GROWABLE_HEAP_F32() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF32;
}
function GROWABLE_HEAP_F64() {
  if (wasmMemory.buffer != HEAP8.buffer) {
    updateMemoryViews();
  }
  return HEAPF64;
}

var Module = typeof Module != "undefined" ? Module : {};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

var ENVIRONMENT_IS_PTHREAD = Module["ENVIRONMENT_IS_PTHREAD"] || false;

var _scriptDir = (typeof document != "undefined" && document.currentScript) ? document.currentScript.src : undefined;

if (ENVIRONMENT_IS_WORKER) {
 _scriptDir = self.location.href;
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary;

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = url => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
} else  {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime = Module["noExitRuntime"] || true;

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var wasmModule;

var ABORT = false;

var EXITSTATUS;

/** @type {function(*, string=)} */ function assert(condition, text) {
 if (!condition) {
  abort(text);
 }
}

var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /** @type {!Float64Array} */ HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

assert(INITIAL_MEMORY >= 65536, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 65536 + ")");

if (ENVIRONMENT_IS_PTHREAD) {
 wasmMemory = Module["wasmMemory"];
} else {
 if (Module["wasmMemory"]) {
  wasmMemory = Module["wasmMemory"];
 } else {
  wasmMemory = new WebAssembly.Memory({
   "initial": INITIAL_MEMORY / 65536,
   "maximum": 2147483648 / 65536,
   "shared": true
  });
  if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
   err("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag");
   if (ENVIRONMENT_IS_NODE) {
    err("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and/or recent version)");
   }
   throw Error("bad memory");
  }
 }
}

updateMemoryViews();

INITIAL_MEMORY = wasmMemory.buffer.byteLength;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
 return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 if (ENVIRONMENT_IS_PTHREAD) return;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 if (ENVIRONMENT_IS_PTHREAD) return;
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 if (ENVIRONMENT_IS_PTHREAD) return;
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
 return id;
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

/** @param {string|number=} what */ function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what += ". Build with -sASSERTIONS for more info.";
 /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

function isFileURI(filename) {
 return filename.startsWith("file://");
}

var wasmBinaryFile;

wasmBinaryFile = "chip-8.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinarySync(file) {
 if (file == wasmBinaryFile && wasmBinary) {
  return new Uint8Array(wasmBinary);
 }
 if (readBinary) {
  return readBinary(file);
 }
 throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function") {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(response => {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + binaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(() => getBinarySync(binaryFile));
  }
 }
 return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
 return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(instance => instance).then(receiver, reason => {
  err(`failed to asynchronously prepare wasm: ${reason}`);
  abort(reason);
 });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
 if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function") {
  return fetch(binaryFile, {
   credentials: "same-origin"
  }).then(response => {
   /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
   return result.then(callback, function(reason) {
    err(`wasm streaming compile failed: ${reason}`);
    err("falling back to ArrayBuffer instantiation");
    return instantiateArrayBuffer(binaryFile, imports, callback);
   });
  });
 }
 return instantiateArrayBuffer(binaryFile, imports, callback);
}

function createWasm() {
 var info = {
  "env": wasmImports,
  "wasi_snapshot_preview1": wasmImports
 };
 /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
  wasmExports = instance.exports;
  wasmExports = Asyncify.instrumentWasmExports(wasmExports);
  registerTLSInit(wasmExports["_emscripten_tls_init"]);
  wasmTable = wasmExports["__indirect_function_table"];
  addOnInit(wasmExports["__wasm_call_ctors"]);
  wasmModule = module;
  removeRunDependency("wasm-instantiate");
  return wasmExports;
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiationResult(result) {
  receiveInstance(result["instance"], result["module"]);
 }
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err(`Module.instantiateWasm callback failed with error: ${e}`);
   return false;
  }
 }
 instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
 return {};
}

var tempDouble;

var tempI64;

var ASM_CONSTS = {
 92680: $0 => {
  var str = UTF8ToString($0) + "\n\n" + "Abort/Retry/Ignore/AlwaysIgnore? [ariA] :";
  var reply = window.prompt(str, "i");
  if (reply === null) {
   reply = "i";
  }
  return allocate(intArrayFromString(reply), "i8", ALLOC_NORMAL);
 },
 92905: () => {
  if (typeof (AudioContext) !== "undefined") {
   return true;
  } else if (typeof (webkitAudioContext) !== "undefined") {
   return true;
  }
  return false;
 },
 93052: () => {
  if ((typeof (navigator.mediaDevices) !== "undefined") && (typeof (navigator.mediaDevices.getUserMedia) !== "undefined")) {
   return true;
  } else if (typeof (navigator.webkitGetUserMedia) !== "undefined") {
   return true;
  }
  return false;
 },
 93286: $0 => {
  if (typeof (Module["SDL3"]) === "undefined") {
   Module["SDL3"] = {};
  }
  var SDL3 = Module["SDL3"];
  if (!$0) {
   SDL3.audio = {};
  } else {
   SDL3.capture = {};
  }
  if (!SDL3.audioContext) {
   if (typeof (AudioContext) !== "undefined") {
    SDL3.audioContext = new AudioContext;
   } else if (typeof (webkitAudioContext) !== "undefined") {
    SDL3.audioContext = new webkitAudioContext;
   }
   if (SDL3.audioContext) {
    autoResumeAudioContext(SDL3.audioContext);
   }
  }
  return SDL3.audioContext === undefined ? -1 : 0;
 },
 93780: () => {
  var SDL3 = Module["SDL3"];
  return SDL3.audioContext.sampleRate;
 },
 93848: ($0, $1, $2, $3) => {
  var SDL3 = Module["SDL3"];
  var have_microphone = function(stream) {
   if (SDL3.capture.silenceTimer !== undefined) {
    clearTimeout(SDL3.capture.silenceTimer);
    SDL3.capture.silenceTimer = undefined;
   }
   SDL3.capture.mediaStreamNode = SDL3.audioContext.createMediaStreamSource(stream);
   SDL3.capture.scriptProcessorNode = SDL3.audioContext.createScriptProcessor($1, $0, 1);
   SDL3.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {
    if ((SDL3 === undefined) || (SDL3.capture === undefined)) {
     return;
    }
    audioProcessingEvent.outputBuffer.getChannelData(0).fill(0);
    SDL3.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer;
    dynCall("vi", $2, [ $3 ]);
   };
   SDL3.capture.mediaStreamNode.connect(SDL3.capture.scriptProcessorNode);
   SDL3.capture.scriptProcessorNode.connect(SDL3.audioContext.destination);
   SDL3.capture.stream = stream;
  };
  var no_microphone = function(error) {};
  SDL3.capture.silenceBuffer = SDL3.audioContext.createBuffer($0, $1, SDL3.audioContext.sampleRate);
  SDL3.capture.silenceBuffer.getChannelData(0).fill(0);
  var silence_callback = function() {
   SDL3.capture.currentCaptureBuffer = SDL3.capture.silenceBuffer;
   dynCall("vi", $2, [ $3 ]);
  };
  SDL3.capture.silenceTimer = setTimeout(silence_callback, ($1 / SDL3.audioContext.sampleRate) * 1e3);
  if ((navigator.mediaDevices !== undefined) && (navigator.mediaDevices.getUserMedia !== undefined)) {
   navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false
   }).then(have_microphone).catch(no_microphone);
  } else if (navigator.webkitGetUserMedia !== undefined) {
   navigator.webkitGetUserMedia({
    audio: true,
    video: false
   }, have_microphone, no_microphone);
  }
 },
 95500: ($0, $1, $2, $3) => {
  var SDL3 = Module["SDL3"];
  SDL3.audio.scriptProcessorNode = SDL3.audioContext["createScriptProcessor"]($1, 0, $0);
  SDL3.audio.scriptProcessorNode["onaudioprocess"] = function(e) {
   if ((SDL3 === undefined) || (SDL3.audio === undefined)) {
    return;
   }
   SDL3.audio.currentOutputBuffer = e["outputBuffer"];
   dynCall("vi", $2, [ $3 ]);
  };
  SDL3.audio.scriptProcessorNode["connect"](SDL3.audioContext["destination"]);
 },
 95910: ($0, $1) => {
  var SDL3 = Module["SDL3"];
  var numChannels = SDL3.capture.currentCaptureBuffer.numberOfChannels;
  for (var c = 0; c < numChannels; ++c) {
   var channelData = SDL3.capture.currentCaptureBuffer.getChannelData(c);
   if (channelData.length != $1) {
    throw "Web Audio capture buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
   }
   if (numChannels == 1) {
    for (var j = 0; j < $1; ++j) {
     setValue($0 + (j * 4), channelData[j], "float");
    }
   } else {
    for (var j = 0; j < $1; ++j) {
     setValue($0 + (((j * numChannels) + c) * 4), channelData[j], "float");
    }
   }
  }
 },
 96515: ($0, $1) => {
  var SDL3 = Module["SDL3"];
  var numChannels = SDL3.audio.currentOutputBuffer["numberOfChannels"];
  for (var c = 0; c < numChannels; ++c) {
   var channelData = SDL3.audio.currentOutputBuffer["getChannelData"](c);
   if (channelData.length != $1) {
    throw "Web Audio output buffer length mismatch! Destination size: " + channelData.length + " samples vs expected " + $1 + " samples!";
   }
   for (var j = 0; j < $1; ++j) {
    channelData[j] = GROWABLE_HEAP_F32()[$0 + ((j * numChannels + c) << 2) >> 2];
   }
  }
 },
 96995: $0 => {
  var SDL3 = Module["SDL3"];
  if ($0) {
   if (SDL3.capture.silenceTimer !== undefined) {
    clearTimeout(SDL3.capture.silenceTimer);
   }
   if (SDL3.capture.stream !== undefined) {
    var tracks = SDL3.capture.stream.getAudioTracks();
    for (var i = 0; i < tracks.length; i++) {
     SDL3.capture.stream.removeTrack(tracks[i]);
    }
    SDL3.capture.stream = undefined;
   }
   if (SDL3.capture.scriptProcessorNode !== undefined) {
    SDL3.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {};
    SDL3.capture.scriptProcessorNode.disconnect();
    SDL3.capture.scriptProcessorNode = undefined;
   }
   if (SDL3.capture.mediaStreamNode !== undefined) {
    SDL3.capture.mediaStreamNode.disconnect();
    SDL3.capture.mediaStreamNode = undefined;
   }
   if (SDL3.capture.silenceBuffer !== undefined) {
    SDL3.capture.silenceBuffer = undefined;
   }
   SDL3.capture = undefined;
  } else {
   if (SDL3.audio.scriptProcessorNode != undefined) {
    SDL3.audio.scriptProcessorNode.disconnect();
    SDL3.audio.scriptProcessorNode = undefined;
   }
   SDL3.audio = undefined;
  }
  if ((SDL3.audioContext !== undefined) && (SDL3.audio === undefined) && (SDL3.capture === undefined)) {
   SDL3.audioContext.close();
   SDL3.audioContext = undefined;
  }
 },
 98167: ($0, $1, $2, $3) => {
  var w = $0;
  var h = $1;
  var pixels = $2;
  var canvasId = UTF8ToString($3);
  var canvas = document.querySelector(canvasId);
  if (!Module["SDL3"]) Module["SDL3"] = {};
  var SDL3 = Module["SDL3"];
  if (SDL3.ctxCanvas !== canvas) {
   SDL3.ctx = Module["createContext"](canvas, false, true);
   SDL3.ctxCanvas = canvas;
  }
  if (SDL3.w !== w || SDL3.h !== h || SDL3.imageCtx !== SDL3.ctx) {
   SDL3.image = SDL3.ctx.createImageData(w, h);
   SDL3.w = w;
   SDL3.h = h;
   SDL3.imageCtx = SDL3.ctx;
  }
  var data = SDL3.image.data;
  var src = pixels >> 2;
  var dst = 0;
  var num;
  if (SDL3.data32Data !== data) {
   SDL3.data32 = new Int32Array(data.buffer);
   SDL3.data8 = new Uint8Array(data.buffer);
   SDL3.data32Data = data;
  }
  var data32 = SDL3.data32;
  num = data32.length;
  data32.set(GROWABLE_HEAP_I32().subarray(src, src + num));
  var data8 = SDL3.data8;
  var i = 3;
  var j = i + 4 * num;
  if (num % 8 == 0) {
   while (i < j) {
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
    data8[i] = 255;
    i = i + 4 | 0;
   }
  } else {
   while (i < j) {
    data8[i] = 255;
    i = i + 4 | 0;
   }
  }
  SDL3.ctx.putImageData(SDL3.image, 0, 0);
 },
 99399: ($0, $1, $2, $3, $4) => {
  var w = $0;
  var h = $1;
  var hot_x = $2;
  var hot_y = $3;
  var pixels = $4;
  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext("2d");
  var image = ctx.createImageData(w, h);
  var data = image.data;
  var src = pixels >> 2;
  var data32 = new Int32Array(data.buffer);
  data32.set(GROWABLE_HEAP_I32().subarray(src, src + data32.length));
  ctx.putImageData(image, 0, 0);
  var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto";
  var urlBuf = _malloc(url.length + 1);
  stringToUTF8(url, urlBuf, url.length + 1);
  return urlBuf;
 },
 100054: $0 => {
  if (Module["canvas"]) {
   Module["canvas"].style["cursor"] = UTF8ToString($0);
  }
 },
 100137: () => {
  if (Module["canvas"]) {
   Module["canvas"].style["cursor"] = "none";
  }
 },
 100206: () => window.innerWidth,
 100236: () => window.innerHeight
};

/** @constructor */ function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = `Program terminated with exit(${status})`;
 this.status = status;
}

var terminateWorker = worker => {
 worker.terminate();
 worker.onmessage = e => {};
};

var killThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 delete PThread.pthreads[pthread_ptr];
 terminateWorker(worker);
 __emscripten_thread_free_data(pthread_ptr);
 PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
 worker.pthread_ptr = 0;
};

var cancelThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 worker.postMessage({
  "cmd": "cancel"
 });
};

var cleanupThread = pthread_ptr => {
 var worker = PThread.pthreads[pthread_ptr];
 assert(worker);
 PThread.returnWorkerToPool(worker);
};

var zeroMemory = (address, size) => {
 GROWABLE_HEAP_U8().fill(0, address, address + size);
 return address;
};

var spawnThread = threadParams => {
 var worker = PThread.getNewWorker();
 if (!worker) {
  return 6;
 }
 PThread.runningWorkers.push(worker);
 PThread.pthreads[threadParams.pthread_ptr] = worker;
 worker.pthread_ptr = threadParams.pthread_ptr;
 var msg = {
  "cmd": "run",
  "start_routine": threadParams.startRoutine,
  "arg": threadParams.arg,
  "pthread_ptr": threadParams.pthread_ptr
 };
 worker.postMessage(msg, threadParams.transferList);
 return 0;
};

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.buffer instanceof SharedArrayBuffer ? heapOrArray.slice(idx, endPtr) : heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode(((u0 & 31) << 6) | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
  } else {
   u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
  }
 }
 return str;
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(GROWABLE_HEAP_U8(), ptr, maxBytesToRead) : "";

var SYSCALLS = {
 varargs: undefined,
 get() {
  var ret = GROWABLE_HEAP_I32()[((+SYSCALLS.varargs) >> 2)];
  SYSCALLS.varargs += 4;
  return ret;
 },
 getp() {
  return SYSCALLS.get();
 },
 getStr(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

function _proc_exit(code) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(0, 1, code);
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  PThread.terminateAllThreads();
  if (Module["onExit"]) Module["onExit"](code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
}

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
 EXITSTATUS = status;
 if (ENVIRONMENT_IS_PTHREAD) {
  exitOnMainThread(status);
  throw "unwind";
 }
 _proc_exit(status);
};

var _exit = exitJS;

var handleException = e => {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 quit_(1, e);
};

var PThread = {
 unusedWorkers: [],
 runningWorkers: [],
 tlsInitFunctions: [],
 pthreads: {},
 init() {
  if (ENVIRONMENT_IS_PTHREAD) {
   PThread.initWorker();
  } else {
   PThread.initMainThread();
  }
 },
 initMainThread() {
  var pthreadPoolSize = 1;
  while (pthreadPoolSize--) {
   PThread.allocateUnusedWorker();
  }
  addOnPreRun(() => {
   addRunDependency("loading-workers");
   PThread.loadWasmModuleToAllWorkers(() => removeRunDependency("loading-workers"));
  });
 },
 initWorker() {
  PThread["receiveObjectTransfer"] = PThread.receiveObjectTransfer;
  PThread["threadInitTLS"] = PThread.threadInitTLS;
  PThread["setExitStatus"] = PThread.setExitStatus;
  noExitRuntime = false;
 },
 setExitStatus: status => {
  EXITSTATUS = status;
 },
 terminateAllThreads__deps: [ "$terminateWorker" ],
 terminateAllThreads: () => {
  for (var worker of PThread.runningWorkers) {
   terminateWorker(worker);
  }
  for (var worker of PThread.unusedWorkers) {
   terminateWorker(worker);
  }
  PThread.unusedWorkers = [];
  PThread.runningWorkers = [];
  PThread.pthreads = [];
 },
 returnWorkerToPool: worker => {
  var pthread_ptr = worker.pthread_ptr;
  delete PThread.pthreads[pthread_ptr];
  PThread.unusedWorkers.push(worker);
  PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker), 1);
  worker.pthread_ptr = 0;
  __emscripten_thread_free_data(pthread_ptr);
 },
 receiveObjectTransfer(data) {},
 threadInitTLS() {
  PThread.tlsInitFunctions.forEach(f => f());
 },
 loadWasmModuleToWorker: worker => new Promise(onFinishedLoading => {
  worker.onmessage = e => {
   var d = e["data"];
   var cmd = d["cmd"];
   if (d["targetThread"] && d["targetThread"] != _pthread_self()) {
    var targetWorker = PThread.pthreads[d["targetThread"]];
    if (targetWorker) {
     targetWorker.postMessage(d, d["transferList"]);
    } else {
     err(`Internal error! Worker sent a message "${cmd}" to target pthread ${d["targetThread"]}, but that thread no longer exists!`);
    }
    return;
   }
   if (cmd === "checkMailbox") {
    checkMailbox();
   } else if (cmd === "spawnThread") {
    spawnThread(d);
   } else if (cmd === "cleanupThread") {
    cleanupThread(d["thread"]);
   } else if (cmd === "killThread") {
    killThread(d["thread"]);
   } else if (cmd === "cancelThread") {
    cancelThread(d["thread"]);
   } else if (cmd === "loaded") {
    worker.loaded = true;
    onFinishedLoading(worker);
   } else if (cmd === "alert") {
    alert(`Thread ${d["threadId"]}: ${d["text"]}`);
   } else if (d.target === "setimmediate") {
    worker.postMessage(d);
   } else if (cmd === "callHandler") {
    Module[d["handler"]](...d["args"]);
   } else if (cmd) {
    err(`worker sent an unknown command ${cmd}`);
   }
  };
  worker.onerror = e => {
   var message = "worker sent an error!";
   err(`${message} ${e.filename}:${e.lineno}: ${e.message}`);
   throw e;
  };
  var handlers = [];
  var knownHandlers = [ "onExit", "onAbort", "print", "printErr" ];
  for (var handler of knownHandlers) {
   if (Module.hasOwnProperty(handler)) {
    handlers.push(handler);
   }
  }
  worker.postMessage({
   "cmd": "load",
   "handlers": handlers,
   "urlOrBlob": Module["mainScriptUrlOrBlob"] || _scriptDir,
   "wasmMemory": wasmMemory,
   "wasmModule": wasmModule
  });
 }),
 loadWasmModuleToAllWorkers(onMaybeReady) {
  if (ENVIRONMENT_IS_PTHREAD) {
   return onMaybeReady();
  }
  let pthreadPoolReady = Promise.all(PThread.unusedWorkers.map(PThread.loadWasmModuleToWorker));
  pthreadPoolReady.then(onMaybeReady);
 },
 allocateUnusedWorker() {
  var worker;
  var pthreadMainJs = locateFile("chip-8.worker.js");
  worker = new Worker(pthreadMainJs);
  PThread.unusedWorkers.push(worker);
 },
 getNewWorker() {
  if (PThread.unusedWorkers.length == 0) {
   PThread.allocateUnusedWorker();
   PThread.loadWasmModuleToWorker(PThread.unusedWorkers[0]);
  }
  return PThread.unusedWorkers.pop();
 }
};

Module["PThread"] = PThread;

var callRuntimeCallbacks = callbacks => {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
};

var establishStackSpace = () => {
 var pthread_ptr = _pthread_self();
 var stackHigh = GROWABLE_HEAP_U32()[(((pthread_ptr) + (52)) >> 2)];
 var stackSize = GROWABLE_HEAP_U32()[(((pthread_ptr) + (56)) >> 2)];
 var stackLow = stackHigh - stackSize;
 _emscripten_stack_set_limits(stackHigh, stackLow);
 stackRestore(stackHigh);
};

Module["establishStackSpace"] = establishStackSpace;

function exitOnMainThread(returnCode) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(1, 0, returnCode);
 _exit(returnCode);
}

/**
     * @param {number} ptr
     * @param {string} type
     */ function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return GROWABLE_HEAP_I8()[((ptr) >> 0)];

 case "i8":
  return GROWABLE_HEAP_I8()[((ptr) >> 0)];

 case "i16":
  return GROWABLE_HEAP_I16()[((ptr) >> 1)];

 case "i32":
  return GROWABLE_HEAP_I32()[((ptr) >> 2)];

 case "i64":
  abort("to do getValue(i64) use WASM_BIGINT");

 case "float":
  return GROWABLE_HEAP_F32()[((ptr) >> 2)];

 case "double":
  return GROWABLE_HEAP_F64()[((ptr) >> 3)];

 case "*":
  return GROWABLE_HEAP_U32()[((ptr) >> 2)];

 default:
  abort(`invalid type for getValue: ${type}`);
 }
}

var invokeEntryPoint = (ptr, arg) => {
 var result = (a1 => dynCall_ii.apply(null, [ ptr, a1 ]))(arg);
 function finish(result) {
  if (keepRuntimeAlive()) {
   PThread.setExitStatus(result);
  } else {
   __emscripten_thread_exit(result);
  }
 }
 finish(result);
};

Module["invokeEntryPoint"] = invokeEntryPoint;

var registerTLSInit = tlsInitFunc => {
 PThread.tlsInitFunctions.push(tlsInitFunc);
};

/**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */ function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  GROWABLE_HEAP_I8()[((ptr) >> 0)] = value;
  break;

 case "i8":
  GROWABLE_HEAP_I8()[((ptr) >> 0)] = value;
  break;

 case "i16":
  GROWABLE_HEAP_I16()[((ptr) >> 1)] = value;
  break;

 case "i32":
  GROWABLE_HEAP_I32()[((ptr) >> 2)] = value;
  break;

 case "i64":
  abort("to do setValue(i64) use WASM_BIGINT");

 case "float":
  GROWABLE_HEAP_F32()[((ptr) >> 2)] = value;
  break;

 case "double":
  GROWABLE_HEAP_F64()[((ptr) >> 3)] = value;
  break;

 case "*":
  GROWABLE_HEAP_U32()[((ptr) >> 2)] = value;
  break;

 default:
  abort(`invalid type for setValue: ${type}`);
 }
}

var ___call_sighandler = (fp, sig) => (a1 => dynCall_vi.apply(null, [ fp, a1 ]))(sig);

var ___emscripten_init_main_thread_js = tb => {
 __emscripten_thread_init(tb, /*is_main=*/ !ENVIRONMENT_IS_WORKER, /*is_runtime=*/ 1, /*can_block=*/ !ENVIRONMENT_IS_WEB, /*default_stacksize=*/ 65536, /*start_profiling=*/ false);
 PThread.threadInitTLS();
};

var ___emscripten_thread_cleanup = thread => {
 if (!ENVIRONMENT_IS_PTHREAD) cleanupThread(thread); else postMessage({
  "cmd": "cleanupThread",
  "thread": thread
 });
};

function pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(2, 1, pthread_ptr, attr, startRoutine, arg);
 return ___pthread_create_js(pthread_ptr, attr, startRoutine, arg);
}

var ___pthread_create_js = (pthread_ptr, attr, startRoutine, arg) => {
 if (typeof SharedArrayBuffer == "undefined") {
  err("Current environment does not support SharedArrayBuffer, pthreads are not available!");
  return 6;
 }
 var transferList = [];
 var error = 0;
 if (ENVIRONMENT_IS_PTHREAD && (transferList.length === 0 || error)) {
  return pthreadCreateProxied(pthread_ptr, attr, startRoutine, arg);
 }
 if (error) return error;
 var threadParams = {
  startRoutine: startRoutine,
  pthread_ptr: pthread_ptr,
  arg: arg,
  transferList: transferList
 };
 if (ENVIRONMENT_IS_PTHREAD) {
  threadParams.cmd = "spawnThread";
  postMessage(threadParams, transferList);
  return 0;
 }
 return spawnThread(threadParams);
};

var setErrNo = value => {
 GROWABLE_HEAP_I32()[((___errno_location()) >> 2)] = value;
 return value;
};

function ___syscall_fcntl64(fd, cmd, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(3, 1, fd, cmd, varargs);
 SYSCALLS.varargs = varargs;
 return 0;
}

function ___syscall_ioctl(fd, op, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(4, 1, fd, op, varargs);
 SYSCALLS.varargs = varargs;
 return 0;
}

function ___syscall_openat(dirfd, path, flags, varargs) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(5, 1, dirfd, path, flags, varargs);
 SYSCALLS.varargs = varargs;
}

var nowIsMonotonic = true;

var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;

var maybeExit = () => {
 if (!keepRuntimeAlive()) {
  try {
   if (ENVIRONMENT_IS_PTHREAD) __emscripten_thread_exit(EXITSTATUS); else _exit(EXITSTATUS);
  } catch (e) {
   handleException(e);
  }
 }
};

var callUserCallback = func => {
 if (ABORT) {
  return;
 }
 try {
  func();
  maybeExit();
 } catch (e) {
  handleException(e);
 }
};

var __emscripten_thread_mailbox_await = pthread_ptr => {
 if (typeof Atomics.waitAsync === "function") {
  var wait = Atomics.waitAsync(GROWABLE_HEAP_I32(), ((pthread_ptr) >> 2), pthread_ptr);
  wait.value.then(checkMailbox);
  var waitingAsync = pthread_ptr + 128;
  Atomics.store(GROWABLE_HEAP_I32(), ((waitingAsync) >> 2), 1);
 }
};

Module["__emscripten_thread_mailbox_await"] = __emscripten_thread_mailbox_await;

var checkMailbox = () => {
 var pthread_ptr = _pthread_self();
 if (pthread_ptr) {
  __emscripten_thread_mailbox_await(pthread_ptr);
  callUserCallback(() => __emscripten_check_mailbox());
 }
};

Module["checkMailbox"] = checkMailbox;

var __emscripten_notify_mailbox_postmessage = (targetThreadId, currThreadId, mainThreadId) => {
 if (targetThreadId == currThreadId) {
  setTimeout(() => checkMailbox());
 } else if (ENVIRONMENT_IS_PTHREAD) {
  postMessage({
   "targetThread": targetThreadId,
   "cmd": "checkMailbox"
  });
 } else {
  var worker = PThread.pthreads[targetThreadId];
  if (!worker) {
   return;
  }
  worker.postMessage({
   "cmd": "checkMailbox"
  });
 }
};

var withStackSave = f => {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
};

/** @type{function(number, (number|boolean), ...(number|boolean))} */ var proxyToMainThread = function(index, sync) {
 var numCallArgs = arguments.length - 2;
 var outerArgs = arguments;
 return withStackSave(() => {
  var serializedNumCallArgs = numCallArgs;
  var args = stackAlloc(serializedNumCallArgs * 8);
  var b = ((args) >> 3);
  for (var i = 0; i < numCallArgs; i++) {
   var arg = outerArgs[2 + i];
   GROWABLE_HEAP_F64()[b + i] = arg;
  }
  return __emscripten_run_on_main_thread_js(index, serializedNumCallArgs, args, sync);
 });
};

var proxiedJSCallArgs = [];

var __emscripten_receive_on_main_thread_js = (index, callingThread, numCallArgs, args) => {
 proxiedJSCallArgs.length = numCallArgs;
 var b = ((args) >> 3);
 for (var i = 0; i < numCallArgs; i++) {
  proxiedJSCallArgs[i] = GROWABLE_HEAP_F64()[b + i];
 }
 var isEmAsmConst = index < 0;
 var func = !isEmAsmConst ? proxiedFunctionTable[index] : ASM_CONSTS[-index - 1];
 PThread.currentProxiedOperationCallerThread = callingThread;
 var rtn = func.apply(null, proxiedJSCallArgs);
 PThread.currentProxiedOperationCallerThread = 0;
 return rtn;
};

var __emscripten_set_offscreencanvas_size = (target, width, height) => -1;

var __emscripten_thread_set_strongref = thread => {};

var readEmAsmArgsArray = [];

var readEmAsmArgs = (sigPtr, buf) => {
 readEmAsmArgsArray.length = 0;
 var ch;
 while (ch = GROWABLE_HEAP_U8()[sigPtr++]) {
  var wide = (ch != 105);
  wide &= (ch != 112);
  buf += wide && (buf % 8) ? 4 : 0;
  readEmAsmArgsArray.push( ch == 112 ? GROWABLE_HEAP_U32()[((buf) >> 2)] : ch == 105 ? GROWABLE_HEAP_I32()[((buf) >> 2)] : GROWABLE_HEAP_F64()[((buf) >> 3)]);
  buf += wide ? 8 : 4;
 }
 return readEmAsmArgsArray;
};

var runEmAsmFunction = (code, sigPtr, argbuf) => {
 var args = readEmAsmArgs(sigPtr, argbuf);
 return ASM_CONSTS[code].apply(null, args);
};

var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf);

var runMainThreadEmAsm = (code, sigPtr, argbuf, sync) => {
 var args = readEmAsmArgs(sigPtr, argbuf);
 if (ENVIRONMENT_IS_PTHREAD) {
  return proxyToMainThread.apply(null, [ -1 - code, sync ].concat(args));
 }
 return ASM_CONSTS[code].apply(null, args);
};

var _emscripten_asm_const_int_sync_on_main_thread = (code, sigPtr, argbuf) => runMainThreadEmAsm(code, sigPtr, argbuf, 1);

var runtimeKeepalivePush = () => {
 runtimeKeepaliveCounter += 1;
};

var _emscripten_set_main_loop_timing = (mode, value) => {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (!Browser.mainLoop.running) {
  runtimeKeepalivePush();
  Browser.mainLoop.running = true;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
   setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (typeof setImmediate == "undefined") {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "setimmediate";
   /** @param {Event} event */ var Browser_setImmediate_messageHandler = event => {
    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   };
   addEventListener("message", Browser_setImmediate_messageHandler, true);
   setImmediate = /** @type{function(function(): ?, ...?): number} */ (function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    if (ENVIRONMENT_IS_WORKER) {
     if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
     Module["setImmediates"].push(func);
     postMessage({
      target: emscriptenMainLoopMessageId
     });
    } else postMessage(emscriptenMainLoopMessageId, "*");
   });
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
};

var _emscripten_get_now;

_emscripten_get_now = () => performance.timeOrigin + performance.now();

var runtimeKeepalivePop = () => {
 runtimeKeepaliveCounter -= 1;
};

/**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */ var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = browserIterationFunc;
 Browser.mainLoop.arg = arg;
 /** @type{number} */ var thisMainLoopId = (() => Browser.mainLoop.currentlyRunningMainloop)();
 function checkIsRunning() {
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
   runtimeKeepalivePop();
   return false;
  }
  return true;
 }
 Browser.mainLoop.running = false;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   Browser.mainLoop.updateStatus();
   if (!checkIsRunning()) return;
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (!checkIsRunning()) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  } else if (Browser.mainLoop.timingMode == 0) {
   Browser.mainLoop.tickStartTime = _emscripten_get_now();
  }
  GL.newRenderingFrameStarted();
  Browser.mainLoop.runIter(browserIterationFunc);
  if (!checkIsRunning()) return;
  if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) {
   _emscripten_set_main_loop_timing(0, 1e3 / fps);
  } else {
   _emscripten_set_main_loop_timing(1, 1);
  }
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
};

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => {
 runtimeKeepalivePush();
 return setTimeout(() => {
  runtimeKeepalivePop();
  callUserCallback(func);
 }, timeout);
};

var warnOnce = text => {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
 }
};

var Browser = {
 mainLoop: {
  running: false,
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   callUserCallback(func);
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init() {
  if (Browser.initted) return;
  Browser.initted = true;
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
  }
  var canvas = Module["canvas"];
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", ev => {
     if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      ev.preventDefault();
     }
    }, false);
   }
  }
 },
 createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false,
    majorVersion: (typeof WebGL2RenderingContext != "undefined") ? 2 : 1
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   if (typeof GL != "undefined") {
    contextHandle = GL.createContext(canvas, contextAttributes);
    if (contextHandle) {
     ctx = GL.getContext(contextHandle).GLctx;
    }
   }
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
   Browser.init();
  }
  return ctx;
 },
 destroyContext(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen(lockPointer, resizeCanvas) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
  var canvas = Module["canvas"];
  function fullscreenChange() {
   Browser.isFullscreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.exitFullscreen = Browser.exitFullscreen;
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullscreen = true;
    if (Browser.resizeCanvas) {
     Browser.setFullscreenCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) {
     Browser.setWindowedCanvasSize();
    } else {
     Browser.updateCanvasDimensions(canvas);
    }
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
   if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
   Browser.fullscreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullscreenChange, false);
   document.addEventListener("mozfullscreenchange", fullscreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
   document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
  canvasContainer.requestFullscreen();
 },
 exitFullscreen() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 },
 requestAnimationFrame(func) {
  if (typeof requestAnimationFrame == "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeSetTimeout(func, timeout) {
  return safeSetTimeout(func, timeout);
 },
 safeRequestAnimationFrame(func) {
  runtimeKeepalivePush();
  return Browser.requestAnimationFrame(() => {
   runtimeKeepalivePop();
   callUserCallback(func);
  });
 },
 getMimetype(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 },
 getUserMedia(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 },
 getMovementX(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 },
 getMouseWheelDelta(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail / 3;
   break;

  case "mousewheel":
   delta = event.wheelDelta / 120;
   break;

  case "wheel":
   delta = event.deltaY;
   switch (event.deltaMode) {
   case 0:
    delta /= 100;
    break;

   case 1:
    delta /= 3;
    break;

   case 2:
    delta *= 80;
    break;

   default:
    throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
   }
   break;

  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 },
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && ("mozMovementX" in event)) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
   var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 },
 resizeListeners: [],
 updateResizeListeners() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
 },
 setCanvasSize(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = GROWABLE_HEAP_U32()[((SDL.screen) >> 2)];
   flags = flags | 8388608;
   GROWABLE_HEAP_I32()[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize() {
  if (typeof SDL != "undefined") {
   var flags = GROWABLE_HEAP_U32()[((SDL.screen) >> 2)];
   flags = flags & ~8388608;
   GROWABLE_HEAP_I32()[((SDL.screen) >> 2)] = flags;
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if (((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode) && (typeof screen != "undefined")) {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }
};

var _emscripten_cancel_main_loop = () => {
 Browser.mainLoop.pause();
 Browser.mainLoop.func = null;
};

var _emscripten_check_blocking_allowed = () => {};

var _emscripten_date_now = () => Date.now();

var JSEvents = {
 inEventHandler: 0,
 removeAllEventListeners() {
  for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
   JSEvents._removeHandler(i);
  }
  JSEvents.eventHandlers = [];
  JSEvents.deferredCalls = [];
 },
 registerRemoveEventListeners() {
  if (!JSEvents.removeEventListenersRegistered) {
   __ATEXIT__.push(JSEvents.removeAllEventListeners);
   JSEvents.removeEventListenersRegistered = true;
  }
 },
 deferredCalls: [],
 deferCall(targetFunction, precedence, argsList) {
  function arraysHaveEqualContent(arrA, arrB) {
   if (arrA.length != arrB.length) return false;
   for (var i in arrA) {
    if (arrA[i] != arrB[i]) return false;
   }
   return true;
  }
  for (var i in JSEvents.deferredCalls) {
   var call = JSEvents.deferredCalls[i];
   if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
    return;
   }
  }
  JSEvents.deferredCalls.push({
   targetFunction: targetFunction,
   precedence: precedence,
   argsList: argsList
  });
  JSEvents.deferredCalls.sort((x, y) => x.precedence < y.precedence);
 },
 removeDeferredCalls(targetFunction) {
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
   if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
    JSEvents.deferredCalls.splice(i, 1);
    --i;
   }
  }
 },
 canPerformEventHandlerRequests() {
  if (navigator.userActivation) {
   return navigator.userActivation.isActive;
  }
  return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
 },
 runDeferredCalls() {
  if (!JSEvents.canPerformEventHandlerRequests()) {
   return;
  }
  for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
   var call = JSEvents.deferredCalls[i];
   JSEvents.deferredCalls.splice(i, 1);
   --i;
   call.targetFunction.apply(null, call.argsList);
  }
 },
 eventHandlers: [],
 removeAllHandlersOnTarget: (target, eventTypeString) => {
  for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
   if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
    JSEvents._removeHandler(i--);
   }
  }
 },
 _removeHandler(i) {
  var h = JSEvents.eventHandlers[i];
  h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
  JSEvents.eventHandlers.splice(i, 1);
 },
 registerOrRemoveHandler(eventHandler) {
  if (!eventHandler.target) {
   return -4;
  }
  var jsEventHandler = function jsEventHandler(event) {
   ++JSEvents.inEventHandler;
   JSEvents.currentEventHandler = eventHandler;
   JSEvents.runDeferredCalls();
   eventHandler.handlerFunc(event);
   JSEvents.runDeferredCalls();
   --JSEvents.inEventHandler;
  };
  if (eventHandler.callbackfunc) {
   eventHandler.eventListenerFunc = jsEventHandler;
   eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
   JSEvents.eventHandlers.push(eventHandler);
   JSEvents.registerRemoveEventListeners();
  } else {
   for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
    if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
     JSEvents._removeHandler(i--);
    }
   }
  }
  return 0;
 },
 queueEventHandlerOnThread_iiii(targetThread, eventHandlerFunc, eventTypeId, eventData, userData) {
  withStackSave(() => {
   var varargs = stackAlloc(12);
   GROWABLE_HEAP_I32()[((varargs) >> 2)] = eventTypeId;
   GROWABLE_HEAP_I32()[(((varargs) + (4)) >> 2)] = eventData;
   GROWABLE_HEAP_I32()[(((varargs) + (8)) >> 2)] = userData;
   _emscripten_dispatch_to_thread_(targetThread, 637534208, eventHandlerFunc, eventData, varargs);
  });
 },
 getTargetThreadForEventCallback(targetThread) {
  switch (targetThread) {
  case 1:
   return 0;

  case 2:
   return PThread.currentProxiedOperationCallerThread;

  default:
   return targetThread;
  }
 },
 getNodeNameForTarget(target) {
  if (!target) return "";
  if (target == window) return "#window";
  if (target == screen) return "#screen";
  return (target && target.nodeName) ? target.nodeName : "";
 },
 fullscreenEnabled() {
  return document.fullscreenEnabled ||  document.webkitFullscreenEnabled;
 }
};

var currentFullscreenStrategy = {};

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

var specialHTMLTargets = [ 0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0 ];

var findEventTarget = target => {
 target = maybeCStringToJsString(target);
 var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
 return domElement;
};

var findCanvasEventTarget = target => findEventTarget(target);

var getCanvasSizeCallingThread = (target, width, height) => {
 var canvas = findCanvasEventTarget(target);
 if (!canvas) return -4;
 if (!canvas.controlTransferredOffscreen) {
  GROWABLE_HEAP_I32()[((width) >> 2)] = canvas.width;
  GROWABLE_HEAP_I32()[((height) >> 2)] = canvas.height;
 } else {
  return -4;
 }
 return 0;
};

function getCanvasSizeMainThread(target, width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(7, 1, target, width, height);
 return getCanvasSizeCallingThread(target, width, height);
}

var _emscripten_get_canvas_element_size = (target, width, height) => {
 var canvas = findCanvasEventTarget(target);
 if (canvas) {
  return getCanvasSizeCallingThread(target, width, height);
 }
 return getCanvasSizeMainThread(target, width, height);
};

var lengthBytesUTF8 = str => {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | (u >> 6);
   heap[outIdx++] = 128 | (u & 63);
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | (u >> 12);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | (u >> 18);
   heap[outIdx++] = 128 | ((u >> 12) & 63);
   heap[outIdx++] = 128 | ((u >> 6) & 63);
   heap[outIdx++] = 128 | (u & 63);
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
};

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, GROWABLE_HEAP_U8(), outPtr, maxBytesToWrite);

var stringToUTF8OnStack = str => {
 var size = lengthBytesUTF8(str) + 1;
 var ret = stackAlloc(size);
 stringToUTF8(str, ret, size);
 return ret;
};

var getCanvasElementSize = target => withStackSave(() => {
 var w = stackAlloc(8);
 var h = w + 4;
 var targetInt = stringToUTF8OnStack(target.id);
 var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
 var size = [ GROWABLE_HEAP_I32()[((w) >> 2)], GROWABLE_HEAP_I32()[((h) >> 2)] ];
 return size;
});

var setCanvasElementSizeCallingThread = (target, width, height) => {
 var canvas = findCanvasEventTarget(target);
 if (!canvas) return -4;
 if (!canvas.controlTransferredOffscreen) {
  var autoResizeViewport = false;
  if (canvas.GLctxObject && canvas.GLctxObject.GLctx) {
   var prevViewport = canvas.GLctxObject.GLctx.getParameter(2978);
   autoResizeViewport = (prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height);
  }
  canvas.width = width;
  canvas.height = height;
  if (autoResizeViewport) {
   canvas.GLctxObject.GLctx.viewport(0, 0, width, height);
  }
 } else {
  return -4;
 }
 return 0;
};

function setCanvasElementSizeMainThread(target, width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(8, 1, target, width, height);
 return setCanvasElementSizeCallingThread(target, width, height);
}

var _emscripten_set_canvas_element_size = (target, width, height) => {
 var canvas = findCanvasEventTarget(target);
 if (canvas) {
  return setCanvasElementSizeCallingThread(target, width, height);
 }
 return setCanvasElementSizeMainThread(target, width, height);
};

var setCanvasElementSize = (target, width, height) => {
 if (!target.controlTransferredOffscreen) {
  target.width = width;
  target.height = height;
 } else {
  withStackSave(() => {
   var targetInt = stringToUTF8OnStack(target.id);
   _emscripten_set_canvas_element_size(targetInt, width, height);
  });
 }
};

var registerRestoreOldStyle = canvas => {
 var canvasSize = getCanvasElementSize(canvas);
 var oldWidth = canvasSize[0];
 var oldHeight = canvasSize[1];
 var oldCssWidth = canvas.style.width;
 var oldCssHeight = canvas.style.height;
 var oldBackgroundColor = canvas.style.backgroundColor;
 var oldDocumentBackgroundColor = document.body.style.backgroundColor;
 var oldPaddingLeft = canvas.style.paddingLeft;
 var oldPaddingRight = canvas.style.paddingRight;
 var oldPaddingTop = canvas.style.paddingTop;
 var oldPaddingBottom = canvas.style.paddingBottom;
 var oldMarginLeft = canvas.style.marginLeft;
 var oldMarginRight = canvas.style.marginRight;
 var oldMarginTop = canvas.style.marginTop;
 var oldMarginBottom = canvas.style.marginBottom;
 var oldDocumentBodyMargin = document.body.style.margin;
 var oldDocumentOverflow = document.documentElement.style.overflow;
 var oldDocumentScroll = document.body.scroll;
 var oldImageRendering = canvas.style.imageRendering;
 function restoreOldStyle() {
  var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (!fullscreenElement) {
   document.removeEventListener("fullscreenchange", restoreOldStyle);
   document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
   setCanvasElementSize(canvas, oldWidth, oldHeight);
   canvas.style.width = oldCssWidth;
   canvas.style.height = oldCssHeight;
   canvas.style.backgroundColor = oldBackgroundColor;
   if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = "white";
   document.body.style.backgroundColor = oldDocumentBackgroundColor;
   canvas.style.paddingLeft = oldPaddingLeft;
   canvas.style.paddingRight = oldPaddingRight;
   canvas.style.paddingTop = oldPaddingTop;
   canvas.style.paddingBottom = oldPaddingBottom;
   canvas.style.marginLeft = oldMarginLeft;
   canvas.style.marginRight = oldMarginRight;
   canvas.style.marginTop = oldMarginTop;
   canvas.style.marginBottom = oldMarginBottom;
   document.body.style.margin = oldDocumentBodyMargin;
   document.documentElement.style.overflow = oldDocumentOverflow;
   document.body.scroll = oldDocumentScroll;
   canvas.style.imageRendering = oldImageRendering;
   if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
   if (currentFullscreenStrategy.canvasResizedCallback) {
    if (currentFullscreenStrategy.canvasResizedCallbackTargetThread) JSEvents.queueEventHandlerOnThread_iiii(currentFullscreenStrategy.canvasResizedCallbackTargetThread, currentFullscreenStrategy.canvasResizedCallback, 37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData); else ((a1, a2, a3) => dynCall_iiii.apply(null, [ currentFullscreenStrategy.canvasResizedCallback, a1, a2, a3 ]))(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
   }
  }
 }
 document.addEventListener("fullscreenchange", restoreOldStyle);
 document.addEventListener("webkitfullscreenchange", restoreOldStyle);
 return restoreOldStyle;
};

var setLetterbox = (element, topBottom, leftRight) => {
 element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
 element.style.paddingTop = element.style.paddingBottom = topBottom + "px";
};

var getBoundingClientRect = e => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
 "left": 0,
 "top": 0
};

var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
 var restoreOldStyle = registerRestoreOldStyle(target);
 var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
 var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
 var rect = getBoundingClientRect(target);
 var windowedCssWidth = rect.width;
 var windowedCssHeight = rect.height;
 var canvasSize = getCanvasElementSize(target);
 var windowedRttWidth = canvasSize[0];
 var windowedRttHeight = canvasSize[1];
 if (strategy.scaleMode == 3) {
  setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
  cssWidth = windowedCssWidth;
  cssHeight = windowedCssHeight;
 } else if (strategy.scaleMode == 2) {
  if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
   var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
   setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
   cssHeight = desiredCssHeight;
  } else {
   var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
   setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
   cssWidth = desiredCssWidth;
  }
 }
 if (!target.style.backgroundColor) target.style.backgroundColor = "black";
 if (!document.body.style.backgroundColor) document.body.style.backgroundColor = "black";
 target.style.width = cssWidth + "px";
 target.style.height = cssHeight + "px";
 if (strategy.filteringMode == 1) {
  target.style.imageRendering = "optimizeSpeed";
  target.style.imageRendering = "-moz-crisp-edges";
  target.style.imageRendering = "-o-crisp-edges";
  target.style.imageRendering = "-webkit-optimize-contrast";
  target.style.imageRendering = "optimize-contrast";
  target.style.imageRendering = "crisp-edges";
  target.style.imageRendering = "pixelated";
 }
 var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? devicePixelRatio : 1;
 if (strategy.canvasResolutionScaleMode != 0) {
  var newWidth = (cssWidth * dpiScale) | 0;
  var newHeight = (cssHeight * dpiScale) | 0;
  setCanvasElementSize(target, newWidth, newHeight);
  if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
 }
 return restoreOldStyle;
};

var JSEvents_requestFullscreen = (target, strategy) => {
 if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
  JSEvents_resizeCanvasForFullscreen(target, strategy);
 }
 if (target.requestFullscreen) {
  target.requestFullscreen();
 } else if (target.webkitRequestFullscreen) {
  target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
 } else {
  return JSEvents.fullscreenEnabled() ? -3 : -1;
 }
 currentFullscreenStrategy = strategy;
 if (strategy.canvasResizedCallback) {
  if (strategy.canvasResizedCallbackTargetThread) JSEvents.queueEventHandlerOnThread_iiii(strategy.canvasResizedCallbackTargetThread, strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData); else ((a1, a2, a3) => dynCall_iiii.apply(null, [ strategy.canvasResizedCallback, a1, a2, a3 ]))(37, 0, strategy.canvasResizedCallbackUserData);
 }
 return 0;
};

function _emscripten_exit_fullscreen() {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(6, 1);
 if (!JSEvents.fullscreenEnabled()) return -1;
 JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
 var d = specialHTMLTargets[1];
 if (d.exitFullscreen) {
  d.fullscreenElement && d.exitFullscreen();
 } else if (d.webkitExitFullscreen) {
  d.webkitFullscreenElement && d.webkitExitFullscreen();
 } else {
  return -1;
 }
 return 0;
}

var requestPointerLock = target => {
 if (target.requestPointerLock) {
  target.requestPointerLock();
 } else {
  if (document.body.requestPointerLock) {
   return -3;
  }
  return -1;
 }
 return 0;
};

function _emscripten_exit_pointerlock() {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(9, 1);
 JSEvents.removeDeferredCalls(requestPointerLock);
 if (document.exitPointerLock) {
  document.exitPointerLock();
 } else {
  return -1;
 }
 return 0;
}

var _emscripten_exit_with_live_runtime = () => {
 runtimeKeepalivePush();
 throw "unwind";
};

function _emscripten_force_exit(status) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(10, 1, status);
 noExitRuntime = false;
 runtimeKeepaliveCounter = 0;
 _exit(status);
}

function _emscripten_get_device_pixel_ratio() {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(11, 1);
 return devicePixelRatio;
}

function _emscripten_get_element_css_size(target, width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(12, 1, target, width, height);
 target = findEventTarget(target);
 if (!target) return -4;
 var rect = getBoundingClientRect(target);
 GROWABLE_HEAP_F64()[((width) >> 3)] = rect.width;
 GROWABLE_HEAP_F64()[((height) >> 3)] = rect.height;
 return 0;
}

var fillGamepadEventData = (eventStruct, e) => {
 GROWABLE_HEAP_F64()[((eventStruct) >> 3)] = e.timestamp;
 for (var i = 0; i < e.axes.length; ++i) {
  GROWABLE_HEAP_F64()[(((eventStruct + i * 8) + (16)) >> 3)] = e.axes[i];
 }
 for (var i = 0; i < e.buttons.length; ++i) {
  if (typeof e.buttons[i] == "object") {
   GROWABLE_HEAP_F64()[(((eventStruct + i * 8) + (528)) >> 3)] = e.buttons[i].value;
  } else {
   GROWABLE_HEAP_F64()[(((eventStruct + i * 8) + (528)) >> 3)] = e.buttons[i];
  }
 }
 for (var i = 0; i < e.buttons.length; ++i) {
  if (typeof e.buttons[i] == "object") {
   GROWABLE_HEAP_I32()[(((eventStruct + i * 4) + (1040)) >> 2)] = e.buttons[i].pressed;
  } else {
   /** @suppress {checkTypes} */ GROWABLE_HEAP_I32()[(((eventStruct + i * 4) + (1040)) >> 2)] = e.buttons[i] == 1;
  }
 }
 GROWABLE_HEAP_I32()[(((eventStruct) + (1296)) >> 2)] = e.connected;
 GROWABLE_HEAP_I32()[(((eventStruct) + (1300)) >> 2)] = e.index;
 GROWABLE_HEAP_I32()[(((eventStruct) + (8)) >> 2)] = e.axes.length;
 GROWABLE_HEAP_I32()[(((eventStruct) + (12)) >> 2)] = e.buttons.length;
 stringToUTF8(e.id, eventStruct + 1304, 64);
 stringToUTF8(e.mapping, eventStruct + 1368, 64);
};

function _emscripten_get_gamepad_status(index, gamepadState) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(13, 1, index, gamepadState);
 if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
 if (!JSEvents.lastGamepadState[index]) return -7;
 fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
 return 0;
}

var _emscripten_get_main_loop_timing = (mode, value) => {
 if (mode) GROWABLE_HEAP_I32()[((mode) >> 2)] = Browser.mainLoop.timingMode;
 if (value) GROWABLE_HEAP_I32()[((value) >> 2)] = Browser.mainLoop.timingValue;
};

function _emscripten_get_num_gamepads() {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(14, 1);
 return JSEvents.lastGamepadState.length;
}

function _emscripten_get_screen_size(width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(15, 1, width, height);
 GROWABLE_HEAP_I32()[((width) >> 2)] = screen.width;
 GROWABLE_HEAP_I32()[((height) >> 2)] = screen.height;
}

var webgl_enable_ANGLE_instanced_arrays = ctx => {
 var ext = ctx.getExtension("ANGLE_instanced_arrays");
 if (ext) {
  ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
  ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
  ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
  return 1;
 }
};

var webgl_enable_OES_vertex_array_object = ctx => {
 var ext = ctx.getExtension("OES_vertex_array_object");
 if (ext) {
  ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
  ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
  ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
  ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
  return 1;
 }
};

var webgl_enable_WEBGL_draw_buffers = ctx => {
 var ext = ctx.getExtension("WEBGL_draw_buffers");
 if (ext) {
  ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
  return 1;
 }
};

var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = ctx =>  !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = ctx => !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));

var webgl_enable_WEBGL_multi_draw = ctx => !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));

var GL = {
 counter: 1,
 buffers: [],
 mappedBuffers: {},
 programs: [],
 framebuffers: [],
 renderbuffers: [],
 textures: [],
 shaders: [],
 vaos: [],
 contexts: {},
 offscreenCanvases: {},
 queries: [],
 samplers: [],
 transformFeedbacks: [],
 syncs: [],
 byteSizeByTypeRoot: 5120,
 byteSizeByType: [ 1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8 ],
 stringCache: {},
 stringiCache: {},
 unpackAlignment: 4,
 recordError: function recordError(errorCode) {
  if (!GL.lastError) {
   GL.lastError = errorCode;
  }
 },
 getNewId: table => {
  var ret = GL.counter++;
  for (var i = table.length; i < ret; i++) {
   table[i] = null;
  }
  return ret;
 },
 MAX_TEMP_BUFFER_SIZE: 2097152,
 numTempVertexBuffersPerSize: 64,
 log2ceilLookup: i => 32 - Math.clz32(i === 0 ? 0 : i - 1),
 generateTempBuffers: (quads, context) => {
  var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
  context.tempVertexBufferCounters1 = [];
  context.tempVertexBufferCounters2 = [];
  context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
  context.tempVertexBuffers1 = [];
  context.tempVertexBuffers2 = [];
  context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
  context.tempIndexBuffers = [];
  context.tempIndexBuffers.length = largestIndex + 1;
  for (var i = 0; i <= largestIndex; ++i) {
   context.tempIndexBuffers[i] = null;
   context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
   var ringbufferLength = GL.numTempVertexBuffersPerSize;
   context.tempVertexBuffers1[i] = [];
   context.tempVertexBuffers2[i] = [];
   var ringbuffer1 = context.tempVertexBuffers1[i];
   var ringbuffer2 = context.tempVertexBuffers2[i];
   ringbuffer1.length = ringbuffer2.length = ringbufferLength;
   for (var j = 0; j < ringbufferLength; ++j) {
    ringbuffer1[j] = ringbuffer2[j] = null;
   }
  }
  if (quads) {
   context.tempQuadIndexBuffer = GLctx.createBuffer();
   context.GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ context.tempQuadIndexBuffer);
   var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
   var quadIndexes = new Uint16Array(numIndexes);
   var i = 0, v = 0;
   while (1) {
    quadIndexes[i++] = v;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 1;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 2;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 2;
    if (i >= numIndexes) break;
    quadIndexes[i++] = v + 3;
    if (i >= numIndexes) break;
    v += 4;
   }
   context.GLctx.bufferData(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ quadIndexes, 35044);
   /*GL_STATIC_DRAW*/ context.GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ null);
  }
 },
 getTempVertexBuffer: function getTempVertexBuffer(sizeBytes) {
  var idx = GL.log2ceilLookup(sizeBytes);
  var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
  var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
  GL.currentContext.tempVertexBufferCounters1[idx] = (GL.currentContext.tempVertexBufferCounters1[idx] + 1) & (GL.numTempVertexBuffersPerSize - 1);
  var vbo = ringbuffer[nextFreeBufferIndex];
  if (vbo) {
   return vbo;
  }
  var prevVBO = GLctx.getParameter(34964);
  /*GL_ARRAY_BUFFER_BINDING*/ ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
  GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ ringbuffer[nextFreeBufferIndex]);
  GLctx.bufferData(34962, /*GL_ARRAY_BUFFER*/ 1 << idx, 35048);
  /*GL_DYNAMIC_DRAW*/ GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ prevVBO);
  return ringbuffer[nextFreeBufferIndex];
 },
 getTempIndexBuffer: function getTempIndexBuffer(sizeBytes) {
  var idx = GL.log2ceilLookup(sizeBytes);
  var ibo = GL.currentContext.tempIndexBuffers[idx];
  if (ibo) {
   return ibo;
  }
  var prevIBO = GLctx.getParameter(34965);
  /*ELEMENT_ARRAY_BUFFER_BINDING*/ GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
  GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ GL.currentContext.tempIndexBuffers[idx]);
  GLctx.bufferData(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ 1 << idx, 35048);
  /*GL_DYNAMIC_DRAW*/ GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ prevIBO);
  return GL.currentContext.tempIndexBuffers[idx];
 },
 newRenderingFrameStarted: function newRenderingFrameStarted() {
  if (!GL.currentContext) {
   return;
  }
  var vb = GL.currentContext.tempVertexBuffers1;
  GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
  GL.currentContext.tempVertexBuffers2 = vb;
  vb = GL.currentContext.tempVertexBufferCounters1;
  GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
  GL.currentContext.tempVertexBufferCounters2 = vb;
  var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
  for (var i = 0; i <= largestIndex; ++i) {
   GL.currentContext.tempVertexBufferCounters1[i] = 0;
  }
 },
 getSource: (shader, count, string, length) => {
  var source = "";
  for (var i = 0; i < count; ++i) {
   var len = length ? GROWABLE_HEAP_I32()[(((length) + (i * 4)) >> 2)] : -1;
   source += UTF8ToString(GROWABLE_HEAP_I32()[(((string) + (i * 4)) >> 2)], len < 0 ? undefined : len);
  }
  return source;
 },
 calcBufLength: function calcBufLength(size, type, stride, count) {
  if (stride > 0) {
   return count * stride;
  }
  var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
  return size * typeSize * count;
 },
 usedTempBuffers: [],
 preDrawHandleClientVertexAttribBindings: function preDrawHandleClientVertexAttribBindings(count) {
  GL.resetBufferBinding = false;
  for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
   var cb = GL.currentContext.clientBuffers[i];
   if (!cb.clientside || !cb.enabled) continue;
   GL.resetBufferBinding = true;
   var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
   var buf = GL.getTempVertexBuffer(size);
   GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ buf);
   GLctx.bufferSubData(34962, 0, GROWABLE_HEAP_U8().subarray(cb.ptr, cb.ptr + size));
   cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0);
  }
 },
 postDrawHandleClientVertexAttribBindings: function postDrawHandleClientVertexAttribBindings() {
  if (GL.resetBufferBinding) {
   GLctx.bindBuffer(34962, /*GL_ARRAY_BUFFER*/ GL.buffers[GLctx.currentArrayBufferBinding]);
  }
 },
 createContext: (/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  if (!canvas.getContextSafariWebGL2Fixed) {
   canvas.getContextSafariWebGL2Fixed = canvas.getContext;
   /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (Object|null)} */ function fixedGetContext(ver, attrs) {
    var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
    return ((ver == "webgl") == (gl instanceof WebGLRenderingContext)) ? gl : null;
   }
   canvas.getContext = fixedGetContext;
  }
  var ctx = (webGLContextAttributes.majorVersion > 1) ? canvas.getContext("webgl2", webGLContextAttributes) : (canvas.getContext("webgl", webGLContextAttributes));
  if (!ctx) return 0;
  var handle = GL.registerContext(ctx, webGLContextAttributes);
  return handle;
 },
 registerContext: (ctx, webGLContextAttributes) => {
  var handle = _malloc(8);
  GROWABLE_HEAP_I32()[(((handle) + (4)) >> 2)] = _pthread_self();
  var context = {
   handle: handle,
   attributes: webGLContextAttributes,
   version: webGLContextAttributes.majorVersion,
   GLctx: ctx
  };
  if (ctx.canvas) ctx.canvas.GLctxObject = context;
  GL.contexts[handle] = context;
  if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
   GL.initExtensions(context);
  }
  context.maxVertexAttribs = context.GLctx.getParameter(34921);
  /*GL_MAX_VERTEX_ATTRIBS*/ context.clientBuffers = [];
  for (var i = 0; i < context.maxVertexAttribs; i++) {
   context.clientBuffers[i] = {
    enabled: false,
    clientside: false,
    size: 0,
    type: 0,
    normalized: 0,
    stride: 0,
    ptr: 0,
    vertexAttribPointerAdaptor: null
   };
  }
  GL.generateTempBuffers(false, context);
  return handle;
 },
 makeContextCurrent: contextHandle => {
  GL.currentContext = GL.contexts[contextHandle];
  Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
  return !(contextHandle && !GLctx);
 },
 getContext: contextHandle => GL.contexts[contextHandle],
 deleteContext: contextHandle => {
  if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
  if (typeof JSEvents == "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
  if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
  _free(GL.contexts[contextHandle].handle);
  GL.contexts[contextHandle] = null;
 },
 initExtensions: context => {
  if (!context) context = GL.currentContext;
  if (context.initExtensionsDone) return;
  context.initExtensionsDone = true;
  var GLctx = context.GLctx;
  webgl_enable_ANGLE_instanced_arrays(GLctx);
  webgl_enable_OES_vertex_array_object(GLctx);
  webgl_enable_WEBGL_draw_buffers(GLctx);
  webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
  webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
  if (context.version >= 2) {
   GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2");
  }
  if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
   GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  }
  webgl_enable_WEBGL_multi_draw(GLctx);
  var exts = GLctx.getSupportedExtensions() || [];
  exts.forEach(ext => {
   if (!ext.includes("lose_context") && !ext.includes("debug")) {
    GLctx.getExtension(ext);
   }
  });
 }
};

/** @suppress {duplicate } */ function _glActiveTexture(x0) {
 GLctx.activeTexture(x0);
}

var _emscripten_glActiveTexture = _glActiveTexture;

/** @suppress {duplicate } */ var _glAttachShader = (program, shader) => {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};

var _emscripten_glAttachShader = _glAttachShader;

/** @suppress {duplicate } */ var _glBeginQuery = (target, id) => {
 GLctx.beginQuery(target, GL.queries[id]);
};

var _emscripten_glBeginQuery = _glBeginQuery;

/** @suppress {duplicate } */ var _glBeginQueryEXT = (target, id) => {
 GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id]);
};

var _emscripten_glBeginQueryEXT = _glBeginQueryEXT;

/** @suppress {duplicate } */ function _glBeginTransformFeedback(x0) {
 GLctx.beginTransformFeedback(x0);
}

var _emscripten_glBeginTransformFeedback = _glBeginTransformFeedback;

/** @suppress {duplicate } */ var _glBindAttribLocation = (program, index, name) => {
 GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
};

var _emscripten_glBindAttribLocation = _glBindAttribLocation;

/** @suppress {duplicate } */ var _glBindBuffer = (target, buffer) => {
 if (target == 34962) /*GL_ARRAY_BUFFER*/ {
  GLctx.currentArrayBufferBinding = buffer;
 } else if (target == 34963) /*GL_ELEMENT_ARRAY_BUFFER*/ {
  GLctx.currentElementArrayBufferBinding = buffer;
 }
 if (target == 35051) /*GL_PIXEL_PACK_BUFFER*/ {
  GLctx.currentPixelPackBufferBinding = buffer;
 } else if (target == 35052) /*GL_PIXEL_UNPACK_BUFFER*/ {
  GLctx.currentPixelUnpackBufferBinding = buffer;
 }
 GLctx.bindBuffer(target, GL.buffers[buffer]);
};

var _emscripten_glBindBuffer = _glBindBuffer;

/** @suppress {duplicate } */ var _glBindBufferBase = (target, index, buffer) => {
 GLctx.bindBufferBase(target, index, GL.buffers[buffer]);
};

var _emscripten_glBindBufferBase = _glBindBufferBase;

/** @suppress {duplicate } */ var _glBindBufferRange = (target, index, buffer, offset, ptrsize) => {
 GLctx.bindBufferRange(target, index, GL.buffers[buffer], offset, ptrsize);
};

var _emscripten_glBindBufferRange = _glBindBufferRange;

/** @suppress {duplicate } */ var _glBindFramebuffer = (target, framebuffer) => {
 GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
};

var _emscripten_glBindFramebuffer = _glBindFramebuffer;

/** @suppress {duplicate } */ var _glBindRenderbuffer = (target, renderbuffer) => {
 GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glBindRenderbuffer = _glBindRenderbuffer;

/** @suppress {duplicate } */ var _glBindSampler = (unit, sampler) => {
 GLctx.bindSampler(unit, GL.samplers[sampler]);
};

var _emscripten_glBindSampler = _glBindSampler;

/** @suppress {duplicate } */ var _glBindTexture = (target, texture) => {
 GLctx.bindTexture(target, GL.textures[texture]);
};

var _emscripten_glBindTexture = _glBindTexture;

/** @suppress {duplicate } */ var _glBindTransformFeedback = (target, id) => {
 GLctx.bindTransformFeedback(target, GL.transformFeedbacks[id]);
};

var _emscripten_glBindTransformFeedback = _glBindTransformFeedback;

/** @suppress {duplicate } */ var _glBindVertexArray = vao => {
 GLctx.bindVertexArray(GL.vaos[vao]);
 var ibo = GLctx.getParameter(34965);
 /*ELEMENT_ARRAY_BUFFER_BINDING*/ GLctx.currentElementArrayBufferBinding = ibo ? (ibo.name | 0) : 0;
};

var _emscripten_glBindVertexArray = _glBindVertexArray;

/** @suppress {duplicate } */ var _glBindVertexArrayOES = _glBindVertexArray;

var _emscripten_glBindVertexArrayOES = _glBindVertexArrayOES;

/** @suppress {duplicate } */ function _glBlendColor(x0, x1, x2, x3) {
 GLctx.blendColor(x0, x1, x2, x3);
}

var _emscripten_glBlendColor = _glBlendColor;

/** @suppress {duplicate } */ function _glBlendEquation(x0) {
 GLctx.blendEquation(x0);
}

var _emscripten_glBlendEquation = _glBlendEquation;

/** @suppress {duplicate } */ function _glBlendEquationSeparate(x0, x1) {
 GLctx.blendEquationSeparate(x0, x1);
}

var _emscripten_glBlendEquationSeparate = _glBlendEquationSeparate;

/** @suppress {duplicate } */ function _glBlendFunc(x0, x1) {
 GLctx.blendFunc(x0, x1);
}

var _emscripten_glBlendFunc = _glBlendFunc;

/** @suppress {duplicate } */ function _glBlendFuncSeparate(x0, x1, x2, x3) {
 GLctx.blendFuncSeparate(x0, x1, x2, x3);
}

var _emscripten_glBlendFuncSeparate = _glBlendFuncSeparate;

/** @suppress {duplicate } */ function _glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
 GLctx.blitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);
}

var _emscripten_glBlitFramebuffer = _glBlitFramebuffer;

/** @suppress {duplicate } */ var _glBufferData = (target, size, data, usage) => {
 if (GL.currentContext.version >= 2) {
  if (data && size) {
   GLctx.bufferData(target, GROWABLE_HEAP_U8(), usage, data, size);
  } else {
   GLctx.bufferData(target, size, usage);
  }
 } else {
  GLctx.bufferData(target, data ? GROWABLE_HEAP_U8().subarray(data, data + size) : size, usage);
 }
};

var _emscripten_glBufferData = _glBufferData;

/** @suppress {duplicate } */ var _glBufferSubData = (target, offset, size, data) => {
 if (GL.currentContext.version >= 2) {
  size && GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8(), data, size);
  return;
 }
 GLctx.bufferSubData(target, offset, GROWABLE_HEAP_U8().subarray(data, data + size));
};

var _emscripten_glBufferSubData = _glBufferSubData;

/** @suppress {duplicate } */ function _glCheckFramebufferStatus(x0) {
 return GLctx.checkFramebufferStatus(x0);
}

var _emscripten_glCheckFramebufferStatus = _glCheckFramebufferStatus;

/** @suppress {duplicate } */ function _glClear(x0) {
 GLctx.clear(x0);
}

var _emscripten_glClear = _glClear;

/** @suppress {duplicate } */ function _glClearBufferfi(x0, x1, x2, x3) {
 GLctx.clearBufferfi(x0, x1, x2, x3);
}

var _emscripten_glClearBufferfi = _glClearBufferfi;

/** @suppress {duplicate } */ var _glClearBufferfv = (buffer, drawbuffer, value) => {
 GLctx.clearBufferfv(buffer, drawbuffer, GROWABLE_HEAP_F32(), value >> 2);
};

var _emscripten_glClearBufferfv = _glClearBufferfv;

/** @suppress {duplicate } */ var _glClearBufferiv = (buffer, drawbuffer, value) => {
 GLctx.clearBufferiv(buffer, drawbuffer, GROWABLE_HEAP_I32(), value >> 2);
};

var _emscripten_glClearBufferiv = _glClearBufferiv;

/** @suppress {duplicate } */ var _glClearBufferuiv = (buffer, drawbuffer, value) => {
 GLctx.clearBufferuiv(buffer, drawbuffer, GROWABLE_HEAP_U32(), value >> 2);
};

var _emscripten_glClearBufferuiv = _glClearBufferuiv;

/** @suppress {duplicate } */ function _glClearColor(x0, x1, x2, x3) {
 GLctx.clearColor(x0, x1, x2, x3);
}

var _emscripten_glClearColor = _glClearColor;

/** @suppress {duplicate } */ function _glClearDepthf(x0) {
 GLctx.clearDepth(x0);
}

var _emscripten_glClearDepthf = _glClearDepthf;

/** @suppress {duplicate } */ function _glClearStencil(x0) {
 GLctx.clearStencil(x0);
}

var _emscripten_glClearStencil = _glClearStencil;

var convertI32PairToI53 = (lo, hi) => (lo >>> 0) + hi * 4294967296;

/** @suppress {duplicate } */ var _glClientWaitSync = (sync, flags, timeout_low, timeout_high) => {
 var timeout = convertI32PairToI53(timeout_low, timeout_high);
 return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
};

var _emscripten_glClientWaitSync = _glClientWaitSync;

/** @suppress {duplicate } */ var _glColorMask = (red, green, blue, alpha) => {
 GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
};

var _emscripten_glColorMask = _glColorMask;

/** @suppress {duplicate } */ var _glCompileShader = shader => {
 GLctx.compileShader(GL.shaders[shader]);
};

var _emscripten_glCompileShader = _glCompileShader;

/** @suppress {duplicate } */ var _glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
   GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
  } else {
   GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, GROWABLE_HEAP_U8(), data, imageSize);
  }
  return;
 }
 GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, data ? GROWABLE_HEAP_U8().subarray((data), (data + imageSize)) : null);
};

var _emscripten_glCompressedTexImage2D = _glCompressedTexImage2D;

/** @suppress {duplicate } */ var _glCompressedTexImage3D = (target, level, internalFormat, width, height, depth, border, imageSize, data) => {
 if (GLctx.currentPixelUnpackBufferBinding) {
  GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data);
 } else {
  GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, GROWABLE_HEAP_U8(), data, imageSize);
 }
};

var _emscripten_glCompressedTexImage3D = _glCompressedTexImage3D;

/** @suppress {duplicate } */ var _glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
   GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
  } else {
   GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, GROWABLE_HEAP_U8(), data, imageSize);
  }
  return;
 }
 GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, data ? GROWABLE_HEAP_U8().subarray((data), (data + imageSize)) : null);
};

var _emscripten_glCompressedTexSubImage2D = _glCompressedTexSubImage2D;

/** @suppress {duplicate } */ var _glCompressedTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) => {
 if (GLctx.currentPixelUnpackBufferBinding) {
  GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data);
 } else {
  GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, GROWABLE_HEAP_U8(), data, imageSize);
 }
};

var _emscripten_glCompressedTexSubImage3D = _glCompressedTexSubImage3D;

/** @suppress {duplicate } */ function _glCopyBufferSubData(x0, x1, x2, x3, x4) {
 GLctx.copyBufferSubData(x0, x1, x2, x3, x4);
}

var _emscripten_glCopyBufferSubData = _glCopyBufferSubData;

/** @suppress {duplicate } */ function _glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
 GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
}

var _emscripten_glCopyTexImage2D = _glCopyTexImage2D;

/** @suppress {duplicate } */ function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
 GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
}

var _emscripten_glCopyTexSubImage2D = _glCopyTexSubImage2D;

/** @suppress {duplicate } */ function _glCopyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8) {
 GLctx.copyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8);
}

var _emscripten_glCopyTexSubImage3D = _glCopyTexSubImage3D;

/** @suppress {duplicate } */ var _glCreateProgram = () => {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
 program.uniformIdCounter = 1;
 GL.programs[id] = program;
 return id;
};

var _emscripten_glCreateProgram = _glCreateProgram;

/** @suppress {duplicate } */ var _glCreateShader = shaderType => {
 var id = GL.getNewId(GL.shaders);
 GL.shaders[id] = GLctx.createShader(shaderType);
 return id;
};

var _emscripten_glCreateShader = _glCreateShader;

/** @suppress {duplicate } */ function _glCullFace(x0) {
 GLctx.cullFace(x0);
}

var _emscripten_glCullFace = _glCullFace;

/** @suppress {duplicate } */ var _glDeleteBuffers = (n, buffers) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((buffers) + (i * 4)) >> 2)];
  var buffer = GL.buffers[id];
  if (!buffer) continue;
  GLctx.deleteBuffer(buffer);
  buffer.name = 0;
  GL.buffers[id] = null;
  if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
  if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
  if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
  if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
 }
};

var _emscripten_glDeleteBuffers = _glDeleteBuffers;

/** @suppress {duplicate } */ var _glDeleteFramebuffers = (n, framebuffers) => {
 for (var i = 0; i < n; ++i) {
  var id = GROWABLE_HEAP_I32()[(((framebuffers) + (i * 4)) >> 2)];
  var framebuffer = GL.framebuffers[id];
  if (!framebuffer) continue;
  GLctx.deleteFramebuffer(framebuffer);
  framebuffer.name = 0;
  GL.framebuffers[id] = null;
 }
};

var _emscripten_glDeleteFramebuffers = _glDeleteFramebuffers;

/** @suppress {duplicate } */ var _glDeleteProgram = id => {
 if (!id) return;
 var program = GL.programs[id];
 if (!program) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GLctx.deleteProgram(program);
 program.name = 0;
 GL.programs[id] = null;
};

var _emscripten_glDeleteProgram = _glDeleteProgram;

/** @suppress {duplicate } */ var _glDeleteQueries = (n, ids) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((ids) + (i * 4)) >> 2)];
  var query = GL.queries[id];
  if (!query) continue;
  GLctx.deleteQuery(query);
  GL.queries[id] = null;
 }
};

var _emscripten_glDeleteQueries = _glDeleteQueries;

/** @suppress {duplicate } */ var _glDeleteQueriesEXT = (n, ids) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((ids) + (i * 4)) >> 2)];
  var query = GL.queries[id];
  if (!query) continue;
  GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
  GL.queries[id] = null;
 }
};

var _emscripten_glDeleteQueriesEXT = _glDeleteQueriesEXT;

/** @suppress {duplicate } */ var _glDeleteRenderbuffers = (n, renderbuffers) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((renderbuffers) + (i * 4)) >> 2)];
  var renderbuffer = GL.renderbuffers[id];
  if (!renderbuffer) continue;
  GLctx.deleteRenderbuffer(renderbuffer);
  renderbuffer.name = 0;
  GL.renderbuffers[id] = null;
 }
};

var _emscripten_glDeleteRenderbuffers = _glDeleteRenderbuffers;

/** @suppress {duplicate } */ var _glDeleteSamplers = (n, samplers) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((samplers) + (i * 4)) >> 2)];
  var sampler = GL.samplers[id];
  if (!sampler) continue;
  GLctx.deleteSampler(sampler);
  sampler.name = 0;
  GL.samplers[id] = null;
 }
};

var _emscripten_glDeleteSamplers = _glDeleteSamplers;

/** @suppress {duplicate } */ var _glDeleteShader = id => {
 if (!id) return;
 var shader = GL.shaders[id];
 if (!shader) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GLctx.deleteShader(shader);
 GL.shaders[id] = null;
};

var _emscripten_glDeleteShader = _glDeleteShader;

/** @suppress {duplicate } */ var _glDeleteSync = id => {
 if (!id) return;
 var sync = GL.syncs[id];
 if (!sync) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GLctx.deleteSync(sync);
 sync.name = 0;
 GL.syncs[id] = null;
};

var _emscripten_glDeleteSync = _glDeleteSync;

/** @suppress {duplicate } */ var _glDeleteTextures = (n, textures) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((textures) + (i * 4)) >> 2)];
  var texture = GL.textures[id];
  if (!texture) continue;
  GLctx.deleteTexture(texture);
  texture.name = 0;
  GL.textures[id] = null;
 }
};

var _emscripten_glDeleteTextures = _glDeleteTextures;

/** @suppress {duplicate } */ var _glDeleteTransformFeedbacks = (n, ids) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((ids) + (i * 4)) >> 2)];
  var transformFeedback = GL.transformFeedbacks[id];
  if (!transformFeedback) continue;
  GLctx.deleteTransformFeedback(transformFeedback);
  transformFeedback.name = 0;
  GL.transformFeedbacks[id] = null;
 }
};

var _emscripten_glDeleteTransformFeedbacks = _glDeleteTransformFeedbacks;

/** @suppress {duplicate } */ var _glDeleteVertexArrays = (n, vaos) => {
 for (var i = 0; i < n; i++) {
  var id = GROWABLE_HEAP_I32()[(((vaos) + (i * 4)) >> 2)];
  GLctx.deleteVertexArray(GL.vaos[id]);
  GL.vaos[id] = null;
 }
};

var _emscripten_glDeleteVertexArrays = _glDeleteVertexArrays;

/** @suppress {duplicate } */ var _glDeleteVertexArraysOES = _glDeleteVertexArrays;

var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArraysOES;

/** @suppress {duplicate } */ function _glDepthFunc(x0) {
 GLctx.depthFunc(x0);
}

var _emscripten_glDepthFunc = _glDepthFunc;

/** @suppress {duplicate } */ var _glDepthMask = flag => {
 GLctx.depthMask(!!flag);
};

var _emscripten_glDepthMask = _glDepthMask;

/** @suppress {duplicate } */ function _glDepthRangef(x0, x1) {
 GLctx.depthRange(x0, x1);
}

var _emscripten_glDepthRangef = _glDepthRangef;

/** @suppress {duplicate } */ var _glDetachShader = (program, shader) => {
 GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
};

var _emscripten_glDetachShader = _glDetachShader;

/** @suppress {duplicate } */ function _glDisable(x0) {
 GLctx.disable(x0);
}

var _emscripten_glDisable = _glDisable;

/** @suppress {duplicate } */ var _glDisableVertexAttribArray = index => {
 var cb = GL.currentContext.clientBuffers[index];
 cb.enabled = false;
 GLctx.disableVertexAttribArray(index);
};

var _emscripten_glDisableVertexAttribArray = _glDisableVertexAttribArray;

/** @suppress {duplicate } */ var _glDrawArrays = (mode, first, count) => {
 GL.preDrawHandleClientVertexAttribBindings(first + count);
 GLctx.drawArrays(mode, first, count);
 GL.postDrawHandleClientVertexAttribBindings();
};

var _emscripten_glDrawArrays = _glDrawArrays;

/** @suppress {duplicate } */ var _glDrawArraysInstanced = (mode, first, count, primcount) => {
 GLctx.drawArraysInstanced(mode, first, count, primcount);
};

var _emscripten_glDrawArraysInstanced = _glDrawArraysInstanced;

/** @suppress {duplicate } */ var _glDrawArraysInstancedANGLE = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstancedANGLE;

/** @suppress {duplicate } */ var _glDrawArraysInstancedARB = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedARB = _glDrawArraysInstancedARB;

/** @suppress {duplicate } */ var _glDrawArraysInstancedEXT = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedEXT = _glDrawArraysInstancedEXT;

/** @suppress {duplicate } */ var _glDrawArraysInstancedNV = _glDrawArraysInstanced;

var _emscripten_glDrawArraysInstancedNV = _glDrawArraysInstancedNV;

var tempFixedLengthArray = [];

/** @suppress {duplicate } */ var _glDrawBuffers = (n, bufs) => {
 var bufArray = tempFixedLengthArray[n];
 for (var i = 0; i < n; i++) {
  bufArray[i] = GROWABLE_HEAP_I32()[(((bufs) + (i * 4)) >> 2)];
 }
 GLctx.drawBuffers(bufArray);
};

var _emscripten_glDrawBuffers = _glDrawBuffers;

/** @suppress {duplicate } */ var _glDrawBuffersEXT = _glDrawBuffers;

var _emscripten_glDrawBuffersEXT = _glDrawBuffersEXT;

/** @suppress {duplicate } */ var _glDrawBuffersWEBGL = _glDrawBuffers;

var _emscripten_glDrawBuffersWEBGL = _glDrawBuffersWEBGL;

/** @suppress {duplicate } */ var _glDrawElements = (mode, count, type, indices) => {
 var buf;
 if (!GLctx.currentElementArrayBufferBinding) {
  var size = GL.calcBufLength(1, type, 0, count);
  buf = GL.getTempIndexBuffer(size);
  GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ buf);
  GLctx.bufferSubData(34963, 0, GROWABLE_HEAP_U8().subarray(indices, indices + size));
  indices = 0;
 }
 GL.preDrawHandleClientVertexAttribBindings(count);
 GLctx.drawElements(mode, count, type, indices);
 GL.postDrawHandleClientVertexAttribBindings(count);
 if (!GLctx.currentElementArrayBufferBinding) {
  GLctx.bindBuffer(34963, /*GL_ELEMENT_ARRAY_BUFFER*/ null);
 }
};

var _emscripten_glDrawElements = _glDrawElements;

/** @suppress {duplicate } */ var _glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
 GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
};

var _emscripten_glDrawElementsInstanced = _glDrawElementsInstanced;

/** @suppress {duplicate } */ var _glDrawElementsInstancedANGLE = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstancedANGLE;

/** @suppress {duplicate } */ var _glDrawElementsInstancedARB = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedARB = _glDrawElementsInstancedARB;

/** @suppress {duplicate } */ var _glDrawElementsInstancedEXT = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedEXT = _glDrawElementsInstancedEXT;

/** @suppress {duplicate } */ var _glDrawElementsInstancedNV = _glDrawElementsInstanced;

var _emscripten_glDrawElementsInstancedNV = _glDrawElementsInstancedNV;

/** @suppress {duplicate } */ var _glDrawRangeElements = (mode, start, end, count, type, indices) => {
 _glDrawElements(mode, count, type, indices);
};

var _emscripten_glDrawRangeElements = _glDrawRangeElements;

/** @suppress {duplicate } */ function _glEnable(x0) {
 GLctx.enable(x0);
}

var _emscripten_glEnable = _glEnable;

/** @suppress {duplicate } */ var _glEnableVertexAttribArray = index => {
 var cb = GL.currentContext.clientBuffers[index];
 cb.enabled = true;
 GLctx.enableVertexAttribArray(index);
};

var _emscripten_glEnableVertexAttribArray = _glEnableVertexAttribArray;

/** @suppress {duplicate } */ function _glEndQuery(x0) {
 GLctx.endQuery(x0);
}

var _emscripten_glEndQuery = _glEndQuery;

/** @suppress {duplicate } */ var _glEndQueryEXT = target => {
 GLctx.disjointTimerQueryExt["endQueryEXT"](target);
};

var _emscripten_glEndQueryEXT = _glEndQueryEXT;

/** @suppress {duplicate } */ function _glEndTransformFeedback() {
 GLctx.endTransformFeedback();
}

var _emscripten_glEndTransformFeedback = _glEndTransformFeedback;

/** @suppress {duplicate } */ var _glFenceSync = (condition, flags) => {
 var sync = GLctx.fenceSync(condition, flags);
 if (sync) {
  var id = GL.getNewId(GL.syncs);
  sync.name = id;
  GL.syncs[id] = sync;
  return id;
 }
 return 0;
};

var _emscripten_glFenceSync = _glFenceSync;

/** @suppress {duplicate } */ function _glFinish() {
 GLctx.finish();
}

var _emscripten_glFinish = _glFinish;

/** @suppress {duplicate } */ function _glFlush() {
 GLctx.flush();
}

var _emscripten_glFlush = _glFlush;

var emscriptenWebGLGetBufferBinding = target => {
 switch (target) {
 case 34962:
  /*GL_ARRAY_BUFFER*/ target = 34964;
  /*GL_ARRAY_BUFFER_BINDING*/ break;

 case 34963:
  /*GL_ELEMENT_ARRAY_BUFFER*/ target = 34965;
  /*GL_ELEMENT_ARRAY_BUFFER_BINDING*/ break;

 case 35051:
  /*GL_PIXEL_PACK_BUFFER*/ target = 35053;
  /*GL_PIXEL_PACK_BUFFER_BINDING*/ break;

 case 35052:
  /*GL_PIXEL_UNPACK_BUFFER*/ target = 35055;
  /*GL_PIXEL_UNPACK_BUFFER_BINDING*/ break;

 case 35982:
  /*GL_TRANSFORM_FEEDBACK_BUFFER*/ target = 35983;
  /*GL_TRANSFORM_FEEDBACK_BUFFER_BINDING*/ break;

 case 36662:
  /*GL_COPY_READ_BUFFER*/ target = 36662;
  /*GL_COPY_READ_BUFFER_BINDING*/ break;

 case 36663:
  /*GL_COPY_WRITE_BUFFER*/ target = 36663;
  /*GL_COPY_WRITE_BUFFER_BINDING*/ break;

 case 35345:
  /*GL_UNIFORM_BUFFER*/ target = 35368;
  /*GL_UNIFORM_BUFFER_BINDING*/ break;
 }
 var buffer = GLctx.getParameter(target);
 if (buffer) return buffer.name | 0; else return 0;
};

var emscriptenWebGLValidateMapBufferTarget = target => {
 switch (target) {
 case 34962:
 case 34963:
 case 36662:
 case 36663:
 case 35051:
 case 35052:
 case 35882:
 case 35982:
 case 35345:
  return true;

 default:
  return false;
 }
};

/** @suppress {duplicate } */ var _glFlushMappedBufferRange = (target, offset, length) => {
 if (!emscriptenWebGLValidateMapBufferTarget(target)) {
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ err("GL_INVALID_ENUM in glFlushMappedBufferRange");
  return;
 }
 var mapping = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
 if (!mapping) {
  GL.recordError(1282);
  /* GL_INVALID_OPERATION */ err("buffer was never mapped in glFlushMappedBufferRange");
  return;
 }
 if (!(mapping.access & 16)) {
  GL.recordError(1282);
  /* GL_INVALID_OPERATION */ err("buffer was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT in glFlushMappedBufferRange");
  return;
 }
 if (offset < 0 || length < 0 || offset + length > mapping.length) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ err("invalid range in glFlushMappedBufferRange");
  return;
 }
 GLctx.bufferSubData(target, mapping.offset, GROWABLE_HEAP_U8().subarray(mapping.mem + offset, mapping.mem + offset + length));
};

var _emscripten_glFlushMappedBufferRange = _glFlushMappedBufferRange;

/** @suppress {duplicate } */ var _glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
 GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
};

var _emscripten_glFramebufferRenderbuffer = _glFramebufferRenderbuffer;

/** @suppress {duplicate } */ var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
 GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
};

var _emscripten_glFramebufferTexture2D = _glFramebufferTexture2D;

/** @suppress {duplicate } */ var _glFramebufferTextureLayer = (target, attachment, texture, level, layer) => {
 GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
};

var _emscripten_glFramebufferTextureLayer = _glFramebufferTextureLayer;

/** @suppress {duplicate } */ function _glFrontFace(x0) {
 GLctx.frontFace(x0);
}

var _emscripten_glFrontFace = _glFrontFace;

var __glGenObject = (n, buffers, createFunction, objectTable) => {
 for (var i = 0; i < n; i++) {
  var buffer = GLctx[createFunction]();
  var id = buffer && GL.getNewId(objectTable);
  if (buffer) {
   buffer.name = id;
   objectTable[id] = buffer;
  } else {
   GL.recordError(1282);
  }
  GROWABLE_HEAP_I32()[(((buffers) + (i * 4)) >> 2)] = id;
 }
};

/** @suppress {duplicate } */ var _glGenBuffers = (n, buffers) => {
 __glGenObject(n, buffers, "createBuffer", GL.buffers);
};

var _emscripten_glGenBuffers = _glGenBuffers;

/** @suppress {duplicate } */ var _glGenFramebuffers = (n, ids) => {
 __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
};

var _emscripten_glGenFramebuffers = _glGenFramebuffers;

/** @suppress {duplicate } */ var _glGenQueries = (n, ids) => {
 __glGenObject(n, ids, "createQuery", GL.queries);
};

var _emscripten_glGenQueries = _glGenQueries;

/** @suppress {duplicate } */ var _glGenQueriesEXT = (n, ids) => {
 for (var i = 0; i < n; i++) {
  var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
  if (!query) {
   GL.recordError(1282);
   /* GL_INVALID_OPERATION */ while (i < n) GROWABLE_HEAP_I32()[(((ids) + (i++ * 4)) >> 2)] = 0;
   return;
  }
  var id = GL.getNewId(GL.queries);
  query.name = id;
  GL.queries[id] = query;
  GROWABLE_HEAP_I32()[(((ids) + (i * 4)) >> 2)] = id;
 }
};

var _emscripten_glGenQueriesEXT = _glGenQueriesEXT;

/** @suppress {duplicate } */ var _glGenRenderbuffers = (n, renderbuffers) => {
 __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
};

var _emscripten_glGenRenderbuffers = _glGenRenderbuffers;

/** @suppress {duplicate } */ var _glGenSamplers = (n, samplers) => {
 __glGenObject(n, samplers, "createSampler", GL.samplers);
};

var _emscripten_glGenSamplers = _glGenSamplers;

/** @suppress {duplicate } */ var _glGenTextures = (n, textures) => {
 __glGenObject(n, textures, "createTexture", GL.textures);
};

var _emscripten_glGenTextures = _glGenTextures;

/** @suppress {duplicate } */ var _glGenTransformFeedbacks = (n, ids) => {
 __glGenObject(n, ids, "createTransformFeedback", GL.transformFeedbacks);
};

var _emscripten_glGenTransformFeedbacks = _glGenTransformFeedbacks;

/** @suppress {duplicate } */ function _glGenVertexArrays(n, arrays) {
 __glGenObject(n, arrays, "createVertexArray", GL.vaos);
}

var _emscripten_glGenVertexArrays = _glGenVertexArrays;

/** @suppress {duplicate } */ var _glGenVertexArraysOES = _glGenVertexArrays;

var _emscripten_glGenVertexArraysOES = _glGenVertexArraysOES;

/** @suppress {duplicate } */ function _glGenerateMipmap(x0) {
 GLctx.generateMipmap(x0);
}

var _emscripten_glGenerateMipmap = _glGenerateMipmap;

var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
 program = GL.programs[program];
 var info = GLctx[funcName](program, index);
 if (info) {
  var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
  if (size) GROWABLE_HEAP_I32()[((size) >> 2)] = info.size;
  if (type) GROWABLE_HEAP_I32()[((type) >> 2)] = info.type;
 }
};

/** @suppress {duplicate } */ var _glGetActiveAttrib = (program, index, bufSize, length, size, type, name) => {
 __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name);
};

var _emscripten_glGetActiveAttrib = _glGetActiveAttrib;

/** @suppress {duplicate } */ var _glGetActiveUniform = (program, index, bufSize, length, size, type, name) => {
 __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name);
};

var _emscripten_glGetActiveUniform = _glGetActiveUniform;

/** @suppress {duplicate } */ var _glGetActiveUniformBlockName = (program, uniformBlockIndex, bufSize, length, uniformBlockName) => {
 program = GL.programs[program];
 var result = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
 if (!result) return;
 if (uniformBlockName && bufSize > 0) {
  var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
 } else {
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = 0;
 }
};

var _emscripten_glGetActiveUniformBlockName = _glGetActiveUniformBlockName;

/** @suppress {duplicate } */ var _glGetActiveUniformBlockiv = (program, uniformBlockIndex, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 if (pname == 35393) /* GL_UNIFORM_BLOCK_NAME_LENGTH */ {
  var name = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
  GROWABLE_HEAP_I32()[((params) >> 2)] = name.length + 1;
  return;
 }
 var result = GLctx.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
 if (result === null) return;
 if (pname == 35395) /*GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES*/ {
  for (var i = 0; i < result.length; i++) {
   GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = result[i];
  }
 } else {
  GROWABLE_HEAP_I32()[((params) >> 2)] = result;
 }
};

var _emscripten_glGetActiveUniformBlockiv = _glGetActiveUniformBlockiv;

/** @suppress {duplicate } */ var _glGetActiveUniformsiv = (program, uniformCount, uniformIndices, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (uniformCount > 0 && uniformIndices == 0) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 var ids = [];
 for (var i = 0; i < uniformCount; i++) {
  ids.push(GROWABLE_HEAP_I32()[(((uniformIndices) + (i * 4)) >> 2)]);
 }
 var result = GLctx.getActiveUniforms(program, ids, pname);
 if (!result) return;
 var len = result.length;
 for (var i = 0; i < len; i++) {
  GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = result[i];
 }
};

var _emscripten_glGetActiveUniformsiv = _glGetActiveUniformsiv;

/** @suppress {duplicate } */ var _glGetAttachedShaders = (program, maxCount, count, shaders) => {
 var result = GLctx.getAttachedShaders(GL.programs[program]);
 var len = result.length;
 if (len > maxCount) {
  len = maxCount;
 }
 GROWABLE_HEAP_I32()[((count) >> 2)] = len;
 for (var i = 0; i < len; ++i) {
  var id = GL.shaders.indexOf(result[i]);
  GROWABLE_HEAP_I32()[(((shaders) + (i * 4)) >> 2)] = id;
 }
};

var _emscripten_glGetAttachedShaders = _glGetAttachedShaders;

/** @suppress {duplicate } */ var _glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));

var _emscripten_glGetAttribLocation = _glGetAttribLocation;

var writeI53ToI64 = (ptr, num) => {
 GROWABLE_HEAP_U32()[((ptr) >> 2)] = num;
 var lower = GROWABLE_HEAP_U32()[((ptr) >> 2)];
 GROWABLE_HEAP_U32()[(((ptr) + (4)) >> 2)] = (num - lower) / 4294967296;
};

var emscriptenWebGLGet = (name_, p, type) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var ret = undefined;
 switch (name_) {
 case 36346:
  ret = 1;
  break;

 case 36344:
  if (type != 0 && type != 1) {
   GL.recordError(1280);
  }
  return;

 case 34814:
 case 36345:
  ret = 0;
  break;

 case 34466:
  var formats = GLctx.getParameter(34467);
  /*GL_COMPRESSED_TEXTURE_FORMATS*/ ret = formats ? formats.length : 0;
  break;

 case 33309:
  if (GL.currentContext.version < 2) {
   GL.recordError(1282);
   return;
  }
  var exts = GLctx.getSupportedExtensions() || [];
  ret = 2 * exts.length;
  break;

 case 33307:
 case 33308:
  if (GL.currentContext.version < 2) {
   GL.recordError(1280);
   return;
  }
  ret = name_ == 33307 ? 3 : 0;
  break;
 }
 if (ret === undefined) {
  var result = GLctx.getParameter(name_);
  switch (typeof result) {
  case "number":
   ret = result;
   break;

  case "boolean":
   ret = result ? 1 : 0;
   break;

  case "string":
   GL.recordError(1280);
   return;

  case "object":
   if (result === null) {
    switch (name_) {
    case 34964:
    case 35725:
    case 34965:
    case 36006:
    case 36007:
    case 32873:
    case 34229:
    case 36662:
    case 36663:
    case 35053:
    case 35055:
    case 36010:
    case 35097:
    case 35869:
    case 32874:
    case 36389:
    case 35983:
    case 35368:
    case 34068:
     {
      ret = 0;
      break;
     }

    default:
     {
      GL.recordError(1280);
      return;
     }
    }
   } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
    for (var i = 0; i < result.length; ++i) {
     switch (type) {
     case 0:
      GROWABLE_HEAP_I32()[(((p) + (i * 4)) >> 2)] = result[i];
      break;

     case 2:
      GROWABLE_HEAP_F32()[(((p) + (i * 4)) >> 2)] = result[i];
      break;

     case 4:
      GROWABLE_HEAP_I8()[(((p) + (i)) >> 0)] = result[i] ? 1 : 0;
      break;
     }
    }
    return;
   } else {
    try {
     ret = result.name | 0;
    } catch (e) {
     GL.recordError(1280);
     err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
     return;
    }
   }
   break;

  default:
   GL.recordError(1280);
   err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof (result) + "!");
   return;
  }
 }
 switch (type) {
 case 1:
  writeI53ToI64(p, ret);
  break;

 case 0:
  GROWABLE_HEAP_I32()[((p) >> 2)] = ret;
  break;

 case 2:
  GROWABLE_HEAP_F32()[((p) >> 2)] = ret;
  break;

 case 4:
  GROWABLE_HEAP_I8()[((p) >> 0)] = ret ? 1 : 0;
  break;
 }
};

/** @suppress {duplicate } */ var _glGetBooleanv = (name_, p) => {
 emscriptenWebGLGet(name_, p, 4);
};

var _emscripten_glGetBooleanv = _glGetBooleanv;

/** @suppress {duplicate } */ var _glGetBufferParameteri64v = (target, value, data) => {
 if (!data) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 writeI53ToI64(data, GLctx.getBufferParameter(target, value));
};

var _emscripten_glGetBufferParameteri64v = _glGetBufferParameteri64v;

/** @suppress {duplicate } */ var _glGetBufferParameteriv = (target, value, data) => {
 if (!data) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((data) >> 2)] = GLctx.getBufferParameter(target, value);
};

var _emscripten_glGetBufferParameteriv = _glGetBufferParameteriv;

/** @suppress {duplicate } */ var _glGetBufferPointerv = (target, pname, params) => {
 if (pname == 35005) /*GL_BUFFER_MAP_POINTER*/ {
  var ptr = 0;
  var mappedBuffer = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
  if (mappedBuffer) {
   ptr = mappedBuffer.mem;
  }
  GROWABLE_HEAP_I32()[((params) >> 2)] = ptr;
 } else {
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ err("GL_INVALID_ENUM in glGetBufferPointerv");
 }
};

var _emscripten_glGetBufferPointerv = _glGetBufferPointerv;

/** @suppress {duplicate } */ var _glGetError = () => {
 var error = GLctx.getError() || GL.lastError;
 GL.lastError = 0;
 /*GL_NO_ERROR*/ return error;
};

var _emscripten_glGetError = _glGetError;

/** @suppress {duplicate } */ var _glGetFloatv = (name_, p) => {
 emscriptenWebGLGet(name_, p, 2);
};

var _emscripten_glGetFloatv = _glGetFloatv;

/** @suppress {duplicate } */ var _glGetFragDataLocation = (program, name) => GLctx.getFragDataLocation(GL.programs[program], UTF8ToString(name));

var _emscripten_glGetFragDataLocation = _glGetFragDataLocation;

/** @suppress {duplicate } */ var _glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
 var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
 if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
  result = result.name | 0;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = result;
};

var _emscripten_glGetFramebufferAttachmentParameteriv = _glGetFramebufferAttachmentParameteriv;

var emscriptenWebGLGetIndexed = (target, index, data, type) => {
 if (!data) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var result = GLctx.getIndexedParameter(target, index);
 var ret;
 switch (typeof result) {
 case "boolean":
  ret = result ? 1 : 0;
  break;

 case "number":
  ret = result;
  break;

 case "object":
  if (result === null) {
   switch (target) {
   case 35983:
   case 35368:
    ret = 0;
    break;

   default:
    {
     GL.recordError(1280);
     return;
    }
   }
  } else if (result instanceof WebGLBuffer) {
   ret = result.name | 0;
  } else {
   GL.recordError(1280);
   return;
  }
  break;

 default:
  GL.recordError(1280);
  return;
 }
 switch (type) {
 case 1:
  writeI53ToI64(data, ret);
  break;

 case 0:
  GROWABLE_HEAP_I32()[((data) >> 2)] = ret;
  break;

 case 2:
  GROWABLE_HEAP_F32()[((data) >> 2)] = ret;
  break;

 case 4:
  GROWABLE_HEAP_I8()[((data) >> 0)] = ret ? 1 : 0;
  break;

 default:
  throw "internal emscriptenWebGLGetIndexed() error, bad type: " + type;
 }
};

/** @suppress {duplicate } */ var _glGetInteger64i_v = (target, index, data) => emscriptenWebGLGetIndexed(target, index, data, 1);

var _emscripten_glGetInteger64i_v = _glGetInteger64i_v;

/** @suppress {duplicate } */ var _glGetInteger64v = (name_, p) => {
 emscriptenWebGLGet(name_, p, 1);
};

var _emscripten_glGetInteger64v = _glGetInteger64v;

/** @suppress {duplicate } */ var _glGetIntegeri_v = (target, index, data) => emscriptenWebGLGetIndexed(target, index, data, 0);

var _emscripten_glGetIntegeri_v = _glGetIntegeri_v;

/** @suppress {duplicate } */ var _glGetIntegerv = (name_, p) => {
 emscriptenWebGLGet(name_, p, 0);
};

var _emscripten_glGetIntegerv = _glGetIntegerv;

/** @suppress {duplicate } */ var _glGetInternalformativ = (target, internalformat, pname, bufSize, params) => {
 if (bufSize < 0) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var ret = GLctx.getInternalformatParameter(target, internalformat, pname);
 if (ret === null) return;
 for (var i = 0; i < ret.length && i < bufSize; ++i) {
  GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = ret[i];
 }
};

var _emscripten_glGetInternalformativ = _glGetInternalformativ;

/** @suppress {duplicate } */ var _glGetProgramBinary = (program, bufSize, length, binaryFormat, binary) => {
 GL.recordError(1282);
};

/*GL_INVALID_OPERATION*/ var _emscripten_glGetProgramBinary = _glGetProgramBinary;

/** @suppress {duplicate } */ var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetProgramInfoLog = _glGetProgramInfoLog;

/** @suppress {duplicate } */ var _glGetProgramiv = (program, pname, p) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (program >= GL.counter) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 if (pname == 35716) {
  var log = GLctx.getProgramInfoLog(program);
  if (log === null) log = "(unknown error)";
  GROWABLE_HEAP_I32()[((p) >> 2)] = log.length + 1;
 } else if (pname == 35719) /* GL_ACTIVE_UNIFORM_MAX_LENGTH */ {
  if (!program.maxUniformLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35718); /*GL_ACTIVE_UNIFORMS*/ ++i) {
    program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxUniformLength;
 } else if (pname == 35722) /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */ {
  if (!program.maxAttributeLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35721); /*GL_ACTIVE_ATTRIBUTES*/ ++i) {
    program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxAttributeLength;
 } else if (pname == 35381) /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */ {
  if (!program.maxUniformBlockNameLength) {
   for (var i = 0; i < GLctx.getProgramParameter(program, 35382); /*GL_ACTIVE_UNIFORM_BLOCKS*/ ++i) {
    program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1);
   }
  }
  GROWABLE_HEAP_I32()[((p) >> 2)] = program.maxUniformBlockNameLength;
 } else {
  GROWABLE_HEAP_I32()[((p) >> 2)] = GLctx.getProgramParameter(program, pname);
 }
};

var _emscripten_glGetProgramiv = _glGetProgramiv;

/** @suppress {duplicate } */ var _glGetQueryObjecti64vEXT = (id, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var query = GL.queries[id];
 var param;
 if (GL.currentContext.version < 2) {
  param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 } else {
  param = GLctx.getQueryParameter(query, pname);
 }
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 writeI53ToI64(params, ret);
};

var _emscripten_glGetQueryObjecti64vEXT = _glGetQueryObjecti64vEXT;

/** @suppress {duplicate } */ var _glGetQueryObjectivEXT = (id, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var query = GL.queries[id];
 var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = ret;
};

var _emscripten_glGetQueryObjectivEXT = _glGetQueryObjectivEXT;

/** @suppress {duplicate } */ var _glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;

var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjectui64vEXT;

/** @suppress {duplicate } */ var _glGetQueryObjectuiv = (id, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var query = GL.queries[id];
 var param = GLctx.getQueryParameter(query, pname);
 var ret;
 if (typeof param == "boolean") {
  ret = param ? 1 : 0;
 } else {
  ret = param;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = ret;
};

var _emscripten_glGetQueryObjectuiv = _glGetQueryObjectuiv;

/** @suppress {duplicate } */ var _glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;

var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectuivEXT;

/** @suppress {duplicate } */ var _glGetQueryiv = (target, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = GLctx.getQuery(target, pname);
};

var _emscripten_glGetQueryiv = _glGetQueryiv;

/** @suppress {duplicate } */ var _glGetQueryivEXT = (target, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname);
};

var _emscripten_glGetQueryivEXT = _glGetQueryivEXT;

/** @suppress {duplicate } */ var _glGetRenderbufferParameteriv = (target, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = GLctx.getRenderbufferParameter(target, pname);
};

var _emscripten_glGetRenderbufferParameteriv = _glGetRenderbufferParameteriv;

/** @suppress {duplicate } */ var _glGetSamplerParameterfv = (sampler, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_F32()[((params) >> 2)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
};

var _emscripten_glGetSamplerParameterfv = _glGetSamplerParameterfv;

/** @suppress {duplicate } */ var _glGetSamplerParameteriv = (sampler, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
};

var _emscripten_glGetSamplerParameteriv = _glGetSamplerParameteriv;

/** @suppress {duplicate } */ var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
 var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
 if (log === null) log = "(unknown error)";
 var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
 if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetShaderInfoLog = _glGetShaderInfoLog;

/** @suppress {duplicate } */ var _glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
 var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
 GROWABLE_HEAP_I32()[((range) >> 2)] = result.rangeMin;
 GROWABLE_HEAP_I32()[(((range) + (4)) >> 2)] = result.rangeMax;
 GROWABLE_HEAP_I32()[((precision) >> 2)] = result.precision;
};

var _emscripten_glGetShaderPrecisionFormat = _glGetShaderPrecisionFormat;

/** @suppress {duplicate } */ var _glGetShaderSource = (shader, bufSize, length, source) => {
 var result = GLctx.getShaderSource(GL.shaders[shader]);
 if (!result) return;
 var numBytesWrittenExclNull = (bufSize > 0 && source) ? stringToUTF8(result, source, bufSize) : 0;
 if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
};

var _emscripten_glGetShaderSource = _glGetShaderSource;

/** @suppress {duplicate } */ var _glGetShaderiv = (shader, pname, p) => {
 if (!p) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (pname == 35716) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  var logLength = log ? log.length + 1 : 0;
  GROWABLE_HEAP_I32()[((p) >> 2)] = logLength;
 } else if (pname == 35720) {
  var source = GLctx.getShaderSource(GL.shaders[shader]);
  var sourceLength = source ? source.length + 1 : 0;
  GROWABLE_HEAP_I32()[((p) >> 2)] = sourceLength;
 } else {
  GROWABLE_HEAP_I32()[((p) >> 2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
};

var _emscripten_glGetShaderiv = _glGetShaderiv;

var stringToNewUTF8 = str => {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8(str, ret, size);
 return ret;
};

/** @suppress {duplicate } */ var _glGetString = name_ => {
 var ret = GL.stringCache[name_];
 if (!ret) {
  switch (name_) {
  case 7939:
   /* GL_EXTENSIONS */ var exts = GLctx.getSupportedExtensions() || [];
   exts = exts.concat(exts.map(e => "GL_" + e));
   ret = stringToNewUTF8(exts.join(" "));
   break;

  case 7936:
  /* GL_VENDOR */ case 7937:
  /* GL_RENDERER */ case 37445:
  /* UNMASKED_VENDOR_WEBGL */ case 37446:
   /* UNMASKED_RENDERER_WEBGL */ var s = GLctx.getParameter(name_);
   if (!s) {
    GL.recordError(1280);
   }
   ret = s && stringToNewUTF8(s);
   break;

  case 7938:
   /* GL_VERSION */ var glVersion = GLctx.getParameter(7938);
   if (GL.currentContext.version >= 2) glVersion = "OpenGL ES 3.0 (" + glVersion + ")"; else {
    glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
   }
   ret = stringToNewUTF8(glVersion);
   break;

  case 35724:
   /* GL_SHADING_LANGUAGE_VERSION */ var glslVersion = GLctx.getParameter(35724);
   var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
   var ver_num = glslVersion.match(ver_re);
   if (ver_num !== null) {
    if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
    glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
   }
   ret = stringToNewUTF8(glslVersion);
   break;

  default:
   GL.recordError(1280);
  }
  GL.stringCache[name_] = ret;
 }
 return ret;
};

var _emscripten_glGetString = _glGetString;

/** @suppress {duplicate } */ var _glGetStringi = (name, index) => {
 if (GL.currentContext.version < 2) {
  GL.recordError(1282);
  return 0;
 }
 var stringiCache = GL.stringiCache[name];
 if (stringiCache) {
  if (index < 0 || index >= stringiCache.length) {
   GL.recordError(1281);
   /*GL_INVALID_VALUE*/ return 0;
  }
  return stringiCache[index];
 }
 switch (name) {
 case 7939:
  /* GL_EXTENSIONS */ var exts = GLctx.getSupportedExtensions() || [];
  exts = exts.concat(exts.map(function(e) {
   return "GL_" + e;
  }));
  exts = exts.map(function(e) {
   return stringToNewUTF8(e);
  });
  stringiCache = GL.stringiCache[name] = exts;
  if (index < 0 || index >= stringiCache.length) {
   GL.recordError(1281);
   /*GL_INVALID_VALUE*/ return 0;
  }
  return stringiCache[index];

 default:
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ return 0;
 }
};

var _emscripten_glGetStringi = _glGetStringi;

/** @suppress {duplicate } */ var _glGetSynciv = (sync, pname, bufSize, length, values) => {
 if (bufSize < 0) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (!values) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
 if (ret !== null) {
  GROWABLE_HEAP_I32()[((values) >> 2)] = ret;
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = 1;
 }
};

var _emscripten_glGetSynciv = _glGetSynciv;

/** @suppress {duplicate } */ var _glGetTexParameterfv = (target, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_F32()[((params) >> 2)] = GLctx.getTexParameter(target, pname);
};

var _emscripten_glGetTexParameterfv = _glGetTexParameterfv;

/** @suppress {duplicate } */ var _glGetTexParameteriv = (target, pname, params) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 GROWABLE_HEAP_I32()[((params) >> 2)] = GLctx.getTexParameter(target, pname);
};

var _emscripten_glGetTexParameteriv = _glGetTexParameteriv;

/** @suppress {duplicate } */ var _glGetTransformFeedbackVarying = (program, index, bufSize, length, size, type, name) => {
 program = GL.programs[program];
 var info = GLctx.getTransformFeedbackVarying(program, index);
 if (!info) return;
 if (name && bufSize > 0) {
  var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = numBytesWrittenExclNull;
 } else {
  if (length) GROWABLE_HEAP_I32()[((length) >> 2)] = 0;
 }
 if (size) GROWABLE_HEAP_I32()[((size) >> 2)] = info.size;
 if (type) GROWABLE_HEAP_I32()[((type) >> 2)] = info.type;
};

var _emscripten_glGetTransformFeedbackVarying = _glGetTransformFeedbackVarying;

/** @suppress {duplicate } */ var _glGetUniformBlockIndex = (program, uniformBlockName) => GLctx.getUniformBlockIndex(GL.programs[program], UTF8ToString(uniformBlockName));

var _emscripten_glGetUniformBlockIndex = _glGetUniformBlockIndex;

/** @suppress {duplicate } */ var _glGetUniformIndices = (program, uniformCount, uniformNames, uniformIndices) => {
 if (!uniformIndices) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 var names = [];
 for (var i = 0; i < uniformCount; i++) names.push(UTF8ToString(GROWABLE_HEAP_I32()[(((uniformNames) + (i * 4)) >> 2)]));
 var result = GLctx.getUniformIndices(program, names);
 if (!result) return;
 var len = result.length;
 for (var i = 0; i < len; i++) {
  GROWABLE_HEAP_I32()[(((uniformIndices) + (i * 4)) >> 2)] = result[i];
 }
};

var _emscripten_glGetUniformIndices = _glGetUniformIndices;

/** @suppress {checkTypes} */ var jstoi_q = str => parseInt(str);

/** @noinline */ var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");

var webglPrepareUniformLocationsBeforeFirstUse = program => {
 var uniformLocsById = program.uniformLocsById,  uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,  i, j;
 if (!uniformLocsById) {
  program.uniformLocsById = uniformLocsById = {};
  program.uniformArrayNamesById = {};
  for (i = 0; i < GLctx.getProgramParameter(program, 35718); /*GL_ACTIVE_UNIFORMS*/ ++i) {
   var u = GLctx.getActiveUniform(program, i);
   var nm = u.name;
   var sz = u.size;
   var lb = webglGetLeftBracePos(nm);
   var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
   var id = program.uniformIdCounter;
   program.uniformIdCounter += sz;
   uniformSizeAndIdsByName[arrayName] = [ sz, id ];
   for (j = 0; j < sz; ++j) {
    uniformLocsById[id] = j;
    program.uniformArrayNamesById[id++] = arrayName;
   }
  }
 }
};

/** @suppress {duplicate } */ var _glGetUniformLocation = (program, name) => {
 name = UTF8ToString(name);
 if (program = GL.programs[program]) {
  webglPrepareUniformLocationsBeforeFirstUse(program);
  var uniformLocsById = program.uniformLocsById;
  var arrayIndex = 0;
  var uniformBaseName = name;
  var leftBrace = webglGetLeftBracePos(name);
  if (leftBrace > 0) {
   arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
   uniformBaseName = name.slice(0, leftBrace);
  }
  var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  if (sizeAndId && arrayIndex < sizeAndId[0]) {
   arrayIndex += sizeAndId[1];
   if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
    return arrayIndex;
   }
  }
 } else {
  GL.recordError(1281);
 }
 /* GL_INVALID_VALUE */ return -1;
};

var _emscripten_glGetUniformLocation = _glGetUniformLocation;

var webglGetUniformLocation = location => {
 var p = GLctx.currentProgram;
 if (p) {
  var webglLoc = p.uniformLocsById[location];
  if (typeof webglLoc == "number") {
   p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""));
  }
  return webglLoc;
 } else {
  GL.recordError(1282);
 }
};

/** @suppress{checkTypes} */ var emscriptenWebGLGetUniform = (program, location, params, type) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 program = GL.programs[program];
 webglPrepareUniformLocationsBeforeFirstUse(program);
 var data = GLctx.getUniform(program, webglGetUniformLocation(location));
 if (typeof data == "number" || typeof data == "boolean") {
  switch (type) {
  case 0:
   GROWABLE_HEAP_I32()[((params) >> 2)] = data;
   break;

  case 2:
   GROWABLE_HEAP_F32()[((params) >> 2)] = data;
   break;
  }
 } else {
  for (var i = 0; i < data.length; i++) {
   switch (type) {
   case 0:
    GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = data[i];
    break;

   case 2:
    GROWABLE_HEAP_F32()[(((params) + (i * 4)) >> 2)] = data[i];
    break;
   }
  }
 }
};

/** @suppress {duplicate } */ var _glGetUniformfv = (program, location, params) => {
 emscriptenWebGLGetUniform(program, location, params, 2);
};

var _emscripten_glGetUniformfv = _glGetUniformfv;

/** @suppress {duplicate } */ var _glGetUniformiv = (program, location, params) => {
 emscriptenWebGLGetUniform(program, location, params, 0);
};

var _emscripten_glGetUniformiv = _glGetUniformiv;

/** @suppress {duplicate } */ var _glGetUniformuiv = (program, location, params) => emscriptenWebGLGetUniform(program, location, params, 0);

var _emscripten_glGetUniformuiv = _glGetUniformuiv;

/** @suppress{checkTypes} */ var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
 if (!params) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (GL.currentContext.clientBuffers[index].enabled) {
  err("glGetVertexAttrib*v on client-side array: not supported, bad data returned");
 }
 var data = GLctx.getVertexAttrib(index, pname);
 if (pname == 34975) /*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/ {
  GROWABLE_HEAP_I32()[((params) >> 2)] = data && data["name"];
 } else if (typeof data == "number" || typeof data == "boolean") {
  switch (type) {
  case 0:
   GROWABLE_HEAP_I32()[((params) >> 2)] = data;
   break;

  case 2:
   GROWABLE_HEAP_F32()[((params) >> 2)] = data;
   break;

  case 5:
   GROWABLE_HEAP_I32()[((params) >> 2)] = Math.fround(data);
   break;
  }
 } else {
  for (var i = 0; i < data.length; i++) {
   switch (type) {
   case 0:
    GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = data[i];
    break;

   case 2:
    GROWABLE_HEAP_F32()[(((params) + (i * 4)) >> 2)] = data[i];
    break;

   case 5:
    GROWABLE_HEAP_I32()[(((params) + (i * 4)) >> 2)] = Math.fround(data[i]);
    break;
   }
  }
 }
};

/** @suppress {duplicate } */ var _glGetVertexAttribIiv = (index, pname, params) => {
 emscriptenWebGLGetVertexAttrib(index, pname, params, 0);
};

var _emscripten_glGetVertexAttribIiv = _glGetVertexAttribIiv;

/** @suppress {duplicate } */ var _glGetVertexAttribIuiv = _glGetVertexAttribIiv;

var _emscripten_glGetVertexAttribIuiv = _glGetVertexAttribIuiv;

/** @suppress {duplicate } */ var _glGetVertexAttribPointerv = (index, pname, pointer) => {
 if (!pointer) {
  GL.recordError(1281);
  /* GL_INVALID_VALUE */ return;
 }
 if (GL.currentContext.clientBuffers[index].enabled) {
  err("glGetVertexAttribPointer on client-side array: not supported, bad data returned");
 }
 GROWABLE_HEAP_I32()[((pointer) >> 2)] = GLctx.getVertexAttribOffset(index, pname);
};

var _emscripten_glGetVertexAttribPointerv = _glGetVertexAttribPointerv;

/** @suppress {duplicate } */ var _glGetVertexAttribfv = (index, pname, params) => {
 emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
};

var _emscripten_glGetVertexAttribfv = _glGetVertexAttribfv;

/** @suppress {duplicate } */ var _glGetVertexAttribiv = (index, pname, params) => {
 emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
};

var _emscripten_glGetVertexAttribiv = _glGetVertexAttribiv;

/** @suppress {duplicate } */ function _glHint(x0, x1) {
 GLctx.hint(x0, x1);
}

var _emscripten_glHint = _glHint;

/** @suppress {duplicate } */ var _glInvalidateFramebuffer = (target, numAttachments, attachments) => {
 var list = tempFixedLengthArray[numAttachments];
 for (var i = 0; i < numAttachments; i++) {
  list[i] = GROWABLE_HEAP_I32()[(((attachments) + (i * 4)) >> 2)];
 }
 GLctx.invalidateFramebuffer(target, list);
};

var _emscripten_glInvalidateFramebuffer = _glInvalidateFramebuffer;

/** @suppress {duplicate } */ var _glInvalidateSubFramebuffer = (target, numAttachments, attachments, x, y, width, height) => {
 var list = tempFixedLengthArray[numAttachments];
 for (var i = 0; i < numAttachments; i++) {
  list[i] = GROWABLE_HEAP_I32()[(((attachments) + (i * 4)) >> 2)];
 }
 GLctx.invalidateSubFramebuffer(target, list, x, y, width, height);
};

var _emscripten_glInvalidateSubFramebuffer = _glInvalidateSubFramebuffer;

/** @suppress {duplicate } */ var _glIsBuffer = buffer => {
 var b = GL.buffers[buffer];
 if (!b) return 0;
 return GLctx.isBuffer(b);
};

var _emscripten_glIsBuffer = _glIsBuffer;

/** @suppress {duplicate } */ function _glIsEnabled(x0) {
 return GLctx.isEnabled(x0);
}

var _emscripten_glIsEnabled = _glIsEnabled;

/** @suppress {duplicate } */ var _glIsFramebuffer = framebuffer => {
 var fb = GL.framebuffers[framebuffer];
 if (!fb) return 0;
 return GLctx.isFramebuffer(fb);
};

var _emscripten_glIsFramebuffer = _glIsFramebuffer;

/** @suppress {duplicate } */ var _glIsProgram = program => {
 program = GL.programs[program];
 if (!program) return 0;
 return GLctx.isProgram(program);
};

var _emscripten_glIsProgram = _glIsProgram;

/** @suppress {duplicate } */ var _glIsQuery = id => {
 var query = GL.queries[id];
 if (!query) return 0;
 return GLctx.isQuery(query);
};

var _emscripten_glIsQuery = _glIsQuery;

/** @suppress {duplicate } */ var _glIsQueryEXT = id => {
 var query = GL.queries[id];
 if (!query) return 0;
 return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
};

var _emscripten_glIsQueryEXT = _glIsQueryEXT;

/** @suppress {duplicate } */ var _glIsRenderbuffer = renderbuffer => {
 var rb = GL.renderbuffers[renderbuffer];
 if (!rb) return 0;
 return GLctx.isRenderbuffer(rb);
};

var _emscripten_glIsRenderbuffer = _glIsRenderbuffer;

/** @suppress {duplicate } */ var _glIsSampler = id => {
 var sampler = GL.samplers[id];
 if (!sampler) return 0;
 return GLctx.isSampler(sampler);
};

var _emscripten_glIsSampler = _glIsSampler;

/** @suppress {duplicate } */ var _glIsShader = shader => {
 var s = GL.shaders[shader];
 if (!s) return 0;
 return GLctx.isShader(s);
};

var _emscripten_glIsShader = _glIsShader;

/** @suppress {duplicate } */ var _glIsSync = sync => GLctx.isSync(GL.syncs[sync]);

var _emscripten_glIsSync = _glIsSync;

/** @suppress {duplicate } */ var _glIsTexture = id => {
 var texture = GL.textures[id];
 if (!texture) return 0;
 return GLctx.isTexture(texture);
};

var _emscripten_glIsTexture = _glIsTexture;

/** @suppress {duplicate } */ var _glIsTransformFeedback = id => GLctx.isTransformFeedback(GL.transformFeedbacks[id]);

var _emscripten_glIsTransformFeedback = _glIsTransformFeedback;

/** @suppress {duplicate } */ var _glIsVertexArray = array => {
 var vao = GL.vaos[array];
 if (!vao) return 0;
 return GLctx.isVertexArray(vao);
};

var _emscripten_glIsVertexArray = _glIsVertexArray;

/** @suppress {duplicate } */ var _glIsVertexArrayOES = _glIsVertexArray;

var _emscripten_glIsVertexArrayOES = _glIsVertexArrayOES;

/** @suppress {duplicate } */ function _glLineWidth(x0) {
 GLctx.lineWidth(x0);
}

var _emscripten_glLineWidth = _glLineWidth;

/** @suppress {duplicate } */ var _glLinkProgram = program => {
 program = GL.programs[program];
 GLctx.linkProgram(program);
 program.uniformLocsById = 0;
 program.uniformSizeAndIdsByName = {};
};

var _emscripten_glLinkProgram = _glLinkProgram;

/** @suppress {duplicate } */ var _glMapBufferRange = (target, offset, length, access) => {
 if ((access & (1 | /*GL_MAP_READ_BIT*/ 32)) != /*GL_MAP_UNSYNCHRONIZED_BIT*/ 0) {
  err("glMapBufferRange access does not support MAP_READ or MAP_UNSYNCHRONIZED");
  return 0;
 }
 if ((access & 2) == /*GL_MAP_WRITE_BIT*/ 0) {
  err("glMapBufferRange access must include MAP_WRITE");
  return 0;
 }
 if ((access & (4 | /*GL_MAP_INVALIDATE_BUFFER_BIT*/ 8)) == /*GL_MAP_INVALIDATE_RANGE_BIT*/ 0) {
  err("glMapBufferRange access must include INVALIDATE_BUFFER or INVALIDATE_RANGE");
  return 0;
 }
 if (!emscriptenWebGLValidateMapBufferTarget(target)) {
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ err("GL_INVALID_ENUM in glMapBufferRange");
  return 0;
 }
 var mem = _malloc(length), binding = emscriptenWebGLGetBufferBinding(target);
 if (!mem) return 0;
 if (!GL.mappedBuffers[binding]) GL.mappedBuffers[binding] = {};
 binding = GL.mappedBuffers[binding];
 binding.offset = offset;
 binding.length = length;
 binding.mem = mem;
 binding.access = access;
 return mem;
};

var _emscripten_glMapBufferRange = _glMapBufferRange;

/** @suppress {duplicate } */ function _glPauseTransformFeedback() {
 GLctx.pauseTransformFeedback();
}

var _emscripten_glPauseTransformFeedback = _glPauseTransformFeedback;

/** @suppress {duplicate } */ var _glPixelStorei = (pname, param) => {
 if (pname == 3317) /* GL_UNPACK_ALIGNMENT */ {
  GL.unpackAlignment = param;
 }
 GLctx.pixelStorei(pname, param);
};

var _emscripten_glPixelStorei = _glPixelStorei;

/** @suppress {duplicate } */ function _glPolygonOffset(x0, x1) {
 GLctx.polygonOffset(x0, x1);
}

var _emscripten_glPolygonOffset = _glPolygonOffset;

/** @suppress {duplicate } */ var _glProgramBinary = (program, binaryFormat, binary, length) => {
 GL.recordError(1280);
};

/*GL_INVALID_ENUM*/ var _emscripten_glProgramBinary = _glProgramBinary;

/** @suppress {duplicate } */ var _glProgramParameteri = (program, pname, value) => {
 GL.recordError(1280);
};

/*GL_INVALID_ENUM*/ var _emscripten_glProgramParameteri = _glProgramParameteri;

/** @suppress {duplicate } */ var _glQueryCounterEXT = (id, target) => {
 GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target);
};

var _emscripten_glQueryCounterEXT = _glQueryCounterEXT;

/** @suppress {duplicate } */ function _glReadBuffer(x0) {
 GLctx.readBuffer(x0);
}

var _emscripten_glReadBuffer = _glReadBuffer;

var computeUnpackAlignedImageSize = (width, height, sizePerPixel, alignment) => {
 function roundedToNextMultipleOf(x, y) {
  return (x + y - 1) & -y;
 }
 var plainRowSize = width * sizePerPixel;
 var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
 return height * alignedRowSize;
};

var colorChannelsInGlTextureFormat = format => {
 var colorChannels = {
  5: 3,
  6: 4,
  8: 2,
  29502: 3,
  29504: 4,
  26917: 2,
  26918: 2,
  29846: 3,
  29847: 4
 };
 return colorChannels[format - 6402] || 1;
};

var heapObjectForWebGLType = type => {
 type -= 5120;
 if (type == 0) return GROWABLE_HEAP_I8();
 if (type == 1) return GROWABLE_HEAP_U8();
 if (type == 2) return GROWABLE_HEAP_I16();
 if (type == 4) return GROWABLE_HEAP_I32();
 if (type == 6) return GROWABLE_HEAP_F32();
 if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782) return GROWABLE_HEAP_U32();
 return GROWABLE_HEAP_U16();
};

var heapAccessShiftForWebGLHeap = heap => 31 - Math.clz32(heap.BYTES_PER_ELEMENT);

var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
 var heap = heapObjectForWebGLType(type);
 var shift = heapAccessShiftForWebGLHeap(heap);
 var byteSize = 1 << shift;
 var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
 var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
 return heap.subarray(pixels >> shift, pixels + bytes >> shift);
};

/** @suppress {duplicate } */ var _glReadPixels = (x, y, width, height, format, type, pixels) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelPackBufferBinding) {
   GLctx.readPixels(x, y, width, height, format, type, pixels);
  } else {
   var heap = heapObjectForWebGLType(type);
   GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
  }
  return;
 }
 var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
 if (!pixelData) {
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ return;
 }
 GLctx.readPixels(x, y, width, height, format, type, pixelData);
};

var _emscripten_glReadPixels = _glReadPixels;

/** @suppress {duplicate } */ var _glReleaseShaderCompiler = () => {};

var _emscripten_glReleaseShaderCompiler = _glReleaseShaderCompiler;

/** @suppress {duplicate } */ function _glRenderbufferStorage(x0, x1, x2, x3) {
 GLctx.renderbufferStorage(x0, x1, x2, x3);
}

var _emscripten_glRenderbufferStorage = _glRenderbufferStorage;

/** @suppress {duplicate } */ function _glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
 GLctx.renderbufferStorageMultisample(x0, x1, x2, x3, x4);
}

var _emscripten_glRenderbufferStorageMultisample = _glRenderbufferStorageMultisample;

/** @suppress {duplicate } */ function _glResumeTransformFeedback() {
 GLctx.resumeTransformFeedback();
}

var _emscripten_glResumeTransformFeedback = _glResumeTransformFeedback;

/** @suppress {duplicate } */ var _glSampleCoverage = (value, invert) => {
 GLctx.sampleCoverage(value, !!invert);
};

var _emscripten_glSampleCoverage = _glSampleCoverage;

/** @suppress {duplicate } */ var _glSamplerParameterf = (sampler, pname, param) => {
 GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameterf = _glSamplerParameterf;

/** @suppress {duplicate } */ var _glSamplerParameterfv = (sampler, pname, params) => {
 var param = GROWABLE_HEAP_F32()[((params) >> 2)];
 GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameterfv = _glSamplerParameterfv;

/** @suppress {duplicate } */ var _glSamplerParameteri = (sampler, pname, param) => {
 GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameteri = _glSamplerParameteri;

/** @suppress {duplicate } */ var _glSamplerParameteriv = (sampler, pname, params) => {
 var param = GROWABLE_HEAP_I32()[((params) >> 2)];
 GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
};

var _emscripten_glSamplerParameteriv = _glSamplerParameteriv;

/** @suppress {duplicate } */ function _glScissor(x0, x1, x2, x3) {
 GLctx.scissor(x0, x1, x2, x3);
}

var _emscripten_glScissor = _glScissor;

/** @suppress {duplicate } */ var _glShaderBinary = (count, shaders, binaryformat, binary, length) => {
 GL.recordError(1280);
};

/*GL_INVALID_ENUM*/ var _emscripten_glShaderBinary = _glShaderBinary;

/** @suppress {duplicate } */ var _glShaderSource = (shader, count, string, length) => {
 var source = GL.getSource(shader, count, string, length);
 GLctx.shaderSource(GL.shaders[shader], source);
};

var _emscripten_glShaderSource = _glShaderSource;

/** @suppress {duplicate } */ function _glStencilFunc(x0, x1, x2) {
 GLctx.stencilFunc(x0, x1, x2);
}

var _emscripten_glStencilFunc = _glStencilFunc;

/** @suppress {duplicate } */ function _glStencilFuncSeparate(x0, x1, x2, x3) {
 GLctx.stencilFuncSeparate(x0, x1, x2, x3);
}

var _emscripten_glStencilFuncSeparate = _glStencilFuncSeparate;

/** @suppress {duplicate } */ function _glStencilMask(x0) {
 GLctx.stencilMask(x0);
}

var _emscripten_glStencilMask = _glStencilMask;

/** @suppress {duplicate } */ function _glStencilMaskSeparate(x0, x1) {
 GLctx.stencilMaskSeparate(x0, x1);
}

var _emscripten_glStencilMaskSeparate = _glStencilMaskSeparate;

/** @suppress {duplicate } */ function _glStencilOp(x0, x1, x2) {
 GLctx.stencilOp(x0, x1, x2);
}

var _emscripten_glStencilOp = _glStencilOp;

/** @suppress {duplicate } */ function _glStencilOpSeparate(x0, x1, x2, x3) {
 GLctx.stencilOpSeparate(x0, x1, x2, x3);
}

var _emscripten_glStencilOpSeparate = _glStencilOpSeparate;

/** @suppress {duplicate } */ var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelUnpackBufferBinding) {
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
  } else if (pixels) {
   var heap = heapObjectForWebGLType(type);
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
  } else {
   GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
  }
  return;
 }
 GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null);
};

var _emscripten_glTexImage2D = _glTexImage2D;

/** @suppress {duplicate } */ var _glTexImage3D = (target, level, internalFormat, width, height, depth, border, format, type, pixels) => {
 if (GLctx.currentPixelUnpackBufferBinding) {
  GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels);
 } else if (pixels) {
  var heap = heapObjectForWebGLType(type);
  GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
 } else {
  GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, null);
 }
};

var _emscripten_glTexImage3D = _glTexImage3D;

/** @suppress {duplicate } */ function _glTexParameterf(x0, x1, x2) {
 GLctx.texParameterf(x0, x1, x2);
}

var _emscripten_glTexParameterf = _glTexParameterf;

/** @suppress {duplicate } */ var _glTexParameterfv = (target, pname, params) => {
 var param = GROWABLE_HEAP_F32()[((params) >> 2)];
 GLctx.texParameterf(target, pname, param);
};

var _emscripten_glTexParameterfv = _glTexParameterfv;

/** @suppress {duplicate } */ function _glTexParameteri(x0, x1, x2) {
 GLctx.texParameteri(x0, x1, x2);
}

var _emscripten_glTexParameteri = _glTexParameteri;

/** @suppress {duplicate } */ var _glTexParameteriv = (target, pname, params) => {
 var param = GROWABLE_HEAP_I32()[((params) >> 2)];
 GLctx.texParameteri(target, pname, param);
};

var _emscripten_glTexParameteriv = _glTexParameteriv;

/** @suppress {duplicate } */ function _glTexStorage2D(x0, x1, x2, x3, x4) {
 GLctx.texStorage2D(x0, x1, x2, x3, x4);
}

var _emscripten_glTexStorage2D = _glTexStorage2D;

/** @suppress {duplicate } */ function _glTexStorage3D(x0, x1, x2, x3, x4, x5) {
 GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);
}

var _emscripten_glTexStorage3D = _glTexStorage3D;

/** @suppress {duplicate } */ var _glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
 if (GL.currentContext.version >= 2) {
  if (GLctx.currentPixelUnpackBufferBinding) {
   GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
  } else if (pixels) {
   var heap = heapObjectForWebGLType(type);
   GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
  } else {
   GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null);
  }
  return;
 }
 var pixelData = null;
 if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
 GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
};

var _emscripten_glTexSubImage2D = _glTexSubImage2D;

/** @suppress {duplicate } */ var _glTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) => {
 if (GLctx.currentPixelUnpackBufferBinding) {
  GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
 } else if (pixels) {
  var heap = heapObjectForWebGLType(type);
  GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
 } else {
  GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
 }
};

var _emscripten_glTexSubImage3D = _glTexSubImage3D;

/** @suppress {duplicate } */ var _glTransformFeedbackVaryings = (program, count, varyings, bufferMode) => {
 program = GL.programs[program];
 var vars = [];
 for (var i = 0; i < count; i++) vars.push(UTF8ToString(GROWABLE_HEAP_I32()[(((varyings) + (i * 4)) >> 2)]));
 GLctx.transformFeedbackVaryings(program, vars, bufferMode);
};

var _emscripten_glTransformFeedbackVaryings = _glTransformFeedbackVaryings;

/** @suppress {duplicate } */ var _glUniform1f = (location, v0) => {
 GLctx.uniform1f(webglGetUniformLocation(location), v0);
};

var _emscripten_glUniform1f = _glUniform1f;

var miniTempWebGLFloatBuffers = [];

/** @suppress {duplicate } */ var _glUniform1fv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform1fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count);
  return;
 }
 if (count <= 288) {
  var view = miniTempWebGLFloatBuffers[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = GROWABLE_HEAP_F32()[(((value) + (4 * i)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 4) >> 2);
 }
 GLctx.uniform1fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform1fv = _glUniform1fv;

/** @suppress {duplicate } */ var _glUniform1i = (location, v0) => {
 GLctx.uniform1i(webglGetUniformLocation(location), v0);
};

var _emscripten_glUniform1i = _glUniform1i;

var miniTempWebGLIntBuffers = [];

/** @suppress {duplicate } */ var _glUniform1iv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform1iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count);
  return;
 }
 if (count <= 288) {
  var view = miniTempWebGLIntBuffers[count - 1];
  for (var i = 0; i < count; ++i) {
   view[i] = GROWABLE_HEAP_I32()[(((value) + (4 * i)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_I32().subarray((value) >> 2, (value + count * 4) >> 2);
 }
 GLctx.uniform1iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform1iv = _glUniform1iv;

/** @suppress {duplicate } */ var _glUniform1ui = (location, v0) => {
 GLctx.uniform1ui(webglGetUniformLocation(location), v0);
};

var _emscripten_glUniform1ui = _glUniform1ui;

/** @suppress {duplicate } */ var _glUniform1uiv = (location, count, value) => {
 count && GLctx.uniform1uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count);
};

var _emscripten_glUniform1uiv = _glUniform1uiv;

/** @suppress {duplicate } */ var _glUniform2f = (location, v0, v1) => {
 GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2f = _glUniform2f;

/** @suppress {duplicate } */ var _glUniform2fv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform2fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 2);
  return;
 }
 if (count <= 144) {
  var view = miniTempWebGLFloatBuffers[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = GROWABLE_HEAP_F32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 4)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 8) >> 2);
 }
 GLctx.uniform2fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform2fv = _glUniform2fv;

/** @suppress {duplicate } */ var _glUniform2i = (location, v0, v1) => {
 GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2i = _glUniform2i;

/** @suppress {duplicate } */ var _glUniform2iv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform2iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 2);
  return;
 }
 if (count <= 144) {
  var view = miniTempWebGLIntBuffers[2 * count - 1];
  for (var i = 0; i < 2 * count; i += 2) {
   view[i] = GROWABLE_HEAP_I32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 4)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_I32().subarray((value) >> 2, (value + count * 8) >> 2);
 }
 GLctx.uniform2iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform2iv = _glUniform2iv;

/** @suppress {duplicate } */ var _glUniform2ui = (location, v0, v1) => {
 GLctx.uniform2ui(webglGetUniformLocation(location), v0, v1);
};

var _emscripten_glUniform2ui = _glUniform2ui;

/** @suppress {duplicate } */ var _glUniform2uiv = (location, count, value) => {
 count && GLctx.uniform2uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 2);
};

var _emscripten_glUniform2uiv = _glUniform2uiv;

/** @suppress {duplicate } */ var _glUniform3f = (location, v0, v1, v2) => {
 GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3f = _glUniform3f;

/** @suppress {duplicate } */ var _glUniform3fv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform3fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 3);
  return;
 }
 if (count <= 96) {
  var view = miniTempWebGLFloatBuffers[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = GROWABLE_HEAP_F32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 4)) >> 2)];
   view[i + 2] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 8)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 12) >> 2);
 }
 GLctx.uniform3fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform3fv = _glUniform3fv;

/** @suppress {duplicate } */ var _glUniform3i = (location, v0, v1, v2) => {
 GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3i = _glUniform3i;

/** @suppress {duplicate } */ var _glUniform3iv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform3iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 3);
  return;
 }
 if (count <= 96) {
  var view = miniTempWebGLIntBuffers[3 * count - 1];
  for (var i = 0; i < 3 * count; i += 3) {
   view[i] = GROWABLE_HEAP_I32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 4)) >> 2)];
   view[i + 2] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 8)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_I32().subarray((value) >> 2, (value + count * 12) >> 2);
 }
 GLctx.uniform3iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform3iv = _glUniform3iv;

/** @suppress {duplicate } */ var _glUniform3ui = (location, v0, v1, v2) => {
 GLctx.uniform3ui(webglGetUniformLocation(location), v0, v1, v2);
};

var _emscripten_glUniform3ui = _glUniform3ui;

/** @suppress {duplicate } */ var _glUniform3uiv = (location, count, value) => {
 count && GLctx.uniform3uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 3);
};

var _emscripten_glUniform3uiv = _glUniform3uiv;

/** @suppress {duplicate } */ var _glUniform4f = (location, v0, v1, v2, v3) => {
 GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4f = _glUniform4f;

/** @suppress {duplicate } */ var _glUniform4fv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform4fv(webglGetUniformLocation(location), GROWABLE_HEAP_F32(), value >> 2, count * 4);
  return;
 }
 if (count <= 72) {
  var view = miniTempWebGLFloatBuffers[4 * count - 1];
  var heap = GROWABLE_HEAP_F32();
  value >>= 2;
  for (var i = 0; i < 4 * count; i += 4) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 16) >> 2);
 }
 GLctx.uniform4fv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform4fv = _glUniform4fv;

/** @suppress {duplicate } */ var _glUniform4i = (location, v0, v1, v2, v3) => {
 GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4i = _glUniform4i;

/** @suppress {duplicate } */ var _glUniform4iv = (location, count, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniform4iv(webglGetUniformLocation(location), GROWABLE_HEAP_I32(), value >> 2, count * 4);
  return;
 }
 if (count <= 72) {
  var view = miniTempWebGLIntBuffers[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = GROWABLE_HEAP_I32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 4)) >> 2)];
   view[i + 2] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 8)) >> 2)];
   view[i + 3] = GROWABLE_HEAP_I32()[(((value) + (4 * i + 12)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_I32().subarray((value) >> 2, (value + count * 16) >> 2);
 }
 GLctx.uniform4iv(webglGetUniformLocation(location), view);
};

var _emscripten_glUniform4iv = _glUniform4iv;

/** @suppress {duplicate } */ var _glUniform4ui = (location, v0, v1, v2, v3) => {
 GLctx.uniform4ui(webglGetUniformLocation(location), v0, v1, v2, v3);
};

var _emscripten_glUniform4ui = _glUniform4ui;

/** @suppress {duplicate } */ var _glUniform4uiv = (location, count, value) => {
 count && GLctx.uniform4uiv(webglGetUniformLocation(location), GROWABLE_HEAP_U32(), value >> 2, count * 4);
};

var _emscripten_glUniform4uiv = _glUniform4uiv;

/** @suppress {duplicate } */ var _glUniformBlockBinding = (program, uniformBlockIndex, uniformBlockBinding) => {
 program = GL.programs[program];
 GLctx.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
};

var _emscripten_glUniformBlockBinding = _glUniformBlockBinding;

/** @suppress {duplicate } */ var _glUniformMatrix2fv = (location, count, transpose, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 4);
  return;
 }
 if (count <= 72) {
  var view = miniTempWebGLFloatBuffers[4 * count - 1];
  for (var i = 0; i < 4 * count; i += 4) {
   view[i] = GROWABLE_HEAP_F32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 4)) >> 2)];
   view[i + 2] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 8)) >> 2)];
   view[i + 3] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 12)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 16) >> 2);
 }
 GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix2fv = _glUniformMatrix2fv;

/** @suppress {duplicate } */ var _glUniformMatrix2x3fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix2x3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 6);
};

var _emscripten_glUniformMatrix2x3fv = _glUniformMatrix2x3fv;

/** @suppress {duplicate } */ var _glUniformMatrix2x4fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix2x4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 8);
};

var _emscripten_glUniformMatrix2x4fv = _glUniformMatrix2x4fv;

/** @suppress {duplicate } */ var _glUniformMatrix3fv = (location, count, transpose, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 9);
  return;
 }
 if (count <= 32) {
  var view = miniTempWebGLFloatBuffers[9 * count - 1];
  for (var i = 0; i < 9 * count; i += 9) {
   view[i] = GROWABLE_HEAP_F32()[(((value) + (4 * i)) >> 2)];
   view[i + 1] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 4)) >> 2)];
   view[i + 2] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 8)) >> 2)];
   view[i + 3] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 12)) >> 2)];
   view[i + 4] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 16)) >> 2)];
   view[i + 5] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 20)) >> 2)];
   view[i + 6] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 24)) >> 2)];
   view[i + 7] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 28)) >> 2)];
   view[i + 8] = GROWABLE_HEAP_F32()[(((value) + (4 * i + 32)) >> 2)];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 36) >> 2);
 }
 GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix3fv = _glUniformMatrix3fv;

/** @suppress {duplicate } */ var _glUniformMatrix3x2fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix3x2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 6);
};

var _emscripten_glUniformMatrix3x2fv = _glUniformMatrix3x2fv;

/** @suppress {duplicate } */ var _glUniformMatrix3x4fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix3x4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 12);
};

var _emscripten_glUniformMatrix3x4fv = _glUniformMatrix3x4fv;

/** @suppress {duplicate } */ var _glUniformMatrix4fv = (location, count, transpose, value) => {
 if (GL.currentContext.version >= 2) {
  count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 16);
  return;
 }
 if (count <= 18) {
  var view = miniTempWebGLFloatBuffers[16 * count - 1];
  var heap = GROWABLE_HEAP_F32();
  value >>= 2;
  for (var i = 0; i < 16 * count; i += 16) {
   var dst = value + i;
   view[i] = heap[dst];
   view[i + 1] = heap[dst + 1];
   view[i + 2] = heap[dst + 2];
   view[i + 3] = heap[dst + 3];
   view[i + 4] = heap[dst + 4];
   view[i + 5] = heap[dst + 5];
   view[i + 6] = heap[dst + 6];
   view[i + 7] = heap[dst + 7];
   view[i + 8] = heap[dst + 8];
   view[i + 9] = heap[dst + 9];
   view[i + 10] = heap[dst + 10];
   view[i + 11] = heap[dst + 11];
   view[i + 12] = heap[dst + 12];
   view[i + 13] = heap[dst + 13];
   view[i + 14] = heap[dst + 14];
   view[i + 15] = heap[dst + 15];
  }
 } else {
  var view = GROWABLE_HEAP_F32().subarray((value) >> 2, (value + count * 64) >> 2);
 }
 GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
};

var _emscripten_glUniformMatrix4fv = _glUniformMatrix4fv;

/** @suppress {duplicate } */ var _glUniformMatrix4x2fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix4x2fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 8);
};

var _emscripten_glUniformMatrix4x2fv = _glUniformMatrix4x2fv;

/** @suppress {duplicate } */ var _glUniformMatrix4x3fv = (location, count, transpose, value) => {
 count && GLctx.uniformMatrix4x3fv(webglGetUniformLocation(location), !!transpose, GROWABLE_HEAP_F32(), value >> 2, count * 12);
};

var _emscripten_glUniformMatrix4x3fv = _glUniformMatrix4x3fv;

/** @suppress {duplicate } */ var _glUnmapBuffer = target => {
 if (!emscriptenWebGLValidateMapBufferTarget(target)) {
  GL.recordError(1280);
  /*GL_INVALID_ENUM*/ err("GL_INVALID_ENUM in glUnmapBuffer");
  return 0;
 }
 var buffer = emscriptenWebGLGetBufferBinding(target);
 var mapping = GL.mappedBuffers[buffer];
 if (!mapping || !mapping.mem) {
  GL.recordError(1282);
  /* GL_INVALID_OPERATION */ err("buffer was never mapped in glUnmapBuffer");
  return 0;
 }
 if (!(mapping.access & 16)) /* GL_MAP_FLUSH_EXPLICIT_BIT */ if (GL.currentContext.version >= 2) {
  GLctx.bufferSubData(target, mapping.offset, GROWABLE_HEAP_U8(), mapping.mem, mapping.length);
 } else {
  GLctx.bufferSubData(target, mapping.offset, GROWABLE_HEAP_U8().subarray(mapping.mem, mapping.mem + mapping.length));
 }
 _free(mapping.mem);
 mapping.mem = 0;
 return 1;
};

var _emscripten_glUnmapBuffer = _glUnmapBuffer;

/** @suppress {duplicate } */ var _glUseProgram = program => {
 program = GL.programs[program];
 GLctx.useProgram(program);
 GLctx.currentProgram = program;
};

var _emscripten_glUseProgram = _glUseProgram;

/** @suppress {duplicate } */ var _glValidateProgram = program => {
 GLctx.validateProgram(GL.programs[program]);
};

var _emscripten_glValidateProgram = _glValidateProgram;

/** @suppress {duplicate } */ function _glVertexAttrib1f(x0, x1) {
 GLctx.vertexAttrib1f(x0, x1);
}

var _emscripten_glVertexAttrib1f = _glVertexAttrib1f;

/** @suppress {duplicate } */ var _glVertexAttrib1fv = (index, v) => {
 GLctx.vertexAttrib1f(index, GROWABLE_HEAP_F32()[v >> 2]);
};

var _emscripten_glVertexAttrib1fv = _glVertexAttrib1fv;

/** @suppress {duplicate } */ function _glVertexAttrib2f(x0, x1, x2) {
 GLctx.vertexAttrib2f(x0, x1, x2);
}

var _emscripten_glVertexAttrib2f = _glVertexAttrib2f;

/** @suppress {duplicate } */ var _glVertexAttrib2fv = (index, v) => {
 GLctx.vertexAttrib2f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2]);
};

var _emscripten_glVertexAttrib2fv = _glVertexAttrib2fv;

/** @suppress {duplicate } */ function _glVertexAttrib3f(x0, x1, x2, x3) {
 GLctx.vertexAttrib3f(x0, x1, x2, x3);
}

var _emscripten_glVertexAttrib3f = _glVertexAttrib3f;

/** @suppress {duplicate } */ var _glVertexAttrib3fv = (index, v) => {
 GLctx.vertexAttrib3f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2], GROWABLE_HEAP_F32()[v + 8 >> 2]);
};

var _emscripten_glVertexAttrib3fv = _glVertexAttrib3fv;

/** @suppress {duplicate } */ function _glVertexAttrib4f(x0, x1, x2, x3, x4) {
 GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
}

var _emscripten_glVertexAttrib4f = _glVertexAttrib4f;

/** @suppress {duplicate } */ var _glVertexAttrib4fv = (index, v) => {
 GLctx.vertexAttrib4f(index, GROWABLE_HEAP_F32()[v >> 2], GROWABLE_HEAP_F32()[v + 4 >> 2], GROWABLE_HEAP_F32()[v + 8 >> 2], GROWABLE_HEAP_F32()[v + 12 >> 2]);
};

var _emscripten_glVertexAttrib4fv = _glVertexAttrib4fv;

/** @suppress {duplicate } */ var _glVertexAttribDivisor = (index, divisor) => {
 GLctx.vertexAttribDivisor(index, divisor);
};

var _emscripten_glVertexAttribDivisor = _glVertexAttribDivisor;

/** @suppress {duplicate } */ var _glVertexAttribDivisorANGLE = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisorANGLE;

/** @suppress {duplicate } */ var _glVertexAttribDivisorARB = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorARB = _glVertexAttribDivisorARB;

/** @suppress {duplicate } */ var _glVertexAttribDivisorEXT = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorEXT = _glVertexAttribDivisorEXT;

/** @suppress {duplicate } */ var _glVertexAttribDivisorNV = _glVertexAttribDivisor;

var _emscripten_glVertexAttribDivisorNV = _glVertexAttribDivisorNV;

/** @suppress {duplicate } */ function _glVertexAttribI4i(x0, x1, x2, x3, x4) {
 GLctx.vertexAttribI4i(x0, x1, x2, x3, x4);
}

var _emscripten_glVertexAttribI4i = _glVertexAttribI4i;

/** @suppress {duplicate } */ var _glVertexAttribI4iv = (index, v) => {
 GLctx.vertexAttribI4i(index, GROWABLE_HEAP_I32()[v >> 2], GROWABLE_HEAP_I32()[v + 4 >> 2], GROWABLE_HEAP_I32()[v + 8 >> 2], GROWABLE_HEAP_I32()[v + 12 >> 2]);
};

var _emscripten_glVertexAttribI4iv = _glVertexAttribI4iv;

/** @suppress {duplicate } */ function _glVertexAttribI4ui(x0, x1, x2, x3, x4) {
 GLctx.vertexAttribI4ui(x0, x1, x2, x3, x4);
}

var _emscripten_glVertexAttribI4ui = _glVertexAttribI4ui;

/** @suppress {duplicate } */ var _glVertexAttribI4uiv = (index, v) => {
 GLctx.vertexAttribI4ui(index, GROWABLE_HEAP_U32()[v >> 2], GROWABLE_HEAP_U32()[v + 4 >> 2], GROWABLE_HEAP_U32()[v + 8 >> 2], GROWABLE_HEAP_U32()[v + 12 >> 2]);
};

var _emscripten_glVertexAttribI4uiv = _glVertexAttribI4uiv;

/** @suppress {duplicate } */ var _glVertexAttribIPointer = (index, size, type, stride, ptr) => {
 var cb = GL.currentContext.clientBuffers[index];
 if (!GLctx.currentArrayBufferBinding) {
  cb.size = size;
  cb.type = type;
  cb.normalized = false;
  cb.stride = stride;
  cb.ptr = ptr;
  cb.clientside = true;
  cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
   this.vertexAttribIPointer(index, size, type, stride, ptr);
  };
  return;
 }
 cb.clientside = false;
 GLctx.vertexAttribIPointer(index, size, type, stride, ptr);
};

var _emscripten_glVertexAttribIPointer = _glVertexAttribIPointer;

/** @suppress {duplicate } */ var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
 var cb = GL.currentContext.clientBuffers[index];
 if (!GLctx.currentArrayBufferBinding) {
  cb.size = size;
  cb.type = type;
  cb.normalized = normalized;
  cb.stride = stride;
  cb.ptr = ptr;
  cb.clientside = true;
  cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
   this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
  };
  return;
 }
 cb.clientside = false;
 GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};

var _emscripten_glVertexAttribPointer = _glVertexAttribPointer;

/** @suppress {duplicate } */ function _glViewport(x0, x1, x2, x3) {
 GLctx.viewport(x0, x1, x2, x3);
}

var _emscripten_glViewport = _glViewport;

/** @suppress {duplicate } */ var _glWaitSync = (sync, flags, timeout_low, timeout_high) => {
 var timeout = convertI32PairToI53(timeout_low, timeout_high);
 GLctx.waitSync(GL.syncs[sync], flags, timeout);
};

var _emscripten_glWaitSync = _glWaitSync;

var _emscripten_has_asyncify = () => 1;

var doRequestFullscreen = (target, strategy) => {
 if (!JSEvents.fullscreenEnabled()) return -1;
 target = findEventTarget(target);
 if (!target) return -4;
 if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
  return -3;
 }
 var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
 if (!canPerformRequests) {
  if (strategy.deferUntilInEventHandler) {
   JSEvents.deferCall(JSEvents_requestFullscreen, 1, /* priority over pointer lock */ [ target, strategy ]);
   return 1;
  }
  return -2;
 }
 return JSEvents_requestFullscreen(target, strategy);
};

function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(16, 1, target, deferUntilInEventHandler, fullscreenStrategy);
 var strategy = {
  scaleMode: GROWABLE_HEAP_I32()[((fullscreenStrategy) >> 2)],
  canvasResolutionScaleMode: GROWABLE_HEAP_I32()[(((fullscreenStrategy) + (4)) >> 2)],
  filteringMode: GROWABLE_HEAP_I32()[(((fullscreenStrategy) + (8)) >> 2)],
  deferUntilInEventHandler: deferUntilInEventHandler,
  canvasResizedCallbackTargetThread: GROWABLE_HEAP_I32()[(((fullscreenStrategy) + (20)) >> 2)],
  canvasResizedCallback: GROWABLE_HEAP_I32()[(((fullscreenStrategy) + (12)) >> 2)],
  canvasResizedCallbackUserData: GROWABLE_HEAP_I32()[(((fullscreenStrategy) + (16)) >> 2)]
 };
 return doRequestFullscreen(target, strategy);
}

function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(17, 1, target, deferUntilInEventHandler);
 target = findEventTarget(target);
 if (!target) return -4;
 if (!target.requestPointerLock) {
  return -1;
 }
 var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
 if (!canPerformRequests) {
  if (deferUntilInEventHandler) {
   JSEvents.deferCall(requestPointerLock, 2, /* priority below fullscreen */ [ target ]);
   return 1;
  }
  return -2;
 }
 return requestPointerLock(target);
}

var getHeapMax = () =>  2147483648;

var growMemory = size => {
 var b = wasmMemory.buffer;
 var pages = (size - b.byteLength + 65535) / 65536;
 try {
  wasmMemory.grow(pages);
  updateMemoryViews();
  return 1;
 } /*success*/ catch (e) {}
};

var _emscripten_resize_heap = requestedSize => {
 var oldSize = GROWABLE_HEAP_U8().length;
 requestedSize >>>= 0;
 if (requestedSize <= oldSize) {
  return false;
 }
 var maxHeapSize = getHeapMax();
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  var replacement = growMemory(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
};

function _emscripten_sample_gamepad_data() {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(18, 1);
 return (JSEvents.lastGamepadState = (navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null))) ? 0 : -1;
}

var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
 var beforeUnloadEventHandlerFunc = (e = event) => {
  var confirmationMessage = ((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, 0, userData);
  if (confirmationMessage) {
   confirmationMessage = UTF8ToString(confirmationMessage);
  }
  if (confirmationMessage) {
   e.preventDefault();
   e.returnValue = confirmationMessage;
   return confirmationMessage;
  }
 };
 var eventHandler = {
  target: findEventTarget(target),
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: beforeUnloadEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(19, 1, userData, callbackfunc, targetThread);
 if (typeof onbeforeunload == "undefined") return -1;
 if (targetThread !== 1) return -5;
 return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, "beforeunload");
}

var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.focusEvent) JSEvents.focusEvent = _malloc(256);
 var focusEventHandlerFunc = (e = event) => {
  var nodeName = JSEvents.getNodeNameForTarget(e.target);
  var id = e.target.id ? e.target.id : "";
  var focusEvent = targetThread ? _malloc(256) : JSEvents.focusEvent;
  stringToUTF8(nodeName, focusEvent + 0, 128);
  stringToUTF8(id, focusEvent + 128, 128);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, focusEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, focusEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: findEventTarget(target),
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: focusEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(20, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
}

function _emscripten_set_element_css_size(target, width, height) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(21, 1, target, width, height);
 target = findEventTarget(target);
 if (!target) return -4;
 target.style.width = width + "px";
 target.style.height = height + "px";
 return 0;
}

function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(22, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
}

var fillFullscreenChangeEventData = eventStruct => {
 var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
 var isFullscreen = !!fullscreenElement;
 /** @suppress{checkTypes} */ GROWABLE_HEAP_I32()[((eventStruct) >> 2)] = isFullscreen;
 GROWABLE_HEAP_I32()[(((eventStruct) + (4)) >> 2)] = JSEvents.fullscreenEnabled();
 var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
 var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
 var id = (reportedElement && reportedElement.id) ? reportedElement.id : "";
 stringToUTF8(nodeName, eventStruct + 8, 128);
 stringToUTF8(id, eventStruct + 136, 128);
 GROWABLE_HEAP_I32()[(((eventStruct) + (264)) >> 2)] = reportedElement ? reportedElement.clientWidth : 0;
 GROWABLE_HEAP_I32()[(((eventStruct) + (268)) >> 2)] = reportedElement ? reportedElement.clientHeight : 0;
 GROWABLE_HEAP_I32()[(((eventStruct) + (272)) >> 2)] = screen.width;
 GROWABLE_HEAP_I32()[(((eventStruct) + (276)) >> 2)] = screen.height;
 if (isFullscreen) {
  JSEvents.previousFullscreenElement = fullscreenElement;
 }
};

var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc(280);
 var fullscreenChangeEventhandlerFunc = (e = event) => {
  var fullscreenChangeEvent = targetThread ? _malloc(280) : JSEvents.fullscreenChangeEvent;
  fillFullscreenChangeEventData(fullscreenChangeEvent);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, fullscreenChangeEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: fullscreenChangeEventhandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(23, 1, target, userData, useCapture, callbackfunc, targetThread);
 if (!JSEvents.fullscreenEnabled()) return -1;
 target = findEventTarget(target);
 if (!target) return -4;
 registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
 return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
}

var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc(1432);
 var gamepadEventHandlerFunc = (e = event) => {
  var gamepadEvent = targetThread ? _malloc(1432) : JSEvents.gamepadEvent;
  fillGamepadEventData(gamepadEvent, e["gamepad"]);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, gamepadEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, gamepadEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: findEventTarget(target),
  allowsDeferredCalls: true,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: gamepadEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(24, 1, userData, useCapture, callbackfunc, targetThread);
 if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
 return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
}

function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(25, 1, userData, useCapture, callbackfunc, targetThread);
 if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
 return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
}

var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(176);
 var keyEventHandlerFunc = e => {
  var keyEventData = targetThread ? _malloc(176) : JSEvents.keyEvent;
  GROWABLE_HEAP_F64()[((keyEventData) >> 3)] = e.timeStamp;
  var idx = keyEventData >> 2;
  GROWABLE_HEAP_I32()[idx + 2] = e.location;
  GROWABLE_HEAP_I32()[idx + 3] = e.ctrlKey;
  GROWABLE_HEAP_I32()[idx + 4] = e.shiftKey;
  GROWABLE_HEAP_I32()[idx + 5] = e.altKey;
  GROWABLE_HEAP_I32()[idx + 6] = e.metaKey;
  GROWABLE_HEAP_I32()[idx + 7] = e.repeat;
  GROWABLE_HEAP_I32()[idx + 8] = e.charCode;
  GROWABLE_HEAP_I32()[idx + 9] = e.keyCode;
  GROWABLE_HEAP_I32()[idx + 10] = e.which;
  stringToUTF8(e.key || "", keyEventData + 44, 32);
  stringToUTF8(e.code || "", keyEventData + 76, 32);
  stringToUTF8(e.char || "", keyEventData + 108, 32);
  stringToUTF8(e.locale || "", keyEventData + 140, 32);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, keyEventData, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, keyEventData, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: findEventTarget(target),
  allowsDeferredCalls: true,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: keyEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(26, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
}

function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(27, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
}

function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(28, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
}

var fillMouseEventData = (eventStruct, e, target) => {
 GROWABLE_HEAP_F64()[((eventStruct) >> 3)] = e.timeStamp;
 var idx = eventStruct >> 2;
 GROWABLE_HEAP_I32()[idx + 2] = e.screenX;
 GROWABLE_HEAP_I32()[idx + 3] = e.screenY;
 GROWABLE_HEAP_I32()[idx + 4] = e.clientX;
 GROWABLE_HEAP_I32()[idx + 5] = e.clientY;
 GROWABLE_HEAP_I32()[idx + 6] = e.ctrlKey;
 GROWABLE_HEAP_I32()[idx + 7] = e.shiftKey;
 GROWABLE_HEAP_I32()[idx + 8] = e.altKey;
 GROWABLE_HEAP_I32()[idx + 9] = e.metaKey;
 GROWABLE_HEAP_I16()[idx * 2 + 20] = e.button;
 GROWABLE_HEAP_I16()[idx * 2 + 21] = e.buttons;
 GROWABLE_HEAP_I32()[idx + 11] = e["movementX"];
 GROWABLE_HEAP_I32()[idx + 12] = e["movementY"];
 var rect = getBoundingClientRect(target);
 GROWABLE_HEAP_I32()[idx + 13] = e.clientX - rect.left;
 GROWABLE_HEAP_I32()[idx + 14] = e.clientY - rect.top;
};

var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(72);
 target = findEventTarget(target);
 var mouseEventHandlerFunc = (e = event) => {
  fillMouseEventData(JSEvents.mouseEvent, e, target);
  if (targetThread) {
   var mouseEventData = _malloc(72);
   fillMouseEventData(mouseEventData, e, target);
   JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, mouseEventData, userData);
  } else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: mouseEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(29, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
}

function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(30, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
}

function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(31, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
}

function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(32, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
}

function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(33, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
}

var fillPointerlockChangeEventData = eventStruct => {
 var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
 var isPointerlocked = !!pointerLockElement;
 /** @suppress{checkTypes} */ GROWABLE_HEAP_I32()[((eventStruct) >> 2)] = isPointerlocked;
 var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
 var id = (pointerLockElement && pointerLockElement.id) ? pointerLockElement.id : "";
 stringToUTF8(nodeName, eventStruct + 4, 128);
 stringToUTF8(id, eventStruct + 132, 128);
};

var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.pointerlockChangeEvent) JSEvents.pointerlockChangeEvent = _malloc(260);
 var pointerlockChangeEventHandlerFunc = (e = event) => {
  var pointerlockChangeEvent = targetThread ? _malloc(260) : JSEvents.pointerlockChangeEvent;
  fillPointerlockChangeEventData(pointerlockChangeEvent);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, pointerlockChangeEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: pointerlockChangeEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

/** @suppress {missingProperties} */ function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(34, 1, target, userData, useCapture, callbackfunc, targetThread);
 if (!document || !document.body || (!document.body.requestPointerLock && !document.body.mozRequestPointerLock && !document.body.webkitRequestPointerLock && !document.body.msRequestPointerLock)) {
  return -1;
 }
 target = findEventTarget(target);
 if (!target) return -4;
 registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mozpointerlockchange", targetThread);
 registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "webkitpointerlockchange", targetThread);
 registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "mspointerlockchange", targetThread);
 return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
}

var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc(36);
 target = findEventTarget(target);
 var uiEventHandlerFunc = (e = event) => {
  if (e.target != target) {
   return;
  }
  var b = document.body;
  if (!b) {
   return;
  }
  var uiEvent = targetThread ? _malloc(36) : JSEvents.uiEvent;
  GROWABLE_HEAP_I32()[((uiEvent) >> 2)] = e.detail;
  GROWABLE_HEAP_I32()[(((uiEvent) + (4)) >> 2)] = b.clientWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (8)) >> 2)] = b.clientHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (12)) >> 2)] = innerWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (16)) >> 2)] = innerHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (20)) >> 2)] = outerWidth;
  GROWABLE_HEAP_I32()[(((uiEvent) + (24)) >> 2)] = outerHeight;
  GROWABLE_HEAP_I32()[(((uiEvent) + (28)) >> 2)] = pageXOffset;
  GROWABLE_HEAP_I32()[(((uiEvent) + (32)) >> 2)] = pageYOffset;
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, uiEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, uiEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: uiEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(35, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, "resize", targetThread);
}

var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1696);
 target = findEventTarget(target);
 var touchEventHandlerFunc = e => {
  var t, touches = {}, et = e.touches;
  for (var i = 0; i < et.length; ++i) {
   t = et[i];
   t.isChanged = t.onTarget = 0;
   touches[t.identifier] = t;
  }
  for (var i = 0; i < e.changedTouches.length; ++i) {
   t = e.changedTouches[i];
   t.isChanged = 1;
   touches[t.identifier] = t;
  }
  for (var i = 0; i < e.targetTouches.length; ++i) {
   touches[e.targetTouches[i].identifier].onTarget = 1;
  }
  var touchEvent = targetThread ? _malloc(1696) : JSEvents.touchEvent;
  GROWABLE_HEAP_F64()[((touchEvent) >> 3)] = e.timeStamp;
  var idx = touchEvent >> 2;
  GROWABLE_HEAP_I32()[idx + 3] = e.ctrlKey;
  GROWABLE_HEAP_I32()[idx + 4] = e.shiftKey;
  GROWABLE_HEAP_I32()[idx + 5] = e.altKey;
  GROWABLE_HEAP_I32()[idx + 6] = e.metaKey;
  idx += 7;
  var targetRect = getBoundingClientRect(target);
  var numTouches = 0;
  for (var i in touches) {
   t = touches[i];
   GROWABLE_HEAP_I32()[idx + 0] = t.identifier;
   GROWABLE_HEAP_I32()[idx + 1] = t.screenX;
   GROWABLE_HEAP_I32()[idx + 2] = t.screenY;
   GROWABLE_HEAP_I32()[idx + 3] = t.clientX;
   GROWABLE_HEAP_I32()[idx + 4] = t.clientY;
   GROWABLE_HEAP_I32()[idx + 5] = t.pageX;
   GROWABLE_HEAP_I32()[idx + 6] = t.pageY;
   GROWABLE_HEAP_I32()[idx + 7] = t.isChanged;
   GROWABLE_HEAP_I32()[idx + 8] = t.onTarget;
   GROWABLE_HEAP_I32()[idx + 9] = t.clientX - targetRect.left;
   GROWABLE_HEAP_I32()[idx + 10] = t.clientY - targetRect.top;
   idx += 13;
   if (++numTouches > 31) {
    break;
   }
  }
  GROWABLE_HEAP_I32()[(((touchEvent) + (8)) >> 2)] = numTouches;
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, touchEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, touchEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: touchEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(36, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
}

function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(37, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
}

function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(38, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
}

function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(39, 1, target, userData, useCapture, callbackfunc, targetThread);
 return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
}

var fillVisibilityChangeEventData = eventStruct => {
 var visibilityStates = [ "hidden", "visible", "prerender", "unloaded" ];
 var visibilityState = visibilityStates.indexOf(document.visibilityState);
 /** @suppress{checkTypes} */ GROWABLE_HEAP_I32()[((eventStruct) >> 2)] = document.hidden;
 GROWABLE_HEAP_I32()[(((eventStruct) + (4)) >> 2)] = visibilityState;
};

var registerVisibilityChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc(8);
 var visibilityChangeEventHandlerFunc = (e = event) => {
  var visibilityChangeEvent = targetThread ? _malloc(8) : JSEvents.visibilityChangeEvent;
  fillVisibilityChangeEventData(visibilityChangeEvent);
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, visibilityChangeEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: visibilityChangeEventHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(40, 1, userData, useCapture, callbackfunc, targetThread);
 if (!specialHTMLTargets[1]) {
  return -4;
 }
 return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, "visibilitychange", targetThread);
}

var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
 targetThread = JSEvents.getTargetThreadForEventCallback(targetThread);
 if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
 var wheelHandlerFunc = (e = event) => {
  var wheelEvent = targetThread ? _malloc(104) : JSEvents.wheelEvent;
  fillMouseEventData(wheelEvent, e, target);
  GROWABLE_HEAP_F64()[(((wheelEvent) + (72)) >> 3)] = e["deltaX"];
  GROWABLE_HEAP_F64()[(((wheelEvent) + (80)) >> 3)] = e["deltaY"];
  GROWABLE_HEAP_F64()[(((wheelEvent) + (88)) >> 3)] = e["deltaZ"];
  GROWABLE_HEAP_I32()[(((wheelEvent) + (96)) >> 2)] = e["deltaMode"];
  if (targetThread) JSEvents.queueEventHandlerOnThread_iiii(targetThread, callbackfunc, eventTypeId, wheelEvent, userData); else if (((a1, a2, a3) => dynCall_iiii.apply(null, [ callbackfunc, a1, a2, a3 ]))(eventTypeId, wheelEvent, userData)) e.preventDefault();
 };
 var eventHandler = {
  target: target,
  allowsDeferredCalls: true,
  eventTypeString: eventTypeString,
  callbackfunc: callbackfunc,
  handlerFunc: wheelHandlerFunc,
  useCapture: useCapture
 };
 return JSEvents.registerOrRemoveHandler(eventHandler);
};

function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(41, 1, target, userData, useCapture, callbackfunc, targetThread);
 target = findEventTarget(target);
 if (!target) return -4;
 if (typeof target.onwheel != "undefined") {
  return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
 } else {
  return -1;
 }
}

function _emscripten_set_window_title(title) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(42, 1, title);
 return document.title = UTF8ToString(title);
}

var _emscripten_sleep = ms => Asyncify.handleSleep(wakeUp => safeSetTimeout(wakeUp, ms));

_emscripten_sleep.isAsync = true;

var emscripten_webgl_power_preferences = [ "default", "low-power", "high-performance" ];

/** @suppress {duplicate } */ var _emscripten_webgl_do_create_context = (target, attributes) => {
 var a = attributes >> 2;
 var powerPreference = GROWABLE_HEAP_I32()[a + (24 >> 2)];
 var contextAttributes = {
  "alpha": !!GROWABLE_HEAP_I32()[a + (0 >> 2)],
  "depth": !!GROWABLE_HEAP_I32()[a + (4 >> 2)],
  "stencil": !!GROWABLE_HEAP_I32()[a + (8 >> 2)],
  "antialias": !!GROWABLE_HEAP_I32()[a + (12 >> 2)],
  "premultipliedAlpha": !!GROWABLE_HEAP_I32()[a + (16 >> 2)],
  "preserveDrawingBuffer": !!GROWABLE_HEAP_I32()[a + (20 >> 2)],
  "powerPreference": emscripten_webgl_power_preferences[powerPreference],
  "failIfMajorPerformanceCaveat": !!GROWABLE_HEAP_I32()[a + (28 >> 2)],
  majorVersion: GROWABLE_HEAP_I32()[a + (32 >> 2)],
  minorVersion: GROWABLE_HEAP_I32()[a + (36 >> 2)],
  enableExtensionsByDefault: GROWABLE_HEAP_I32()[a + (40 >> 2)],
  explicitSwapControl: GROWABLE_HEAP_I32()[a + (44 >> 2)],
  proxyContextToMainThread: GROWABLE_HEAP_I32()[a + (48 >> 2)],
  renderViaOffscreenBackBuffer: GROWABLE_HEAP_I32()[a + (52 >> 2)]
 };
 var canvas = findCanvasEventTarget(target);
 if (!canvas) {
  return 0;
 }
 if (contextAttributes.explicitSwapControl) {
  return 0;
 }
 var contextHandle = GL.createContext(canvas, contextAttributes);
 return contextHandle;
};

var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;

var _emscripten_webgl_destroy_context = contextHandle => {
 if (GL.currentContext == contextHandle) GL.currentContext = 0;
 GL.deleteContext(contextHandle);
};

var _emscripten_webgl_init_context_attributes = attributes => {
 var a = attributes >> 2;
 for (var i = 0; i < (56 >> 2); ++i) {
  GROWABLE_HEAP_I32()[a + i] = 0;
 }
 GROWABLE_HEAP_I32()[a + (0 >> 2)] = GROWABLE_HEAP_I32()[a + (4 >> 2)] = GROWABLE_HEAP_I32()[a + (12 >> 2)] = GROWABLE_HEAP_I32()[a + (16 >> 2)] = GROWABLE_HEAP_I32()[a + (32 >> 2)] = GROWABLE_HEAP_I32()[a + (40 >> 2)] = 1;
 if (ENVIRONMENT_IS_WORKER) GROWABLE_HEAP_I32()[(((attributes) + (48)) >> 2)] = 1;
};

var _emscripten_webgl_make_context_current = contextHandle => {
 var success = GL.makeContextCurrent(contextHandle);
 return success ? 0 : -5;
};

var ENV = {};

var getExecutableName = () => thisProgram || "./this.program";

var getEnvStrings = () => {
 if (!getEnvStrings.strings) {
  var lang = ((typeof navigator == "object" && navigator.languages && navigator.languages[0]) || "C").replace("-", "_") + ".UTF-8";
  var env = {
   "USER": "web_user",
   "LOGNAME": "web_user",
   "PATH": "/",
   "PWD": "/",
   "HOME": "/home/web_user",
   "LANG": lang,
   "_": getExecutableName()
  };
  for (var x in ENV) {
   if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x];
  }
  var strings = [];
  for (var x in env) {
   strings.push(`${x}=${env[x]}`);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
};

var stringToAscii = (str, buffer) => {
 for (var i = 0; i < str.length; ++i) {
  GROWABLE_HEAP_I8()[((buffer++) >> 0)] = str.charCodeAt(i);
 }
 GROWABLE_HEAP_I8()[((buffer) >> 0)] = 0;
};

var _environ_get = function(__environ, environ_buf) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(43, 1, __environ, environ_buf);
 var bufSize = 0;
 getEnvStrings().forEach((string, i) => {
  var ptr = environ_buf + bufSize;
  GROWABLE_HEAP_U32()[(((__environ) + (i * 4)) >> 2)] = ptr;
  stringToAscii(string, ptr);
  bufSize += string.length + 1;
 });
 return 0;
};

var _environ_sizes_get = function(penviron_count, penviron_buf_size) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(44, 1, penviron_count, penviron_buf_size);
 var strings = getEnvStrings();
 GROWABLE_HEAP_U32()[((penviron_count) >> 2)] = strings.length;
 var bufSize = 0;
 strings.forEach(string => bufSize += string.length + 1);
 GROWABLE_HEAP_U32()[((penviron_buf_size) >> 2)] = bufSize;
 return 0;
};

function _fd_close(fd) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(45, 1, fd);
 return 52;
}

function _fd_read(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(46, 1, fd, iov, iovcnt, pnum);
 return 52;
}

var convertI32PairToI53Checked = (lo, hi) => ((hi + 2097152) >>> 0 < 4194305 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(47, 1, fd, offset_low, offset_high, whence, newOffset);
 var offset = convertI32PairToI53Checked(offset_low, offset_high);
 return 70;
}

var printCharBuffers = [ null, [], [] ];

var printChar = (stream, curr) => {
 var buffer = printCharBuffers[stream];
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
};

var flush_NO_FILESYSTEM = () => {
 if (printCharBuffers[1].length) printChar(1, 10);
 if (printCharBuffers[2].length) printChar(2, 10);
};

function _fd_write(fd, iov, iovcnt, pnum) {
 if (ENVIRONMENT_IS_PTHREAD) return proxyToMainThread(48, 1, fd, iov, iovcnt, pnum);
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = GROWABLE_HEAP_U32()[((iov) >> 2)];
  var len = GROWABLE_HEAP_U32()[(((iov) + (4)) >> 2)];
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, GROWABLE_HEAP_U8()[ptr + j]);
  }
  num += len;
 }
 GROWABLE_HEAP_U32()[((pnum) >> 2)] = num;
 return 0;
}

var listenOnce = (object, event, func) => {
 object.addEventListener(event, func, {
  "once": true
 });
};

/** @param {Object=} elements */ var autoResumeAudioContext = (ctx, elements) => {
 if (!elements) {
  elements = [ document, document.getElementById("canvas") ];
 }
 [ "keydown", "mousedown", "touchstart" ].forEach(event => {
  elements.forEach(element => {
   if (element) {
    listenOnce(element, event, () => {
     if (ctx.state === "suspended") ctx.resume();
    });
   }
  });
 });
};

var dynCallLegacy = (sig, ptr, args) => {
 var f = Module["dynCall_" + sig];
 return args && args.length ? f.apply(null, [ ptr ].concat(args)) : f.call(null, ptr);
};

var wasmTableMirror = [];

var wasmTable;

var getWasmTableEntry = funcPtr => {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 return func;
};

/** @param {Object=} args */ var dynCall = (sig, ptr, args) => {
 var rtn = dynCallLegacy(sig, ptr, args);
 return rtn;
};

var runAndAbortIfError = func => {
 try {
  return func();
 } catch (e) {
  abort(e);
 }
};

var sigToWasmTypes = sig => {
 var typeNames = {
  "i": "i32",
  "j": "i64",
  "f": "f32",
  "d": "f64",
  "p": "i32"
 };
 var type = {
  parameters: [],
  results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
 };
 for (var i = 1; i < sig.length; ++i) {
  type.parameters.push(typeNames[sig[i]]);
 }
 return type;
};

var Asyncify = {
 instrumentWasmImports(imports) {
  var importPattern = /^(invoke_.*|__asyncjs__.*)$/;
  for (var x in imports) {
   (function(x) {
    var original = imports[x];
    var sig = original.sig;
    if (typeof original == "function") {
     var isAsyncifyImport = original.isAsync || importPattern.test(x);
    }
   })(x);
  }
 },
 instrumentWasmExports(exports) {
  var ret = {};
  for (var x in exports) {
   (function(x) {
    var original = exports[x];
    if (typeof original == "function") {
     ret[x] = function() {
      Asyncify.exportCallStack.push(x);
      try {
       return original.apply(null, arguments);
      } finally {
       if (!ABORT) {
        var y = Asyncify.exportCallStack.pop();
        assert(y === x);
        Asyncify.maybeStopUnwind();
       }
      }
     };
    } else {
     ret[x] = original;
    }
   })(x);
  }
  return ret;
 },
 State: {
  Normal: 0,
  Unwinding: 1,
  Rewinding: 2,
  Disabled: 3
 },
 state: 0,
 StackSize: 4096,
 currData: null,
 handleSleepReturnValue: 0,
 exportCallStack: [],
 callStackNameToId: {},
 callStackIdToName: {},
 callStackId: 0,
 asyncPromiseHandlers: null,
 sleepCallbacks: [],
 getCallStackId(funcName) {
  var id = Asyncify.callStackNameToId[funcName];
  if (id === undefined) {
   id = Asyncify.callStackId++;
   Asyncify.callStackNameToId[funcName] = id;
   Asyncify.callStackIdToName[id] = funcName;
  }
  return id;
 },
 maybeStopUnwind() {
  if (Asyncify.currData && Asyncify.state === Asyncify.State.Unwinding && Asyncify.exportCallStack.length === 0) {
   Asyncify.state = Asyncify.State.Normal;
   runtimeKeepalivePush();
   runAndAbortIfError(_asyncify_stop_unwind);
   if (typeof Fibers != "undefined") {
    Fibers.trampoline();
   }
  }
 },
 whenDone() {
  return new Promise((resolve, reject) => {
   Asyncify.asyncPromiseHandlers = {
    resolve: resolve,
    reject: reject
   };
  });
 },
 allocateData() {
  var ptr = _malloc(12 + Asyncify.StackSize);
  Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
  Asyncify.setDataRewindFunc(ptr);
  return ptr;
 },
 setDataHeader(ptr, stack, stackSize) {
  GROWABLE_HEAP_U32()[((ptr) >> 2)] = stack;
  GROWABLE_HEAP_U32()[(((ptr) + (4)) >> 2)] = stack + stackSize;
 },
 setDataRewindFunc(ptr) {
  var bottomOfCallStack = Asyncify.exportCallStack[0];
  var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
  GROWABLE_HEAP_I32()[(((ptr) + (8)) >> 2)] = rewindId;
 },
 getDataRewindFunc(ptr) {
  var id = GROWABLE_HEAP_I32()[(((ptr) + (8)) >> 2)];
  var name = Asyncify.callStackIdToName[id];
  var func = wasmExports[name];
  return func;
 },
 doRewind(ptr) {
  var start = Asyncify.getDataRewindFunc(ptr);
  runtimeKeepalivePop();
  return start();
 },
 handleSleep(startAsync) {
  if (ABORT) return;
  if (Asyncify.state === Asyncify.State.Normal) {
   var reachedCallback = false;
   var reachedAfterCallback = false;
   startAsync((handleSleepReturnValue = 0) => {
    if (ABORT) return;
    Asyncify.handleSleepReturnValue = handleSleepReturnValue;
    reachedCallback = true;
    if (!reachedAfterCallback) {
     return;
    }
    Asyncify.state = Asyncify.State.Rewinding;
    runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
    if (typeof Browser != "undefined" && Browser.mainLoop.func) {
     Browser.mainLoop.resume();
    }
    var asyncWasmReturnValue, isError = false;
    try {
     asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
    } catch (err) {
     asyncWasmReturnValue = err;
     isError = true;
    }
    var handled = false;
    if (!Asyncify.currData) {
     var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
     if (asyncPromiseHandlers) {
      Asyncify.asyncPromiseHandlers = null;
      (isError ? asyncPromiseHandlers.reject : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
      handled = true;
     }
    }
    if (isError && !handled) {
     throw asyncWasmReturnValue;
    }
   });
   reachedAfterCallback = true;
   if (!reachedCallback) {
    Asyncify.state = Asyncify.State.Unwinding;
    Asyncify.currData = Asyncify.allocateData();
    if (typeof Browser != "undefined" && Browser.mainLoop.func) {
     Browser.mainLoop.pause();
    }
    runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
   }
  } else if (Asyncify.state === Asyncify.State.Rewinding) {
   Asyncify.state = Asyncify.State.Normal;
   runAndAbortIfError(_asyncify_stop_rewind);
   _free(Asyncify.currData);
   Asyncify.currData = null;
   Asyncify.sleepCallbacks.forEach(func => callUserCallback(func));
  } else {
   abort(`invalid state: ${Asyncify.state}`);
  }
  return Asyncify.handleSleepReturnValue;
 },
 handleAsync(startAsync) {
  return Asyncify.handleSleep(wakeUp => {
   startAsync().then(wakeUp);
  });
 }
};

PThread.init();

Module["requestFullscreen"] = (lockPointer, resizeCanvas) => Browser.requestFullscreen(lockPointer, resizeCanvas);

Module["requestAnimationFrame"] = func => Browser.requestAnimationFrame(func);

Module["setCanvasSize"] = (width, height, noUpdates) => Browser.setCanvasSize(width, height, noUpdates);

Module["pauseMainLoop"] = () => Browser.mainLoop.pause();

Module["resumeMainLoop"] = () => Browser.mainLoop.resume();

Module["getUserMedia"] = () => Browser.getUserMedia();

Module["createContext"] = (canvas, useWebGL, setInModule, webGLContextAttributes) => Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);

var preloadedImages = {};

var preloadedAudios = {};

var GLctx;

for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));

var miniTempWebGLFloatBuffersStorage = new Float32Array(288);

for (/**@suppress{duplicate}*/ var i = 0; i < 288; ++i) {
 miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
}

var miniTempWebGLIntBuffersStorage = new Int32Array(288);

for (/**@suppress{duplicate}*/ var i = 0; i < 288; ++i) {
 miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i + 1);
}

var proxiedFunctionTable = [ _proc_exit, exitOnMainThread, pthreadCreateProxied, ___syscall_fcntl64, ___syscall_ioctl, ___syscall_openat, _emscripten_exit_fullscreen, getCanvasSizeMainThread, setCanvasElementSizeMainThread, _emscripten_exit_pointerlock, _emscripten_force_exit, _emscripten_get_device_pixel_ratio, _emscripten_get_element_css_size, _emscripten_get_gamepad_status, _emscripten_get_num_gamepads, _emscripten_get_screen_size, _emscripten_request_fullscreen_strategy, _emscripten_request_pointerlock, _emscripten_sample_gamepad_data, _emscripten_set_beforeunload_callback_on_thread, _emscripten_set_blur_callback_on_thread, _emscripten_set_element_css_size, _emscripten_set_focus_callback_on_thread, _emscripten_set_fullscreenchange_callback_on_thread, _emscripten_set_gamepadconnected_callback_on_thread, _emscripten_set_gamepaddisconnected_callback_on_thread, _emscripten_set_keydown_callback_on_thread, _emscripten_set_keypress_callback_on_thread, _emscripten_set_keyup_callback_on_thread, _emscripten_set_mousedown_callback_on_thread, _emscripten_set_mouseenter_callback_on_thread, _emscripten_set_mouseleave_callback_on_thread, _emscripten_set_mousemove_callback_on_thread, _emscripten_set_mouseup_callback_on_thread, _emscripten_set_pointerlockchange_callback_on_thread, _emscripten_set_resize_callback_on_thread, _emscripten_set_touchcancel_callback_on_thread, _emscripten_set_touchend_callback_on_thread, _emscripten_set_touchmove_callback_on_thread, _emscripten_set_touchstart_callback_on_thread, _emscripten_set_visibilitychange_callback_on_thread, _emscripten_set_wheel_callback_on_thread, _emscripten_set_window_title, _environ_get, _environ_sizes_get, _fd_close, _fd_read, _fd_seek, _fd_write ];

var wasmImports = {
 /** @export */ __call_sighandler: ___call_sighandler,
 /** @export */ __emscripten_init_main_thread_js: ___emscripten_init_main_thread_js,
 /** @export */ __emscripten_thread_cleanup: ___emscripten_thread_cleanup,
 /** @export */ __pthread_create_js: ___pthread_create_js,
 /** @export */ __syscall_fcntl64: ___syscall_fcntl64,
 /** @export */ __syscall_ioctl: ___syscall_ioctl,
 /** @export */ __syscall_openat: ___syscall_openat,
 /** @export */ _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
 /** @export */ _emscripten_notify_mailbox_postmessage: __emscripten_notify_mailbox_postmessage,
 /** @export */ _emscripten_receive_on_main_thread_js: __emscripten_receive_on_main_thread_js,
 /** @export */ _emscripten_set_offscreencanvas_size: __emscripten_set_offscreencanvas_size,
 /** @export */ _emscripten_thread_mailbox_await: __emscripten_thread_mailbox_await,
 /** @export */ _emscripten_thread_set_strongref: __emscripten_thread_set_strongref,
 /** @export */ emscripten_asm_const_int: _emscripten_asm_const_int,
 /** @export */ emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
 /** @export */ emscripten_cancel_main_loop: _emscripten_cancel_main_loop,
 /** @export */ emscripten_check_blocking_allowed: _emscripten_check_blocking_allowed,
 /** @export */ emscripten_date_now: _emscripten_date_now,
 /** @export */ emscripten_exit_fullscreen: _emscripten_exit_fullscreen,
 /** @export */ emscripten_exit_pointerlock: _emscripten_exit_pointerlock,
 /** @export */ emscripten_exit_with_live_runtime: _emscripten_exit_with_live_runtime,
 /** @export */ emscripten_force_exit: _emscripten_force_exit,
 /** @export */ emscripten_get_device_pixel_ratio: _emscripten_get_device_pixel_ratio,
 /** @export */ emscripten_get_element_css_size: _emscripten_get_element_css_size,
 /** @export */ emscripten_get_gamepad_status: _emscripten_get_gamepad_status,
 /** @export */ emscripten_get_main_loop_timing: _emscripten_get_main_loop_timing,
 /** @export */ emscripten_get_now: _emscripten_get_now,
 /** @export */ emscripten_get_num_gamepads: _emscripten_get_num_gamepads,
 /** @export */ emscripten_get_screen_size: _emscripten_get_screen_size,
 /** @export */ emscripten_glActiveTexture: _emscripten_glActiveTexture,
 /** @export */ emscripten_glAttachShader: _emscripten_glAttachShader,
 /** @export */ emscripten_glBeginQuery: _emscripten_glBeginQuery,
 /** @export */ emscripten_glBeginQueryEXT: _emscripten_glBeginQueryEXT,
 /** @export */ emscripten_glBeginTransformFeedback: _emscripten_glBeginTransformFeedback,
 /** @export */ emscripten_glBindAttribLocation: _emscripten_glBindAttribLocation,
 /** @export */ emscripten_glBindBuffer: _emscripten_glBindBuffer,
 /** @export */ emscripten_glBindBufferBase: _emscripten_glBindBufferBase,
 /** @export */ emscripten_glBindBufferRange: _emscripten_glBindBufferRange,
 /** @export */ emscripten_glBindFramebuffer: _emscripten_glBindFramebuffer,
 /** @export */ emscripten_glBindRenderbuffer: _emscripten_glBindRenderbuffer,
 /** @export */ emscripten_glBindSampler: _emscripten_glBindSampler,
 /** @export */ emscripten_glBindTexture: _emscripten_glBindTexture,
 /** @export */ emscripten_glBindTransformFeedback: _emscripten_glBindTransformFeedback,
 /** @export */ emscripten_glBindVertexArray: _emscripten_glBindVertexArray,
 /** @export */ emscripten_glBindVertexArrayOES: _emscripten_glBindVertexArrayOES,
 /** @export */ emscripten_glBlendColor: _emscripten_glBlendColor,
 /** @export */ emscripten_glBlendEquation: _emscripten_glBlendEquation,
 /** @export */ emscripten_glBlendEquationSeparate: _emscripten_glBlendEquationSeparate,
 /** @export */ emscripten_glBlendFunc: _emscripten_glBlendFunc,
 /** @export */ emscripten_glBlendFuncSeparate: _emscripten_glBlendFuncSeparate,
 /** @export */ emscripten_glBlitFramebuffer: _emscripten_glBlitFramebuffer,
 /** @export */ emscripten_glBufferData: _emscripten_glBufferData,
 /** @export */ emscripten_glBufferSubData: _emscripten_glBufferSubData,
 /** @export */ emscripten_glCheckFramebufferStatus: _emscripten_glCheckFramebufferStatus,
 /** @export */ emscripten_glClear: _emscripten_glClear,
 /** @export */ emscripten_glClearBufferfi: _emscripten_glClearBufferfi,
 /** @export */ emscripten_glClearBufferfv: _emscripten_glClearBufferfv,
 /** @export */ emscripten_glClearBufferiv: _emscripten_glClearBufferiv,
 /** @export */ emscripten_glClearBufferuiv: _emscripten_glClearBufferuiv,
 /** @export */ emscripten_glClearColor: _emscripten_glClearColor,
 /** @export */ emscripten_glClearDepthf: _emscripten_glClearDepthf,
 /** @export */ emscripten_glClearStencil: _emscripten_glClearStencil,
 /** @export */ emscripten_glClientWaitSync: _emscripten_glClientWaitSync,
 /** @export */ emscripten_glColorMask: _emscripten_glColorMask,
 /** @export */ emscripten_glCompileShader: _emscripten_glCompileShader,
 /** @export */ emscripten_glCompressedTexImage2D: _emscripten_glCompressedTexImage2D,
 /** @export */ emscripten_glCompressedTexImage3D: _emscripten_glCompressedTexImage3D,
 /** @export */ emscripten_glCompressedTexSubImage2D: _emscripten_glCompressedTexSubImage2D,
 /** @export */ emscripten_glCompressedTexSubImage3D: _emscripten_glCompressedTexSubImage3D,
 /** @export */ emscripten_glCopyBufferSubData: _emscripten_glCopyBufferSubData,
 /** @export */ emscripten_glCopyTexImage2D: _emscripten_glCopyTexImage2D,
 /** @export */ emscripten_glCopyTexSubImage2D: _emscripten_glCopyTexSubImage2D,
 /** @export */ emscripten_glCopyTexSubImage3D: _emscripten_glCopyTexSubImage3D,
 /** @export */ emscripten_glCreateProgram: _emscripten_glCreateProgram,
 /** @export */ emscripten_glCreateShader: _emscripten_glCreateShader,
 /** @export */ emscripten_glCullFace: _emscripten_glCullFace,
 /** @export */ emscripten_glDeleteBuffers: _emscripten_glDeleteBuffers,
 /** @export */ emscripten_glDeleteFramebuffers: _emscripten_glDeleteFramebuffers,
 /** @export */ emscripten_glDeleteProgram: _emscripten_glDeleteProgram,
 /** @export */ emscripten_glDeleteQueries: _emscripten_glDeleteQueries,
 /** @export */ emscripten_glDeleteQueriesEXT: _emscripten_glDeleteQueriesEXT,
 /** @export */ emscripten_glDeleteRenderbuffers: _emscripten_glDeleteRenderbuffers,
 /** @export */ emscripten_glDeleteSamplers: _emscripten_glDeleteSamplers,
 /** @export */ emscripten_glDeleteShader: _emscripten_glDeleteShader,
 /** @export */ emscripten_glDeleteSync: _emscripten_glDeleteSync,
 /** @export */ emscripten_glDeleteTextures: _emscripten_glDeleteTextures,
 /** @export */ emscripten_glDeleteTransformFeedbacks: _emscripten_glDeleteTransformFeedbacks,
 /** @export */ emscripten_glDeleteVertexArrays: _emscripten_glDeleteVertexArrays,
 /** @export */ emscripten_glDeleteVertexArraysOES: _emscripten_glDeleteVertexArraysOES,
 /** @export */ emscripten_glDepthFunc: _emscripten_glDepthFunc,
 /** @export */ emscripten_glDepthMask: _emscripten_glDepthMask,
 /** @export */ emscripten_glDepthRangef: _emscripten_glDepthRangef,
 /** @export */ emscripten_glDetachShader: _emscripten_glDetachShader,
 /** @export */ emscripten_glDisable: _emscripten_glDisable,
 /** @export */ emscripten_glDisableVertexAttribArray: _emscripten_glDisableVertexAttribArray,
 /** @export */ emscripten_glDrawArrays: _emscripten_glDrawArrays,
 /** @export */ emscripten_glDrawArraysInstanced: _emscripten_glDrawArraysInstanced,
 /** @export */ emscripten_glDrawArraysInstancedANGLE: _emscripten_glDrawArraysInstancedANGLE,
 /** @export */ emscripten_glDrawArraysInstancedARB: _emscripten_glDrawArraysInstancedARB,
 /** @export */ emscripten_glDrawArraysInstancedEXT: _emscripten_glDrawArraysInstancedEXT,
 /** @export */ emscripten_glDrawArraysInstancedNV: _emscripten_glDrawArraysInstancedNV,
 /** @export */ emscripten_glDrawBuffers: _emscripten_glDrawBuffers,
 /** @export */ emscripten_glDrawBuffersEXT: _emscripten_glDrawBuffersEXT,
 /** @export */ emscripten_glDrawBuffersWEBGL: _emscripten_glDrawBuffersWEBGL,
 /** @export */ emscripten_glDrawElements: _emscripten_glDrawElements,
 /** @export */ emscripten_glDrawElementsInstanced: _emscripten_glDrawElementsInstanced,
 /** @export */ emscripten_glDrawElementsInstancedANGLE: _emscripten_glDrawElementsInstancedANGLE,
 /** @export */ emscripten_glDrawElementsInstancedARB: _emscripten_glDrawElementsInstancedARB,
 /** @export */ emscripten_glDrawElementsInstancedEXT: _emscripten_glDrawElementsInstancedEXT,
 /** @export */ emscripten_glDrawElementsInstancedNV: _emscripten_glDrawElementsInstancedNV,
 /** @export */ emscripten_glDrawRangeElements: _emscripten_glDrawRangeElements,
 /** @export */ emscripten_glEnable: _emscripten_glEnable,
 /** @export */ emscripten_glEnableVertexAttribArray: _emscripten_glEnableVertexAttribArray,
 /** @export */ emscripten_glEndQuery: _emscripten_glEndQuery,
 /** @export */ emscripten_glEndQueryEXT: _emscripten_glEndQueryEXT,
 /** @export */ emscripten_glEndTransformFeedback: _emscripten_glEndTransformFeedback,
 /** @export */ emscripten_glFenceSync: _emscripten_glFenceSync,
 /** @export */ emscripten_glFinish: _emscripten_glFinish,
 /** @export */ emscripten_glFlush: _emscripten_glFlush,
 /** @export */ emscripten_glFlushMappedBufferRange: _emscripten_glFlushMappedBufferRange,
 /** @export */ emscripten_glFramebufferRenderbuffer: _emscripten_glFramebufferRenderbuffer,
 /** @export */ emscripten_glFramebufferTexture2D: _emscripten_glFramebufferTexture2D,
 /** @export */ emscripten_glFramebufferTextureLayer: _emscripten_glFramebufferTextureLayer,
 /** @export */ emscripten_glFrontFace: _emscripten_glFrontFace,
 /** @export */ emscripten_glGenBuffers: _emscripten_glGenBuffers,
 /** @export */ emscripten_glGenFramebuffers: _emscripten_glGenFramebuffers,
 /** @export */ emscripten_glGenQueries: _emscripten_glGenQueries,
 /** @export */ emscripten_glGenQueriesEXT: _emscripten_glGenQueriesEXT,
 /** @export */ emscripten_glGenRenderbuffers: _emscripten_glGenRenderbuffers,
 /** @export */ emscripten_glGenSamplers: _emscripten_glGenSamplers,
 /** @export */ emscripten_glGenTextures: _emscripten_glGenTextures,
 /** @export */ emscripten_glGenTransformFeedbacks: _emscripten_glGenTransformFeedbacks,
 /** @export */ emscripten_glGenVertexArrays: _emscripten_glGenVertexArrays,
 /** @export */ emscripten_glGenVertexArraysOES: _emscripten_glGenVertexArraysOES,
 /** @export */ emscripten_glGenerateMipmap: _emscripten_glGenerateMipmap,
 /** @export */ emscripten_glGetActiveAttrib: _emscripten_glGetActiveAttrib,
 /** @export */ emscripten_glGetActiveUniform: _emscripten_glGetActiveUniform,
 /** @export */ emscripten_glGetActiveUniformBlockName: _emscripten_glGetActiveUniformBlockName,
 /** @export */ emscripten_glGetActiveUniformBlockiv: _emscripten_glGetActiveUniformBlockiv,
 /** @export */ emscripten_glGetActiveUniformsiv: _emscripten_glGetActiveUniformsiv,
 /** @export */ emscripten_glGetAttachedShaders: _emscripten_glGetAttachedShaders,
 /** @export */ emscripten_glGetAttribLocation: _emscripten_glGetAttribLocation,
 /** @export */ emscripten_glGetBooleanv: _emscripten_glGetBooleanv,
 /** @export */ emscripten_glGetBufferParameteri64v: _emscripten_glGetBufferParameteri64v,
 /** @export */ emscripten_glGetBufferParameteriv: _emscripten_glGetBufferParameteriv,
 /** @export */ emscripten_glGetBufferPointerv: _emscripten_glGetBufferPointerv,
 /** @export */ emscripten_glGetError: _emscripten_glGetError,
 /** @export */ emscripten_glGetFloatv: _emscripten_glGetFloatv,
 /** @export */ emscripten_glGetFragDataLocation: _emscripten_glGetFragDataLocation,
 /** @export */ emscripten_glGetFramebufferAttachmentParameteriv: _emscripten_glGetFramebufferAttachmentParameteriv,
 /** @export */ emscripten_glGetInteger64i_v: _emscripten_glGetInteger64i_v,
 /** @export */ emscripten_glGetInteger64v: _emscripten_glGetInteger64v,
 /** @export */ emscripten_glGetIntegeri_v: _emscripten_glGetIntegeri_v,
 /** @export */ emscripten_glGetIntegerv: _emscripten_glGetIntegerv,
 /** @export */ emscripten_glGetInternalformativ: _emscripten_glGetInternalformativ,
 /** @export */ emscripten_glGetProgramBinary: _emscripten_glGetProgramBinary,
 /** @export */ emscripten_glGetProgramInfoLog: _emscripten_glGetProgramInfoLog,
 /** @export */ emscripten_glGetProgramiv: _emscripten_glGetProgramiv,
 /** @export */ emscripten_glGetQueryObjecti64vEXT: _emscripten_glGetQueryObjecti64vEXT,
 /** @export */ emscripten_glGetQueryObjectivEXT: _emscripten_glGetQueryObjectivEXT,
 /** @export */ emscripten_glGetQueryObjectui64vEXT: _emscripten_glGetQueryObjectui64vEXT,
 /** @export */ emscripten_glGetQueryObjectuiv: _emscripten_glGetQueryObjectuiv,
 /** @export */ emscripten_glGetQueryObjectuivEXT: _emscripten_glGetQueryObjectuivEXT,
 /** @export */ emscripten_glGetQueryiv: _emscripten_glGetQueryiv,
 /** @export */ emscripten_glGetQueryivEXT: _emscripten_glGetQueryivEXT,
 /** @export */ emscripten_glGetRenderbufferParameteriv: _emscripten_glGetRenderbufferParameteriv,
 /** @export */ emscripten_glGetSamplerParameterfv: _emscripten_glGetSamplerParameterfv,
 /** @export */ emscripten_glGetSamplerParameteriv: _emscripten_glGetSamplerParameteriv,
 /** @export */ emscripten_glGetShaderInfoLog: _emscripten_glGetShaderInfoLog,
 /** @export */ emscripten_glGetShaderPrecisionFormat: _emscripten_glGetShaderPrecisionFormat,
 /** @export */ emscripten_glGetShaderSource: _emscripten_glGetShaderSource,
 /** @export */ emscripten_glGetShaderiv: _emscripten_glGetShaderiv,
 /** @export */ emscripten_glGetString: _emscripten_glGetString,
 /** @export */ emscripten_glGetStringi: _emscripten_glGetStringi,
 /** @export */ emscripten_glGetSynciv: _emscripten_glGetSynciv,
 /** @export */ emscripten_glGetTexParameterfv: _emscripten_glGetTexParameterfv,
 /** @export */ emscripten_glGetTexParameteriv: _emscripten_glGetTexParameteriv,
 /** @export */ emscripten_glGetTransformFeedbackVarying: _emscripten_glGetTransformFeedbackVarying,
 /** @export */ emscripten_glGetUniformBlockIndex: _emscripten_glGetUniformBlockIndex,
 /** @export */ emscripten_glGetUniformIndices: _emscripten_glGetUniformIndices,
 /** @export */ emscripten_glGetUniformLocation: _emscripten_glGetUniformLocation,
 /** @export */ emscripten_glGetUniformfv: _emscripten_glGetUniformfv,
 /** @export */ emscripten_glGetUniformiv: _emscripten_glGetUniformiv,
 /** @export */ emscripten_glGetUniformuiv: _emscripten_glGetUniformuiv,
 /** @export */ emscripten_glGetVertexAttribIiv: _emscripten_glGetVertexAttribIiv,
 /** @export */ emscripten_glGetVertexAttribIuiv: _emscripten_glGetVertexAttribIuiv,
 /** @export */ emscripten_glGetVertexAttribPointerv: _emscripten_glGetVertexAttribPointerv,
 /** @export */ emscripten_glGetVertexAttribfv: _emscripten_glGetVertexAttribfv,
 /** @export */ emscripten_glGetVertexAttribiv: _emscripten_glGetVertexAttribiv,
 /** @export */ emscripten_glHint: _emscripten_glHint,
 /** @export */ emscripten_glInvalidateFramebuffer: _emscripten_glInvalidateFramebuffer,
 /** @export */ emscripten_glInvalidateSubFramebuffer: _emscripten_glInvalidateSubFramebuffer,
 /** @export */ emscripten_glIsBuffer: _emscripten_glIsBuffer,
 /** @export */ emscripten_glIsEnabled: _emscripten_glIsEnabled,
 /** @export */ emscripten_glIsFramebuffer: _emscripten_glIsFramebuffer,
 /** @export */ emscripten_glIsProgram: _emscripten_glIsProgram,
 /** @export */ emscripten_glIsQuery: _emscripten_glIsQuery,
 /** @export */ emscripten_glIsQueryEXT: _emscripten_glIsQueryEXT,
 /** @export */ emscripten_glIsRenderbuffer: _emscripten_glIsRenderbuffer,
 /** @export */ emscripten_glIsSampler: _emscripten_glIsSampler,
 /** @export */ emscripten_glIsShader: _emscripten_glIsShader,
 /** @export */ emscripten_glIsSync: _emscripten_glIsSync,
 /** @export */ emscripten_glIsTexture: _emscripten_glIsTexture,
 /** @export */ emscripten_glIsTransformFeedback: _emscripten_glIsTransformFeedback,
 /** @export */ emscripten_glIsVertexArray: _emscripten_glIsVertexArray,
 /** @export */ emscripten_glIsVertexArrayOES: _emscripten_glIsVertexArrayOES,
 /** @export */ emscripten_glLineWidth: _emscripten_glLineWidth,
 /** @export */ emscripten_glLinkProgram: _emscripten_glLinkProgram,
 /** @export */ emscripten_glMapBufferRange: _emscripten_glMapBufferRange,
 /** @export */ emscripten_glPauseTransformFeedback: _emscripten_glPauseTransformFeedback,
 /** @export */ emscripten_glPixelStorei: _emscripten_glPixelStorei,
 /** @export */ emscripten_glPolygonOffset: _emscripten_glPolygonOffset,
 /** @export */ emscripten_glProgramBinary: _emscripten_glProgramBinary,
 /** @export */ emscripten_glProgramParameteri: _emscripten_glProgramParameteri,
 /** @export */ emscripten_glQueryCounterEXT: _emscripten_glQueryCounterEXT,
 /** @export */ emscripten_glReadBuffer: _emscripten_glReadBuffer,
 /** @export */ emscripten_glReadPixels: _emscripten_glReadPixels,
 /** @export */ emscripten_glReleaseShaderCompiler: _emscripten_glReleaseShaderCompiler,
 /** @export */ emscripten_glRenderbufferStorage: _emscripten_glRenderbufferStorage,
 /** @export */ emscripten_glRenderbufferStorageMultisample: _emscripten_glRenderbufferStorageMultisample,
 /** @export */ emscripten_glResumeTransformFeedback: _emscripten_glResumeTransformFeedback,
 /** @export */ emscripten_glSampleCoverage: _emscripten_glSampleCoverage,
 /** @export */ emscripten_glSamplerParameterf: _emscripten_glSamplerParameterf,
 /** @export */ emscripten_glSamplerParameterfv: _emscripten_glSamplerParameterfv,
 /** @export */ emscripten_glSamplerParameteri: _emscripten_glSamplerParameteri,
 /** @export */ emscripten_glSamplerParameteriv: _emscripten_glSamplerParameteriv,
 /** @export */ emscripten_glScissor: _emscripten_glScissor,
 /** @export */ emscripten_glShaderBinary: _emscripten_glShaderBinary,
 /** @export */ emscripten_glShaderSource: _emscripten_glShaderSource,
 /** @export */ emscripten_glStencilFunc: _emscripten_glStencilFunc,
 /** @export */ emscripten_glStencilFuncSeparate: _emscripten_glStencilFuncSeparate,
 /** @export */ emscripten_glStencilMask: _emscripten_glStencilMask,
 /** @export */ emscripten_glStencilMaskSeparate: _emscripten_glStencilMaskSeparate,
 /** @export */ emscripten_glStencilOp: _emscripten_glStencilOp,
 /** @export */ emscripten_glStencilOpSeparate: _emscripten_glStencilOpSeparate,
 /** @export */ emscripten_glTexImage2D: _emscripten_glTexImage2D,
 /** @export */ emscripten_glTexImage3D: _emscripten_glTexImage3D,
 /** @export */ emscripten_glTexParameterf: _emscripten_glTexParameterf,
 /** @export */ emscripten_glTexParameterfv: _emscripten_glTexParameterfv,
 /** @export */ emscripten_glTexParameteri: _emscripten_glTexParameteri,
 /** @export */ emscripten_glTexParameteriv: _emscripten_glTexParameteriv,
 /** @export */ emscripten_glTexStorage2D: _emscripten_glTexStorage2D,
 /** @export */ emscripten_glTexStorage3D: _emscripten_glTexStorage3D,
 /** @export */ emscripten_glTexSubImage2D: _emscripten_glTexSubImage2D,
 /** @export */ emscripten_glTexSubImage3D: _emscripten_glTexSubImage3D,
 /** @export */ emscripten_glTransformFeedbackVaryings: _emscripten_glTransformFeedbackVaryings,
 /** @export */ emscripten_glUniform1f: _emscripten_glUniform1f,
 /** @export */ emscripten_glUniform1fv: _emscripten_glUniform1fv,
 /** @export */ emscripten_glUniform1i: _emscripten_glUniform1i,
 /** @export */ emscripten_glUniform1iv: _emscripten_glUniform1iv,
 /** @export */ emscripten_glUniform1ui: _emscripten_glUniform1ui,
 /** @export */ emscripten_glUniform1uiv: _emscripten_glUniform1uiv,
 /** @export */ emscripten_glUniform2f: _emscripten_glUniform2f,
 /** @export */ emscripten_glUniform2fv: _emscripten_glUniform2fv,
 /** @export */ emscripten_glUniform2i: _emscripten_glUniform2i,
 /** @export */ emscripten_glUniform2iv: _emscripten_glUniform2iv,
 /** @export */ emscripten_glUniform2ui: _emscripten_glUniform2ui,
 /** @export */ emscripten_glUniform2uiv: _emscripten_glUniform2uiv,
 /** @export */ emscripten_glUniform3f: _emscripten_glUniform3f,
 /** @export */ emscripten_glUniform3fv: _emscripten_glUniform3fv,
 /** @export */ emscripten_glUniform3i: _emscripten_glUniform3i,
 /** @export */ emscripten_glUniform3iv: _emscripten_glUniform3iv,
 /** @export */ emscripten_glUniform3ui: _emscripten_glUniform3ui,
 /** @export */ emscripten_glUniform3uiv: _emscripten_glUniform3uiv,
 /** @export */ emscripten_glUniform4f: _emscripten_glUniform4f,
 /** @export */ emscripten_glUniform4fv: _emscripten_glUniform4fv,
 /** @export */ emscripten_glUniform4i: _emscripten_glUniform4i,
 /** @export */ emscripten_glUniform4iv: _emscripten_glUniform4iv,
 /** @export */ emscripten_glUniform4ui: _emscripten_glUniform4ui,
 /** @export */ emscripten_glUniform4uiv: _emscripten_glUniform4uiv,
 /** @export */ emscripten_glUniformBlockBinding: _emscripten_glUniformBlockBinding,
 /** @export */ emscripten_glUniformMatrix2fv: _emscripten_glUniformMatrix2fv,
 /** @export */ emscripten_glUniformMatrix2x3fv: _emscripten_glUniformMatrix2x3fv,
 /** @export */ emscripten_glUniformMatrix2x4fv: _emscripten_glUniformMatrix2x4fv,
 /** @export */ emscripten_glUniformMatrix3fv: _emscripten_glUniformMatrix3fv,
 /** @export */ emscripten_glUniformMatrix3x2fv: _emscripten_glUniformMatrix3x2fv,
 /** @export */ emscripten_glUniformMatrix3x4fv: _emscripten_glUniformMatrix3x4fv,
 /** @export */ emscripten_glUniformMatrix4fv: _emscripten_glUniformMatrix4fv,
 /** @export */ emscripten_glUniformMatrix4x2fv: _emscripten_glUniformMatrix4x2fv,
 /** @export */ emscripten_glUniformMatrix4x3fv: _emscripten_glUniformMatrix4x3fv,
 /** @export */ emscripten_glUnmapBuffer: _emscripten_glUnmapBuffer,
 /** @export */ emscripten_glUseProgram: _emscripten_glUseProgram,
 /** @export */ emscripten_glValidateProgram: _emscripten_glValidateProgram,
 /** @export */ emscripten_glVertexAttrib1f: _emscripten_glVertexAttrib1f,
 /** @export */ emscripten_glVertexAttrib1fv: _emscripten_glVertexAttrib1fv,
 /** @export */ emscripten_glVertexAttrib2f: _emscripten_glVertexAttrib2f,
 /** @export */ emscripten_glVertexAttrib2fv: _emscripten_glVertexAttrib2fv,
 /** @export */ emscripten_glVertexAttrib3f: _emscripten_glVertexAttrib3f,
 /** @export */ emscripten_glVertexAttrib3fv: _emscripten_glVertexAttrib3fv,
 /** @export */ emscripten_glVertexAttrib4f: _emscripten_glVertexAttrib4f,
 /** @export */ emscripten_glVertexAttrib4fv: _emscripten_glVertexAttrib4fv,
 /** @export */ emscripten_glVertexAttribDivisor: _emscripten_glVertexAttribDivisor,
 /** @export */ emscripten_glVertexAttribDivisorANGLE: _emscripten_glVertexAttribDivisorANGLE,
 /** @export */ emscripten_glVertexAttribDivisorARB: _emscripten_glVertexAttribDivisorARB,
 /** @export */ emscripten_glVertexAttribDivisorEXT: _emscripten_glVertexAttribDivisorEXT,
 /** @export */ emscripten_glVertexAttribDivisorNV: _emscripten_glVertexAttribDivisorNV,
 /** @export */ emscripten_glVertexAttribI4i: _emscripten_glVertexAttribI4i,
 /** @export */ emscripten_glVertexAttribI4iv: _emscripten_glVertexAttribI4iv,
 /** @export */ emscripten_glVertexAttribI4ui: _emscripten_glVertexAttribI4ui,
 /** @export */ emscripten_glVertexAttribI4uiv: _emscripten_glVertexAttribI4uiv,
 /** @export */ emscripten_glVertexAttribIPointer: _emscripten_glVertexAttribIPointer,
 /** @export */ emscripten_glVertexAttribPointer: _emscripten_glVertexAttribPointer,
 /** @export */ emscripten_glViewport: _emscripten_glViewport,
 /** @export */ emscripten_glWaitSync: _emscripten_glWaitSync,
 /** @export */ emscripten_has_asyncify: _emscripten_has_asyncify,
 /** @export */ emscripten_request_fullscreen_strategy: _emscripten_request_fullscreen_strategy,
 /** @export */ emscripten_request_pointerlock: _emscripten_request_pointerlock,
 /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
 /** @export */ emscripten_sample_gamepad_data: _emscripten_sample_gamepad_data,
 /** @export */ emscripten_set_beforeunload_callback_on_thread: _emscripten_set_beforeunload_callback_on_thread,
 /** @export */ emscripten_set_blur_callback_on_thread: _emscripten_set_blur_callback_on_thread,
 /** @export */ emscripten_set_canvas_element_size: _emscripten_set_canvas_element_size,
 /** @export */ emscripten_set_element_css_size: _emscripten_set_element_css_size,
 /** @export */ emscripten_set_focus_callback_on_thread: _emscripten_set_focus_callback_on_thread,
 /** @export */ emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
 /** @export */ emscripten_set_gamepadconnected_callback_on_thread: _emscripten_set_gamepadconnected_callback_on_thread,
 /** @export */ emscripten_set_gamepaddisconnected_callback_on_thread: _emscripten_set_gamepaddisconnected_callback_on_thread,
 /** @export */ emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
 /** @export */ emscripten_set_keypress_callback_on_thread: _emscripten_set_keypress_callback_on_thread,
 /** @export */ emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
 /** @export */ emscripten_set_main_loop_timing: _emscripten_set_main_loop_timing,
 /** @export */ emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
 /** @export */ emscripten_set_mouseenter_callback_on_thread: _emscripten_set_mouseenter_callback_on_thread,
 /** @export */ emscripten_set_mouseleave_callback_on_thread: _emscripten_set_mouseleave_callback_on_thread,
 /** @export */ emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
 /** @export */ emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
 /** @export */ emscripten_set_pointerlockchange_callback_on_thread: _emscripten_set_pointerlockchange_callback_on_thread,
 /** @export */ emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
 /** @export */ emscripten_set_touchcancel_callback_on_thread: _emscripten_set_touchcancel_callback_on_thread,
 /** @export */ emscripten_set_touchend_callback_on_thread: _emscripten_set_touchend_callback_on_thread,
 /** @export */ emscripten_set_touchmove_callback_on_thread: _emscripten_set_touchmove_callback_on_thread,
 /** @export */ emscripten_set_touchstart_callback_on_thread: _emscripten_set_touchstart_callback_on_thread,
 /** @export */ emscripten_set_visibilitychange_callback_on_thread: _emscripten_set_visibilitychange_callback_on_thread,
 /** @export */ emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
 /** @export */ emscripten_set_window_title: _emscripten_set_window_title,
 /** @export */ emscripten_sleep: _emscripten_sleep,
 /** @export */ emscripten_webgl_create_context: _emscripten_webgl_create_context,
 /** @export */ emscripten_webgl_destroy_context: _emscripten_webgl_destroy_context,
 /** @export */ emscripten_webgl_init_context_attributes: _emscripten_webgl_init_context_attributes,
 /** @export */ emscripten_webgl_make_context_current: _emscripten_webgl_make_context_current,
 /** @export */ environ_get: _environ_get,
 /** @export */ environ_sizes_get: _environ_sizes_get,
 /** @export */ exit: _exit,
 /** @export */ fd_close: _fd_close,
 /** @export */ fd_read: _fd_read,
 /** @export */ fd_seek: _fd_seek,
 /** @export */ fd_write: _fd_write,
 /** @export */ memory: wasmMemory
};

var wasmExports = createWasm();

var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["__wasm_call_ctors"])();

var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["__main_argc_argv"])(a0, a1);

var _free = a0 => (_free = wasmExports["free"])(a0);

var _malloc = a0 => (_malloc = wasmExports["malloc"])(a0);

var ___errno_location = () => (___errno_location = wasmExports["__errno_location"])();

var _pthread_self = Module["_pthread_self"] = () => (_pthread_self = Module["_pthread_self"] = wasmExports["pthread_self"])();

var __emscripten_tls_init = Module["__emscripten_tls_init"] = () => (__emscripten_tls_init = Module["__emscripten_tls_init"] = wasmExports["_emscripten_tls_init"])();

var __emscripten_thread_init = Module["__emscripten_thread_init"] = (a0, a1, a2, a3, a4, a5) => (__emscripten_thread_init = Module["__emscripten_thread_init"] = wasmExports["_emscripten_thread_init"])(a0, a1, a2, a3, a4, a5);

var __emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = () => (__emscripten_thread_crashed = Module["__emscripten_thread_crashed"] = wasmExports["_emscripten_thread_crashed"])();

var _emscripten_main_thread_process_queued_calls = () => (_emscripten_main_thread_process_queued_calls = wasmExports["emscripten_main_thread_process_queued_calls"])();

var _emscripten_main_runtime_thread_id = () => (_emscripten_main_runtime_thread_id = wasmExports["emscripten_main_runtime_thread_id"])();

var __emscripten_run_on_main_thread_js = (a0, a1, a2, a3) => (__emscripten_run_on_main_thread_js = wasmExports["_emscripten_run_on_main_thread_js"])(a0, a1, a2, a3);

var _emscripten_dispatch_to_thread_ = (a0, a1, a2, a3, a4) => (_emscripten_dispatch_to_thread_ = wasmExports["emscripten_dispatch_to_thread_"])(a0, a1, a2, a3, a4);

var __emscripten_thread_free_data = a0 => (__emscripten_thread_free_data = wasmExports["_emscripten_thread_free_data"])(a0);

var __emscripten_thread_exit = Module["__emscripten_thread_exit"] = a0 => (__emscripten_thread_exit = Module["__emscripten_thread_exit"] = wasmExports["_emscripten_thread_exit"])(a0);

var __emscripten_check_mailbox = Module["__emscripten_check_mailbox"] = () => (__emscripten_check_mailbox = Module["__emscripten_check_mailbox"] = wasmExports["_emscripten_check_mailbox"])();

var _emscripten_stack_set_limits = (a0, a1) => (_emscripten_stack_set_limits = wasmExports["emscripten_stack_set_limits"])(a0, a1);

var stackSave = () => (stackSave = wasmExports["stackSave"])();

var stackRestore = a0 => (stackRestore = wasmExports["stackRestore"])(a0);

var stackAlloc = a0 => (stackAlloc = wasmExports["stackAlloc"])(a0);

var dynCall_ii = Module["dynCall_ii"] = (a0, a1) => (dynCall_ii = Module["dynCall_ii"] = wasmExports["dynCall_ii"])(a0, a1);

var dynCall_iii = Module["dynCall_iii"] = (a0, a1, a2) => (dynCall_iii = Module["dynCall_iii"] = wasmExports["dynCall_iii"])(a0, a1, a2);

var dynCall_viiii = Module["dynCall_viiii"] = (a0, a1, a2, a3, a4) => (dynCall_viiii = Module["dynCall_viiii"] = wasmExports["dynCall_viiii"])(a0, a1, a2, a3, a4);

var dynCall_v = Module["dynCall_v"] = a0 => (dynCall_v = Module["dynCall_v"] = wasmExports["dynCall_v"])(a0);

var dynCall_vi = Module["dynCall_vi"] = (a0, a1) => (dynCall_vi = Module["dynCall_vi"] = wasmExports["dynCall_vi"])(a0, a1);

var dynCall_iiii = Module["dynCall_iiii"] = (a0, a1, a2, a3) => (dynCall_iiii = Module["dynCall_iiii"] = wasmExports["dynCall_iiii"])(a0, a1, a2, a3);

var dynCall_viii = Module["dynCall_viii"] = (a0, a1, a2, a3) => (dynCall_viii = Module["dynCall_viii"] = wasmExports["dynCall_viii"])(a0, a1, a2, a3);

var dynCall_jiij = Module["dynCall_jiij"] = (a0, a1, a2, a3, a4) => (dynCall_jiij = Module["dynCall_jiij"] = wasmExports["dynCall_jiij"])(a0, a1, a2, a3, a4);

var dynCall_jiji = Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["dynCall_jiji"])(a0, a1, a2, a3, a4);

var dynCall_ji = Module["dynCall_ji"] = (a0, a1) => (dynCall_ji = Module["dynCall_ji"] = wasmExports["dynCall_ji"])(a0, a1);

var dynCall_vii = Module["dynCall_vii"] = (a0, a1, a2) => (dynCall_vii = Module["dynCall_vii"] = wasmExports["dynCall_vii"])(a0, a1, a2);

var dynCall_iiiiii = Module["dynCall_iiiiii"] = (a0, a1, a2, a3, a4, a5) => (dynCall_iiiiii = Module["dynCall_iiiiii"] = wasmExports["dynCall_iiiiii"])(a0, a1, a2, a3, a4, a5);

var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7) => (dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = wasmExports["dynCall_iiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7);

var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => (dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = wasmExports["dynCall_iiiiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);

var dynCall_iiiii = Module["dynCall_iiiii"] = (a0, a1, a2, a3, a4) => (dynCall_iiiii = Module["dynCall_iiiii"] = wasmExports["dynCall_iiiii"])(a0, a1, a2, a3, a4);

var dynCall_iiiiiiiiiiiiiiff = Module["dynCall_iiiiiiiiiiiiiiff"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) => (dynCall_iiiiiiiiiiiiiiff = Module["dynCall_iiiiiiiiiiiiiiff"] = wasmExports["dynCall_iiiiiiiiiiiiiiff"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);

var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) => (dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = wasmExports["dynCall_iiiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8);

var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7) => (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = wasmExports["dynCall_viiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7);

var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) => (dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = wasmExports["dynCall_viiiiiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);

var dynCall_iiiiiidiiff = Module["dynCall_iiiiiidiiff"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) => (dynCall_iiiiiidiiff = Module["dynCall_iiiiiidiiff"] = wasmExports["dynCall_iiiiiidiiff"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);

var dynCall_viiiii = Module["dynCall_viiiii"] = (a0, a1, a2, a3, a4, a5) => (dynCall_viiiii = Module["dynCall_viiiii"] = wasmExports["dynCall_viiiii"])(a0, a1, a2, a3, a4, a5);

var dynCall_i = Module["dynCall_i"] = a0 => (dynCall_i = Module["dynCall_i"] = wasmExports["dynCall_i"])(a0);

var dynCall_vffff = Module["dynCall_vffff"] = (a0, a1, a2, a3, a4) => (dynCall_vffff = Module["dynCall_vffff"] = wasmExports["dynCall_vffff"])(a0, a1, a2, a3, a4);

var dynCall_vf = Module["dynCall_vf"] = (a0, a1) => (dynCall_vf = Module["dynCall_vf"] = wasmExports["dynCall_vf"])(a0, a1);

var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) => (dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = wasmExports["dynCall_viiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8);

var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) => (dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = wasmExports["dynCall_viiiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);

var dynCall_vff = Module["dynCall_vff"] = (a0, a1, a2) => (dynCall_vff = Module["dynCall_vff"] = wasmExports["dynCall_vff"])(a0, a1, a2);

var dynCall_vfi = Module["dynCall_vfi"] = (a0, a1, a2) => (dynCall_vfi = Module["dynCall_vfi"] = wasmExports["dynCall_vfi"])(a0, a1, a2);

var dynCall_viif = Module["dynCall_viif"] = (a0, a1, a2, a3) => (dynCall_viif = Module["dynCall_viif"] = wasmExports["dynCall_viif"])(a0, a1, a2, a3);

var dynCall_vif = Module["dynCall_vif"] = (a0, a1, a2) => (dynCall_vif = Module["dynCall_vif"] = wasmExports["dynCall_vif"])(a0, a1, a2);

var dynCall_viff = Module["dynCall_viff"] = (a0, a1, a2, a3) => (dynCall_viff = Module["dynCall_viff"] = wasmExports["dynCall_viff"])(a0, a1, a2, a3);

var dynCall_vifff = Module["dynCall_vifff"] = (a0, a1, a2, a3, a4) => (dynCall_vifff = Module["dynCall_vifff"] = wasmExports["dynCall_vifff"])(a0, a1, a2, a3, a4);

var dynCall_viffff = Module["dynCall_viffff"] = (a0, a1, a2, a3, a4, a5) => (dynCall_viffff = Module["dynCall_viffff"] = wasmExports["dynCall_viffff"])(a0, a1, a2, a3, a4, a5);

var dynCall_viiiiii = Module["dynCall_viiiiii"] = (a0, a1, a2, a3, a4, a5, a6) => (dynCall_viiiiii = Module["dynCall_viiiiii"] = wasmExports["dynCall_viiiiii"])(a0, a1, a2, a3, a4, a5, a6);

var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) => (dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = wasmExports["dynCall_viiiiiiiiii"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);

var dynCall_viifi = Module["dynCall_viifi"] = (a0, a1, a2, a3, a4) => (dynCall_viifi = Module["dynCall_viifi"] = wasmExports["dynCall_viifi"])(a0, a1, a2, a3, a4);

var dynCall_iidiiii = Module["dynCall_iidiiii"] = (a0, a1, a2, a3, a4, a5, a6) => (dynCall_iidiiii = Module["dynCall_iidiiii"] = wasmExports["dynCall_iidiiii"])(a0, a1, a2, a3, a4, a5, a6);

var _asyncify_start_unwind = a0 => (_asyncify_start_unwind = wasmExports["asyncify_start_unwind"])(a0);

var _asyncify_stop_unwind = () => (_asyncify_stop_unwind = wasmExports["asyncify_stop_unwind"])();

var _asyncify_start_rewind = a0 => (_asyncify_start_rewind = wasmExports["asyncify_start_rewind"])(a0);

var _asyncify_stop_rewind = () => (_asyncify_stop_rewind = wasmExports["asyncify_stop_rewind"])();

Module["keepRuntimeAlive"] = keepRuntimeAlive;

Module["wasmMemory"] = wasmMemory;

Module["ExitStatus"] = ExitStatus;

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain(args = []) {
 var entryFunction = _main;
 args.unshift(thisProgram);
 var argc = args.length;
 var argv = stackAlloc((argc + 1) * 4);
 var argv_ptr = argv;
 args.forEach(arg => {
  GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = stringToUTF8OnStack(arg);
  argv_ptr += 4;
 });
 GROWABLE_HEAP_U32()[((argv_ptr) >> 2)] = 0;
 try {
  var ret = entryFunction(argc, argv);
  exitJS(ret, /* implicit = */ true);
  return ret;
 } catch (e) {
  return handleException(e);
 }
}

function run(args = arguments_) {
 if (runDependencies > 0) {
  return;
 }
 if (ENVIRONMENT_IS_PTHREAD) {
  initRuntime();
  startWorker(Module);
  return;
 }
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (shouldRunNow) callMain(args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();
