import * as React from 'react';
import './CodeMirrorWrapper.css';
import { getInterfaceSettings, InterpreterSettings } from '../storage';

let CodeMirror: any = require('codemirror');

require('codemirror/lib/codemirror.css');
require('../ocaml.js');

/* imports for code folding */
require('codemirror/addon/fold/foldgutter.js');
require('codemirror/addon/fold/foldcode.js');
require('../sml-fold.js');
require('codemirror/addon/fold/foldgutter.css');

require('codemirror/addon/edit/matchbrackets.js');

class CodeMirrorSubset {
    cm: any;

    constructor(cm: any) {
        this.cm = cm;
    }

    getCode(pos: any): string {
        return this.cm.getRange(pos, { 'line': this.cm.lineCount() + 1, 'ch': 0 }, '\n');
    }

    getValue(): string {
        return this.cm.getValue();
    }

    markText(from: any, to: any, style: string) {
        return this.cm.markText(from, to, {
            className: style
        });
    }
}

class IncrementalInterpretationHelper {
    markers: any;
    outputCallback: (code: string, complete: boolean) => any;
    disabled: boolean;
    worker: Worker;
    codemirror: CodeMirrorSubset;
    workerTimeout: any;
    timeout: number;
    wasTerminated: boolean;
    partialOutput: string;
    interpreterSettings: string | null;
    initialExtraCode: string | undefined; // Code to be executed before any user code
    afterExtraCode: string | undefined; // Code to be executed after any user code
    lastExecutedCodeParts: string[];
    lastOutputParts: string[];

    constructor(outputCallback: (code: string, complete: boolean) => any,
        settings: string | null,
        initialCode: string | undefined = undefined,
        afterCode: string | undefined = undefined) {
        this.interpreterSettings = settings;
        this.disabled = false;
        this.outputCallback = outputCallback;
        this.initialExtraCode = initialCode;
        this.afterExtraCode = afterCode;
        this.markers = {};

        this.worker = new Worker(process.env.PUBLIC_URL + '/webworker.js');
        this.worker.onmessage = this.onWorkerMessage.bind(this);
        this.workerTimeout = null;
        this.wasTerminated = true;
        this.partialOutput = '';
        this.timeout = 5000;
        this.lastExecutedCodeParts = [];
        this.lastOutputParts = [];
    }

    setTimeout(num: number) {
        this.timeout = num;
    }

    restartWorker() {
        this.worker.terminate();
        this.worker = new Worker(process.env.PUBLIC_URL + '/webworker.js');
        this.worker.onmessage = this.onWorkerMessage.bind(this);
    }

    onWorkerMessage(e: any) {
        let message = e.data;
        if (message.type === 'getcode') {
            this.worker.postMessage({
                type: 'code',
                data: this.codemirror.getCode(message.data)
            });
        } else if (message.type === 'markText') {
            let data = message.data;
            let marker = this.codemirror.markText(data.from, data.to, data.style);
            this.markers[data.id] = marker;
        } else if (message.type === 'clearMarker') {
            let id = message.data.id;
            if (this.markers[id]) {
                this.markers[id].clear();
                delete this.markers[id];
            }
        } else if (message.type === 'partial') {
            // this.partialOutput += message.data;
            // this.partialOutput = "\\1> Hello";
            console.log("Partial output", this.partialOutput);
            this.outputCallback(this.partialOutput, false);
            this.startTimeout();
        } else if (message.type === 'ping' || message.type === 'finished') {
            // The worker is letting us know that he is not dead or finished
            this.outputCallback(this.partialOutput, true);
            this.partialOutput = '';
            if (this.workerTimeout !== null) {
                clearTimeout(this.workerTimeout);
                this.workerTimeout = null;
            }
        }
    }

    clear() {
        this.worker.postMessage({
            type: 'clear',
            data: ''
        });
    }

    disable() {
        this.disabled = true;
        this.clear();
    }

    enable() {
        this.disabled = false;
    }

