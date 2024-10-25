import * as React from 'react';

import SplitterLayout from './SplitterLayout';
import MiniWindow from './MiniWindow';
import ShareModal from './ShareModal';
import ContractModal from './ContractModal';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button } from 'react-bootstrap';
import './Playground.css';
import { API as WebserverAPI } from '../api';
import { getColor } from '../theme';
import {
    Database, InterfaceSettings, getInterfaceSettings,
    InterpreterSettings, getInterpreterSettings
} from '../storage';
import { SHARING_ENABLED } from '../config';
import { PPMImage } from './PPMImage';


interface State {
    output: string;
    code: string;
    sizeAnchor: any;
    shareLink: string;

    reset: boolean;
    formContract: boolean;
    interfaceSettings: InterfaceSettings;
}

interface Props {
    readOnly: boolean;
    onCodeChange?: (x: string) => void;
    outputCallback?: (code: string, complete: boolean) => void;
    onResize?: () => void;
    initialCode: string;
    fileControls?: any;
    onReset?: () => void;

    interpreterSettings?: InterpreterSettings; // special interpreter settings
    beforeCode?: string; // invisible code that is executed before any user code
    afterCode?: string; // invisible code that is appended to any user code
}

const SHARE_LINK_ERROR = ':ERROR';
const SHARE_LINK_ERROR_NO_CONTRACT = ':ERROR_CONTRACT';
const OUTPUT_MARKUP_SPECIALS = ['\\*', '\\_'];

