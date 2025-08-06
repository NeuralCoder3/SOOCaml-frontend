importScripts("toplevel.js")

onmessage = function (e) {
    const type = e.data.type;
    if (type == "code") {
        const code = e.data.data;
        console.log("execute " + code);
        try {
            const res = execute(code);
            // console.log("result ",res);
            postMessage({
                type: "result",
                data: res,
                time: e.data.time
            });
        } catch (e) {
            this.postMessage({
                type: "error",
                data: e.toString()
            });
        }
    } else if (type == "reset") {
        console.log("reset");
        resetInterpreter();
        this.postMessage({
            type: "reset"
        });
    } else if (type == "getState") {
        const state = getState();
        console.log("getState", state);
        this.postMessage({
            type: "getState",
            data: state
        });
    } else if (type == "setState") {
        const state = e.data.data;
        console.log("setState", state);
        setState(state);
        this.postMessage({
            type: "setState",
        });
    } else {
        console.log("unknown message type " + type);
    }
}