    handleChangeAt(pos: any, added: string[], removed: string[], codemirror: CodeMirrorSubset) {
        if (this.disabled) {
            return;
        }
        this.codemirror = codemirror;


        let code = codemirror.getValue().trim();
        const endTag = ";;";
        // @ts-ignore
        // resetInterpreter();

        const commonPrefix = (a: Iterable, b: Iterable) => {
            let i = 0;
            while (i < a.length && i < b.length && a[i] === b[i]) {
                i++;
            }
            return i;
        };

        const code_parts = code.split(endTag).filter((x: string) => x !== '');

        const last_parts = this.lastExecutedCodeParts;
        const common_code_length = commonPrefix(last_parts, code_parts);
        // console.log("common code parts", common_code_length);
        // console.log("last code parts", last_parts.length);
        // console.log("new code parts", code_parts.length - common_code_length);
        const parts = code_parts.slice(common_code_length);
        // console.log("new code parts test", parts.length);
        console.log("(last " + last_parts.length + ") (new " + parts.length + ") (common " + common_code_length + ")");
        // ignore common code (do not re-execute it)
        this.lastExecutedCodeParts = code_parts;

        const partialOutputParts = this.lastOutputParts.slice(0, common_code_length);
        // console.log("copied partial output parts", partialOutputParts.length);
        let parity = common_code_length % 2 === 0;

        this.partialOutput = "";
        for (const part of partialOutputParts) {
            if (parity) {
                this.partialOutput += part;
            }
            this.outputCallback(this.partialOutput, false);
        }

        for (const part of parts) {
            let response = "";
            let out_response = "";
            let err_response = "";
            // @ts-ignore
            try {
                // @ts-ignore
                // response = evaluator.execute(part + endTag);
                const responses = execute(part + endTag);
                response = responses[0];
                out_response = responses[1];
                err_response = responses[2];
            } catch (e) {
                // TODO: try to catch errors from the evaluator
                // console.log("caught error", e);
                // response = "" + e;
                err_response = "" + e;
            }
            let output_part;
            if (out_response.startsWith("IMAGE") ||
                out_response.startsWith("P3 ") ||
                out_response.startsWith("P3\r") ||
                out_response.startsWith("P3\n")
            ) {
                if (out_response.startsWith("IMAGE"))
                    out_response = out_response.replace("IMAGE", "");
                output_part = "IMAGE\n" + out_response + "\nEND_IMAGE\n";
                // console.log("IMAGE output");
            } else {
                if (!response.endsWith("\n"))
                    response += "\n";
                let kind = parity ? "1" : "2";
                if (response.includes("Error") || err_response !== "")
                    kind = "3";
                if (out_response !== "")
                    out_response = "Output: \n" + out_response;
                output_part = "\\" + kind + "> " + response + out_response + err_response;
            }
            // partialOutputParts.push(output_part.trim() + "\n");
            partialOutputParts.push(output_part);
            this.partialOutput += output_part;
            this.outputCallback(this.partialOutput, false);
            parity = !parity;
        }
        this.partialOutput = partialOutputParts.join("");
        this.outputCallback(this.partialOutput, false);
        this.lastOutputParts = partialOutputParts;
        this.outputCallback(this.partialOutput, true);
        this.partialOutput = '';
        if (this.workerTimeout !== null) {
            clearTimeout(this.workerTimeout);
            this.workerTimeout = null;
        }
        return;

    }

    private startTimeout() {
        if (this.workerTimeout !== null) {
            clearTimeout(this.workerTimeout);
        }
        this.workerTimeout = setTimeout(() => {
            this.restartWorker();
            let out = '';
            let timeoutStr = 'Execution terminated due to time limit violation';
            if (this.partialOutput.trim() === '') {
                out = timeoutStr;
            } else if (this.partialOutput.endsWith('\n')) {
                out = this.partialOutput + timeoutStr;
            } else {
                out = this.partialOutput + '\n' + timeoutStr;
            }
            this.outputCallback(out, false);
            this.workerTimeout = null;
            this.clearAllMarkers();
            this.wasTerminated = true;
            this.partialOutput = '';
        }, this.timeout + 400);
    }

    private clearAllMarkers() {
        for (let key in this.markers) {
            if (this.markers.hasOwnProperty(key)) {
                this.markers[key].clear();
            }
        }
        this.markers = {};
    }
}

export interface Props {
    flex?: boolean;
    onChange?: (x: string) => void;
    onFocusChange?: (x: boolean) => void;
    code: string;
    readOnly: boolean;
    outputCallback: (code: string, complete: boolean) => any;
    timeout: number;

    interpreterSettings?: InterpreterSettings;
    beforeCode?: string;
    afterCode?: string;
}

interface State {
    isFocused: boolean;
}

function elt(tag: any, content: any, className: any): any {
    let e = document.createElement(tag);
    if (className) {
        e.className = className;
    }
    if (typeof content === 'string') {
        e.appendChild(document.createTextNode(content));
    } else if (content) {
        for (let i = 0; i < content.length; ++i) {
            e.appendChild(content[i]);
        }
    }
    return e;
}

class CodeMirrorWrapper extends React.Component<Props, State> {
    editor: any;
    codeMirrorInstance: any;
    evalHelper: IncrementalInterpretationHelper;