class Playground extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            reset: false, output: '', code: '', sizeAnchor: 0,
            shareLink: '', formContract: false,
            interfaceSettings: getInterfaceSettings()
        };

        this.clearCodeWindow = this.clearCodeWindow.bind(this);
        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
        this.handleOutputChange = this.handleOutputChange.bind(this);
        this.handleShare = this.handleShare.bind(this);
        this.handleShareWrapper = this.handleShareWrapper.bind(this);
        this.modalCloseCallback = this.modalCloseCallback.bind(this);
        this.modalFormContractCallback = this.modalFormContractCallback.bind(this);
        this.modalCreateContractCallback = this.modalCreateContractCallback.bind(this);
        this.handleBrowserKeyup = this.handleBrowserKeyup.bind(this);
    }

    render() {
        let extraCSS = '';
        let settings = getInterfaceSettings();

        let interpreterSettings: InterpreterSettings =
            this.props.interpreterSettings === undefined ? getInterpreterSettings()
                : this.props.interpreterSettings;

        let dt: string | undefined = settings.autoSelectTheme ? settings.darkTheme : undefined;
        if (dt === undefined) {
            extraCSS += '.eval-fail { background-color: '
                + this.state.interfaceSettings.errorColor + ' !important; }';
            extraCSS += '.eval-success { background-color: '
                + this.state.interfaceSettings.successColor1 + ' !important; }';
            extraCSS += '.eval-success-odd { background-color: '
                + this.state.interfaceSettings.successColor2 + ' !important; }';
        } else {
            extraCSS += '.eval-fail { background-color: '
                + getColor(settings.theme, dt, 'error') + ' !important; }';
            extraCSS += '.eval-success { background-color: '
                + getColor(settings.theme, dt, 'success') + ' !important; }';
            extraCSS += '.eval-success-odd { background-color: '
                + getColor(settings.theme, dt, 'success_alt') + ' !important; }';
        }


        let cleanedOutput = this.state.output;
        if (cleanedOutput.endsWith('\n')) {
            cleanedOutput = cleanedOutput.substr(0, cleanedOutput.length - 1);
        }
        let lineItems: JSX.Element[] = [];
        // console.log("cout", cleanedOutput);
        let lines: string[] = cleanedOutput.split('\n');
        var key = 0;
        var markingColor = 0;
        let image_lines = [];
        let in_image = false;
        for (const line of lines) {
            if (in_image && line !== "END_IMAGE") {
                image_lines.push(line);
                continue;
            }
            if (in_image && line === "END_IMAGE") {
                in_image = false;
                const image = <PPMImage ppm_text={image_lines.join('\n')} key={line + (key++)} />;
                lineItems.push(image);
                image_lines = [];
                continue;
            }
            if (line === "IMAGE") {
                in_image = true;
                continue;
            }
            let data: [JSX.Element, number, number] = this.parseLine(line, key++, markingColor);
            if (markingColor !== data[1] && data[2] > interpreterSettings.showUsedTimeWhenAbove
                && interpreterSettings.showUsedTimeWhenAbove > -1) {
                let excTime = (
                    <pre style={{
                        padding: 0, display: 'inline', margin: 0, borderRadius: 0,
                        fontSize: '70%', float: 'right', border: '0'
                    }}
                        className={this.getHighlightForColor(data[1])} key={key + '@time'}>
                        {' ' + data[2] + 'ms'}
                    </pre>
                );
                lineItems.push(excTime);
            }
            markingColor = data[1];
            lineItems.push(data[0]);
        }
        let code: string = this.props.initialCode;

        if (this.state.reset) {
            code = '';
            // This is a hacky solution to reset the editor, needs to be done properly
            this.setState({ reset: false });
        }

        let modal: JSX.Element | undefined;
        if (this.state.shareLink !== '') {
            if (this.state.formContract) {
                modal = (
                    <ContractModal closeCallback={this.modalCloseCallback}
                        createCallback={this.modalCreateContractCallback} />
                );
            } else {
                modal = (
                    <ShareModal error={this.state.shareLink === SHARE_LINK_ERROR
                        || this.state.shareLink === SHARE_LINK_ERROR_NO_CONTRACT}
                        link={this.state.shareLink} closeCallback={this.modalCloseCallback}
                        enocontract={this.state.shareLink === SHARE_LINK_ERROR_NO_CONTRACT}
                        formContractCallback={this.modalFormContractCallback} />
                );
            }
        }
        let spacer: JSX.Element | undefined = (
            <div className="miniSpacer" />
        );
        let shareElements: JSX.Element | undefined;
        if (!this.props.readOnly && SHARING_ENABLED) {
            shareElements = (
                <Button size="sm" className="btn btn-pri-alt" onClick={this.handleShareWrapper}>
                    <div className="glyphicon glyphicon-link" /> Share
                </Button>
            );
        }
        let resetBtn: JSX.Element | undefined;
        if (this.props.onReset !== undefined) {
            resetBtn = (
                <Button size="sm" className="button btn-dng-alt"
                    onClick={this.clearCodeWindow}>
                    <span className="glyphicon glyphicon-repeat" /> Reset
                </Button>
            );
        }


        let style: any = {};
        style.marginRight = '-3px';
        style.marginTop = '-.5px';
        let inputHeadBar: JSX.Element = (
            <div className="inlineBlock" style={style}>
                {resetBtn}
                {this.props.onReset !== undefined
                    && this.props.fileControls !== undefined ? spacer : ''}
                {this.props.fileControls}
                {spacer}
                {shareElements}
            </div>
        );


        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        let height = (window.innerHeight > 0) ? window.innerHeight : window.screen.height;

        let codemirror = (
            <div className="flexcomponent flexy">
                <MiniWindow content={(
                    <CodeMirrorWrapper flex={true}
                        onChange={this.handleCodeChange} code={code}
                        readOnly={this.props.readOnly} outputCallback={this.handleOutputChange}
                        interpreterSettings={this.props.interpreterSettings}
                        beforeCode={this.props.beforeCode}
                        afterCode={this.props.afterCode}
                        timeout={this.state.interfaceSettings.timeout} />
                )} header={(
                    <div className="headerButtons">
                        {inputHeadBar}
                    </div>
                )} title="OCaml" className="flexy" updateAnchor={this.state.sizeAnchor} />
            </div>
        );
        let output = (
            <div className="flexcomponent flexy">
                <MiniWindow content={
                    <div id="OutputItems">
                        {lineItems}
                    </div>
                } title="Output" className="flexy" updateAnchor={this.state.sizeAnchor} />
            </div>
        );

        let isVertical = width < height && getInterfaceSettings().useMobile;
        return (
            <div className="playground">
                <style>{extraCSS}</style>
                <SplitterLayout vertical={isVertical}
                    onUpdate={this.handleSplitterUpdate} primaryIndex={0}
                    percentage={true}>
                    {codemirror}
                    {output}
                </SplitterLayout>
                {modal}
            </div>
        );
    }

    modalCloseCallback() {
        this.setState({
            shareLink: '',
            formContract: false
        });
    }

    modalFormContractCallback() {
        this.setState({
            formContract: true
        });
    }

    modalCreateContractCallback() {
        this.setState({
            formContract: false,
            shareLink: ''
        });

        if (this.state.interfaceSettings.userContributesEnergy !== undefined) {
            // eslint-disable-next-line
            this.state.interfaceSettings.userContributesEnergy = true;
            localStorage.setItem('interfaceSettings',
                JSON.stringify(this.state.interfaceSettings));
        }
        this.handleShare(true);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleBrowserResize, { passive: true });
        window.addEventListener('keyup', this.handleBrowserKeyup, { passive: true });

        let settings: InterfaceSettings = getInterfaceSettings();
        this.setState({ 'interfaceSettings': settings });

        if (settings.fullscreen) {
            this.getBodyClassList().add('fullscreen');
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleBrowserResize);
        window.removeEventListener('keyup', this.handleBrowserKeyup);
        this.getBodyClassList().remove('fullscreen');
    }

    handleSplitterUpdate(sizeAnchor: any) {
        this.setState({ sizeAnchor });
    }

    handleLeftResize() {
        // Block is empty!
    }

    handleRightResize() {
        // Block is empty?
    }

    handleBrowserResize() {
        if (this.state.sizeAnchor === -2) {
            this.setState({ sizeAnchor: -1 });
        } else {
            this.setState({ sizeAnchor: -2 });
        }
        if (this.props.onResize) {
            this.props.onResize();
        }
    }

    handleBrowserKeyup(evt: KeyboardEvent) {
        let newval: boolean = false;
        if (evt.key === 'Escape') {
            this.getBodyClassList().remove('fullscreen');
            newval = false;
        } else if (evt.key === 'F11') {
            // Toggle the fullscreen mode
            if (this.getBodyClassList().contains('fullscreen')) {
                this.getBodyClassList().remove('fullscreen');
                newval = false;
            } else {
                this.getBodyClassList().add('fullscreen');
                newval = true;
            }
        }

        if (this.state.interfaceSettings.fullscreen !== undefined) {
            // eslint-disable-next-line
            this.state.interfaceSettings.fullscreen = newval;
            localStorage.setItem('interfaceSettings',
                JSON.stringify(this.state.interfaceSettings));
        }
    }

    handleCodeChange(newCode: string) {
        this.setState(prevState => {
            return { code: newCode };
        });
        if (this.props.onCodeChange) {
            this.props.onCodeChange(newCode);
        }
    }

    handleOutputChange(newOutput: string, complete: boolean) {
        if (!complete) {
            this.setState(prevState => {
                let ret: any = { output: newOutput };
                return ret;
            });
        }
        if (this.props.outputCallback !== undefined) {
            this.props.outputCallback(newOutput, complete);
        }
        // hack to scroll output to bottom
        setTimeout(() => {
            console.log('scrolling');
            // @ts-ignore
            document.getElementById("OutputItems").parentElement.scrollTo(0,1000000);
        }, 500);
    }

    handleShareWrapper() {
        this.handleShare(false);
    }

    handleShare(forceAllow: boolean = false) {
        if (this.state.interfaceSettings.userContributesEnergy || forceAllow) {
            // We have the user's soul, so we can get "energy"
            WebserverAPI.shareCode(this.state.code).then((hash) => {
                this.setState(prevState => {
                    return { shareLink: window.location.host + '/soocaml/share/' + hash };
                });

                // Store the share file locally
                Database.getInstance().then((db: Database) => {
                    return db.saveShare(hash, this.state.code, true);
                });
            }).catch(() => {
                this.setState({ shareLink: SHARE_LINK_ERROR });
            });
        } else {
            this.setState({ shareLink: SHARE_LINK_ERROR_NO_CONTRACT });
        }
    }

    private clearCodeWindow() {
        this.setState({ reset: true });
        this.render();
        if (this.props.onReset !== undefined) {
            this.props.onReset();
        }
    }

    private getBodyClassList() {
        let body = document.getElementsByTagName('body')[0];
        return body.classList;
    }

    private getHighlightForColor(markingColor: number): string {
        switch (markingColor) {
            case 1:
                return 'eval-success';
            case 2:
                return 'eval-success-odd';
            case 3:
                return 'eval-fail';
            default:
                break;
        }
        return '';
    }

    // parses \1, \2, \3 marks and formatting; returns [parsed line, new color, execution
    // time]
    private parseLine(line: string, key: number,
        markingColor: number): [JSX.Element, number, number] {
        let start = 0;
        let executionTime = -1;
        let items: any[] = [];

        if (line.startsWith('@')) { // time marks have the form @time@<rest of the line>
            line = line.substring(1);
            let ed = line.indexOf('@');
            if (ed >= 0 && ed < line.length) {
                executionTime = +line.substr(0, ed);
                line = line.substr(ed + 1);
            } else {
                line = '@' + line;
            }
        }
        // let special: "img" | undefined = undefined;
        if (line.startsWith('\\1')) {
            line = line.substring(2);
            markingColor = 1;
        } else if (line.startsWith('\\2')) {
            line = line.substring(2);
            markingColor = 2;
        } else if (line.startsWith('\\3')) {
            line = line.substring(2);
            markingColor = 3;
        }
        // else if (line.startsWith('\\img')) {
        //     line = line.substring(4);
        //     markingColor = 1;
        //     special = "img";
        // }

        // if (special === "img") {
        //     let ppm_text = line;
        //     console.log("PPM TEXT: " + ppm_text);
        //     return [(
        //         <img
        //             // src={items[0]}
        //             src="https://i.imgur.com/yBSDfQa.jpeg"
        //             style={{ maxWidth: '100%', maxHeight: '100%' }}
        //             key={line + (key++)} />
        //     ), markingColor, executionTime];
        // }

        // Make sure spaces in strings are non-breakable
        line = line.replaceAll(' ', ' '); // second space is nbsp

        while (true) {
            // eslint-disable-next-line
            let indexList = OUTPUT_MARKUP_SPECIALS.map((x: string) => {
                return line.indexOf(x, start);
            });
            let index = indexList[0];
            let ii = 0;
            for (let i = 0; i < indexList.length; i++) {
                if (indexList[i] !== -1 && (indexList[i] < index || index === -1)) {
                    index = indexList[i];
                    ii = i;
                }
            }
            if (index !== -1) {
                let current = OUTPUT_MARKUP_SPECIALS[ii];
                let before = line.substring(start, index);
                if (before.length > 0) {
                    items.push(before.replace(/\\\\/g, '\\'));
                }
                let next = line.indexOf(current, index + 2);
                if (next === -1) {
                    next = line.length - 1;
                }
                let content = line.substring(index + 2, next)
                    .replace(/\\\\/g, '\\');
                if (current === '\\*') {
                    items.push(<b key={start}>{content}</b>);
                } else {
                    items.push(<i key={start}>{content}</i>);
                }
                start = next + 2;
            } else {
                let after = line.substring(start);
                if (after.length > 0) {
                    items.push(after.replace(/\\\\/g, '\\'));
                }
                break;
            }
        }
        let addClass = 'pre-reset ';
        if (this.state.interfaceSettings.outputHighlight) {
            addClass += this.getHighlightForColor(markingColor);
        }
        if (items.length === 0) {
            return [(
                <pre className={addClass} key={line + (key++)}>
                    <div className="miniSpacer" />
                </pre>
            ), markingColor, executionTime];
        } else {
            return [(
                <pre className={addClass} key={line + (key++)} style={{ overflow: 'visible' }}>
                    {items}
                </pre>
            ), markingColor, executionTime];
        }

    }
}

export default Playground;
