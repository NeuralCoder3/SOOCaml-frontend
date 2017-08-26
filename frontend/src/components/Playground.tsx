import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button, Modal , Glyphicon } from 'react-bootstrap';
import './Playground.css';
import {API as WebserverAPI} from '../API';
const ClipboardButton: any = require('react-clipboard.js');
var SplitterLayout = require('react-splitter-layout').default; // MEGA-HAX because of typescript
SplitterLayout.prototype.componentDidUpdate = function(prevProps: any, prevState: any) {
    if (this.props.onUpdate && this.state.secondaryPaneSize !== prevState.secondaryPaneSize) {
        this.props.onUpdate(this.state.secondaryPaneSize);
    }
};

interface State {
    output: string;
    code: string;
    sizeAnchor: any;
    useServer: boolean;
    shareLink: string;
}

interface Props {
    readOnly: boolean;
    onCodeChange?: (x: string) => void;
    initialCode: string;
    fileControls: any;
}

const SHARE_LINK_ERROR = ':ERROR';
const OUTPUT_HIGHLIGHT_WORDS = ['val', 'con', 'exn'];

class Playground extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            output: '', code: '', sizeAnchor: 0, useServer: false,
            shareLink: ''
        };

        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
        this.handleOutputChange = this.handleOutputChange.bind(this);
        this.handleSwitchMode = this.handleSwitchMode.bind(this);
        this.handleShare = this.handleShare.bind(this);
        this.closeShareModal = this.closeShareModal.bind(this);
    }

    render() {
        let lines: string[] = this.state.output.split('\n');
        var key = 0;
        let lineItems = lines.map((line) => {
            let start = 0;
            let items: any[] = [];
            while (true) {
                let indexList = OUTPUT_HIGHLIGHT_WORDS.map((x: string) => {
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
                    let len = OUTPUT_HIGHLIGHT_WORDS[ii].length;
                    let before = line.substring(start, index);
                    if (before.length > 0) {
                        items.push(before);
                    }
                    start = index + len;
                    items.push(<b key={start}>{OUTPUT_HIGHLIGHT_WORDS[ii]}</b>);
                } else {
                    let after = line.substring(start);
                    if (after.length > 0) {
                        items.push(after);
                    }
                    break;
                }
            }
            return <div key={line + (key++)}>{items}</div>;
        });
        let code: string = this.props.initialCode;
        let evaluateIn: string = (this.state.useServer) ? 'Ausführen auf dem Server' : 'Ausführen im Browser';
        let executeOnServer: JSX.Element | undefined;
        if (this.state.useServer) {
            executeOnServer = (
                <div className="inlineBlock">
                    <div className="miniSpacer" />
                    <Button bsSize="small" bsStyle="primary" onClick={this.handleRun}>
                        <Glyphicon glyph={'play'} /> Ausführen
                    </Button>
                </div>
            );
        }
        let modal = (
            <Modal show={this.state.shareLink !== '' && this.state.shareLink !== SHARE_LINK_ERROR}
            onHide={this.closeShareModal}>
                <Modal.Header closeButton={true}>
                    <Modal.Title>Teilen link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <pre>
                    {this.state.shareLink}
                    <ClipboardButton className="headerButtons" data-clipboard-text={this.state.shareLink}>
                        <Glyphicon glyph={'copy'} />
                    </ClipboardButton>
                    </pre>
                    <p className="text-justify">
                        Diesen Link können Sie anderen Personen geben, die dann den
                        Code sehen können, den Sie gerade geschrieben haben. <br />
                        Der Link beinhaltet den Code der sich beim Teilen im Editor
                        befunden hat. Wenn sie Änderungen vornehmen wollen, „Teilen“
                        Sie erneuert.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.closeShareModal}>Schließen</Button>
                </Modal.Footer>
            </Modal>
        );
        let errorModal = (
            <Modal show={this.state.shareLink === SHARE_LINK_ERROR} onHide={this.closeShareModal}>
                <Modal.Header closeButton={true}>
                    <Modal.Title>Fehler beim Teilen</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Es gab einen Fehler beim erstellen eines Links zum Teilen.
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.closeShareModal}>Schließen</Button>
                </Modal.Footer>
            </Modal>
        );
        let shareElements: JSX.Element | undefined;
        if (!this.props.readOnly) {
            shareElements = (
                <div className="inlineBlock">
                    <div className="miniSpacer" />
                    <Button bsSize="small" bsStyle="primary" onClick={this.handleShare}>
                        <Glyphicon glyph={'share'} /> Teilen
                    </Button>
                </div>
            );
        }
        return (
            <div className="playground">
                <SplitterLayout onUpdate={this.handleSplitterUpdate}>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={(
                                <CodeMirrorWrapper flex={true} onChange={this.handleCodeChange} code={code}
                                readOnly={this.props.readOnly} outputCallback={this.handleOutputChange}
                                useInterpreter={!this.state.useServer} />
                            )}
                            header={(
                            <div className="headerButtons">
                                {this.props.fileControls}
                                {shareElements}
                            </div>
                        )} title="SML" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <div>{lineItems}</div>}
                        title="Ausgabe" className="flexy" updateAnchor={this.state.sizeAnchor}
                        header={ (
                            <div className="headerButtons">
                                {evaluateIn}
                                <div className="miniSpacer" />
                                <Button bsSize="small" bsStyle="primary" onClick={this.handleSwitchMode}>
                                    Umschalten
                                </Button>
                                {executeOnServer}
                            </div>
                        ) } />
                    </div>
                </SplitterLayout>
                {modal}
                {errorModal}
            </div>
        );
    }

    closeShareModal() {
        this.setState({shareLink: ''});
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleBrowserResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleBrowserResize);
    }

    handleSplitterUpdate(sizeAnchor: any) {
        this.setState({sizeAnchor});
    }

    handleLeftResize() {
        // Block is empty!
    }

    handleRightResize() {
        // Block is empty?
    }

    handleBrowserResize() {
        if (this.state.sizeAnchor === -2) {
            this.setState({sizeAnchor: -1});
        } else {
            this.setState({sizeAnchor: -2});
        }
    }

    handleRun() {
        WebserverAPI.fallbackInterpreter(this.state.code).then((val) => {
            this.setState({output: val});
        }).catch(() => {
            this.setState({output: 'Fehler: konnte keine Verbindung zum Server herstellen'});
        });
    }

    handleCodeChange(newCode: string) {
        this.setState(prevState => {
            return {code: newCode};
        });
        if (this.props.onCodeChange) {
            this.props.onCodeChange(newCode);
        }
    }

    handleOutputChange(newOutput: string) {
        this.setState(prevState => {
            let ret: any = {output: newOutput};
            return ret;
        });
    }

    handleShare() {
        WebserverAPI.shareCode(this.state.code).then((hash) => {
            this.setState(prevState => {
                return {shareLink: window.location.host + '/share/' + hash};
            });
        }).catch(() => {
            this.setState({shareLink: SHARE_LINK_ERROR});
        });
    }

    handleSwitchMode() {
        this.setState(prevState => {
            return {useServer: !prevState.useServer, output: ''};
        });
    }
}

export default Playground;
