// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import {dotnet} from './_framework/dotnet.js'

const {setModuleImports, getAssemblyExports, getConfig} = await dotnet
    .withDiagnosticTracing(false)
    .withApplicationArgumentsFromQuery()
    .create();

setModuleImports('main.js', {
    window: {
        location: {
            href: () => globalThis.window.location.href
        }
    }
});

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);
let createSVG = () => {
    alert("viz not loaded");
};
window["vizInstance"] = null;
document.getElementById("renderButton").onclick = () => {
    const text = exports.WebRegExCompiler.RegExToNfa(document.getElementById("RegExInput").value);
    document.getElementById('out').innerHTML = text;
    createSVG();
};

Viz.instance().then(viz => {
    console.log("Viz loaded");
    window["vizInstance"] = viz;
    createSVG = () => {
        document.getElementById("viewer").innerHTML = "";
        let src = document.getElementById("out").innerText;
        if (document.getElementById("TB").checked) {
            src = src.replace("rankdir=LR;", "rankdir=TB;")
        }
        const svg = viz.renderSVGElement(src);
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        document.getElementById("viewer").appendChild(svg);
    }
});

await dotnet.run();