    constructor(props: Props) {
        super(props);

        if (this.props.interpreterSettings !== undefined) {
            this.evalHelper = new IncrementalInterpretationHelper(this.props.outputCallback,
                JSON.stringify(this.props.interpreterSettings),
                this.props.beforeCode,
                this.props.afterCode);
        } else {
            this.evalHelper = new IncrementalInterpretationHelper(this.props.outputCallback,
                localStorage.getItem('interpreterSettings'),
                this.props.beforeCode,
                this.props.afterCode);
        }

        this.handleChangeEvent = this.handleChangeEvent.bind(this);

        this.state = {
            isFocused: false
        }
    }

    focus() {
        if (this.codeMirrorInstance) {
            this.codeMirrorInstance.focus();
        }
    }

    focusChanged(focused: boolean) {
        this.setState({
            isFocused: focused,
        });
        this.props.onFocusChange && this.props.onFocusChange(focused);
    }

    render() {
        this.evalHelper.setTimeout(this.props.timeout);
        let editorClassName = 'ReactCodeMirror';
        if (this.props.flex) {
            editorClassName += ' flexy flexcomponent';
        }
        if (this.state.isFocused) {
            editorClassName += ' ReactCodeMirror--focused';
        }

        let value = '';
        if (this.props.code) {
            value = this.props.code;
        }
        return (
            <div className={editorClassName}>
                <textarea
                    ref={(editor: any) => { this.editor = editor; }}
                    defaultValue={value}
                    autoComplete="off"
                />
            </div>
        );
    }

    componentDidUpdate(prevProps: Props, prevState: any) {
        if (prevProps.readOnly !== this.props.readOnly) {
            this.codeMirrorInstance.options.readOnly = this.props.readOnly;
            this.codeMirrorInstance.refresh();
        }
        if (prevProps.code !== this.props.code) {
            if (this.editor) {
                this.codeMirrorInstance.setValue(this.props.code);
                if (this.props.onChange) {
                    this.props.onChange(this.props.code);
                }
            }
        }
    }

    componentDidMount() {
        let autoIndent = getInterfaceSettings().autoIndent;

        const options = {
            lineNumbers: true,
            mode: 'text/x-ocaml',
            indentUnit: 2,
            smartIndent: autoIndent,
            tabSize: 2,
            matchBrackets: true,
            lineWrapping: true,
            inputStyle: 'contenteditable',
            readOnly: this.props.readOnly ? true : false,
            foldGutter: {
                minFoldSize: 2
            },
            gutters: [
                'CodeMirror-linenumbers', 'CodeMirror-foldgutter'
            ],
            specialChars: new RegExp('[\u0000-\u001f\u007f-\u009f\u00a0\u00ad'
                + '\u061c\u1680\u2000-\u200f\u2028\u2029\u202f'
                + '\u205f\u3000\ufeff\ufff9-\ufffc]'),
            specialCharPlaceholder: ((ch: any) => {
                let token = elt('span', ch.charCodeAt(0).toString(16).toUpperCase(),
                    'cm-label');
                return token;
            }),
            extraKeys: {
                Enter: ((cm: any) => {
                    if (!autoIndent) {
                        cm.replaceSelection('\n');
                    } else {
                        cm.execCommand('newlineAndIndent');
                    }
                }),
                Tab: ((cm: any) => {
                    if (cm.somethingSelected()) {
                        return cm.indentSelection('add');
                    } else {
                        return CodeMirror.commands.insertSoftTab(cm);;
                    }
                }),
                'Shift-Tab': 'indentLess',
                'Alt-Tab': 'indentAuto'
            }
        };

        this.codeMirrorInstance = CodeMirror.fromTextArea(this.editor, options);
        this.codeMirrorInstance.on('change', this.handleChangeEvent);
        this.codeMirrorInstance.on('focus', this.focusChanged.bind(this, true));
        this.codeMirrorInstance.on('blur', this.focusChanged.bind(this, false));

        this.evalHelper.clear();
        this.evalHelper.handleChangeAt({ line: 0, ch: 0, sticky: null }, [''], [''],
            new CodeMirrorSubset(this.codeMirrorInstance));
    }

    componentWillUnmount() {
        this.codeMirrorInstance.off('change', this.handleChangeEvent);
        this.codeMirrorInstance.off('focus', this.focusChanged.bind(this, true));
        this.codeMirrorInstance.off('blur', this.focusChanged.bind(this, false));
    }

    /*
    This is the codemirror change handler
    */
    handleChangeEvent(codemirror: any, change: any) {
        this.evalHelper.handleChangeAt(change.from, change.text, change.removed, new CodeMirrorSubset(codemirror));

        if (this.props.onChange) {
            this.props.onChange(codemirror.getValue());
        }
    }
}

export default CodeMirrorWrapper;
