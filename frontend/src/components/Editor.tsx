import * as React from 'react';

import Playground from './Playground';
import { Form, Alert, Button } from 'react-bootstrap';
import { API } from '../api';
import { getColor } from '../theme';
import {
    getInterfaceSettings, Database, getTabId, setTabId,
    getLastCachedFile, setLastCachedFile
} from '../storage';
import './Editor.css';
import { PIPELINE_ID } from './Version';

const FEEDBACK_NONE = 0;
const FEEDBACK_SUCCESS = 1;
const FEEDBACK_FAIL = 2;

let fileInCache: string | undefined = undefined;

interface State {
    shareReadMode: boolean;
    shareHash: string;
    code: string;
    initialCode: string;
    fileName: string;
    savedFeedback: number;
    savedFeedbackTimer: any;
    error: string;
    width: number;
    requiredVersion: number;
}

class Editor extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        let height = (window.innerHeight > 0) ? window.innerHeight : window.screen.height;
        this.state = {
            shareReadMode: false,
            code: '',
            fileName: '',
            initialCode: '',
            shareHash: '',
            savedFeedback: FEEDBACK_NONE,
            savedFeedbackTimer: null,
            error: '',
            width: (height > width ? width : width / 2),
            requiredVersion: -1,
        };

        this.onResize = this.onResize.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleFileNameChange = this.handleFileNameChange.bind(this);
        this.handleRedirectToEdit = this.handleRedirectToEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    extractVersion(code: string): number {
        let versionRegex = /^\(\*.*SOSML>=(\d{1,8}).*\*\)/i;
        if (code.search(versionRegex) !== -1) {
            let res = code.match(versionRegex);
            if (res !== null && res['1'] !== null) {
                return +(res['1']);
            }
        }
        return -1;
    }

    componentDidMount() {
        if (this.props.location && this.props.location.search) {
            let parts = this.props.location.search.split(/[?|&]/);
            let dfn = decodeURI(this.props.location.search.substr(2 + parts[1].length));

            if (parts.length < 2 || isNaN(+parts[1])) {
                // Not a valid GRFSD, don't do anything
                return;
            }

            let tabId = +parts[1];
            setTabId(tabId);
            let fileName = tabId + '/' + dfn;

            Database.getInstance().then((db: Database) => {
                return db.getFile(fileName, true);
            }).then((content: string) => {
                this.setState((oldState) => {
                    return {
                        initialCode: content, fileName: dfn,
                        requiredVersion: this.extractVersion(content)
                    };
                });
            });
            return;
        }

        if (this.props.history && this.props.history.location.state) {
            let state: any = this.props.history.location.state;

            if (state.fileName) {
                let promise: Promise<String>;
                if (state.example) {
                    promise = API.getCodeExample(state.fileName);
                } else {
                    promise = Database.getInstance().then((db: Database) => {
                        return db.getFile(state.fileName);
                    });
                }
                promise.then((content: string) => {
                    this.setState((oldState) => {
                        return {
                            initialCode: content, fileName: state.fileName,
                            shareReadMode: state.shareReadMode,
                            shareHash: state.shareReadMode ? state.fileName : undefined,
                            requiredVersion: this.extractVersion(content)
                        };
                    });
                });
                return;
            } else if (state.shareHash) {
                Database.getInstance().then((db: Database) => {
                    return db.getFile(state.shareHash, false, true);
                }).then((content: string) => {
                    this.setState((oldState) => {
                        return {
                            initialCode: content, fileName: state.shareHash,
                            shareReadMode: false, requiredVersion: this.extractVersion(content)
                        };
                    });
                }).catch((error: any) => {
                    API.loadSharedCode(state.shareHash).then((content: string) => {
                        this.setState((oldState) => {
                            return {
                                initialCode: content,
                                requiredVersion: this.extractVersion(content)
                            };
                        });

                        // Cache the shared file as it does not yet exist
                        Database.getInstance().then((db: Database) => {
                            return db.saveShare(state.shareHash, content, false);
                        });
                    }).catch((error: any) => {
                        this.setState({ 'error': error });
                    });
                });
                return;
            }
        }
        if (this.props.match && this.props.match.params && this.props.match.params.hash) {
            // got redirected from a /share/:hash link

            let shareName = this.props.match.params.hash;
            Database.getInstance().then((db: Database) => {
                return db.getFile(shareName, false, true);
            }).then((content: string) => {
                this.setState((oldState) => {
                    return {
                        initialCode: content, shareReadMode: true, shareHash: shareName,
                        requiredVersion: this.extractVersion(content)
                    };
                });
            }).catch((error: any) => {
                API.loadSharedCode(shareName).then((content: string) => {
                    this.setState((oldState) => {
                        return {
                            initialCode: content, shareReadMode: true, shareHash: shareName,
                            requiredVersion: this.extractVersion(content)
                        };
                    });

                    // Cache the shared file as it does not yet exist
                    Database.getInstance().then((db: Database) => {
                        return db.saveShare(shareName, content, false);
                    });
                }).catch((error: any) => {
                    this.setState({ 'error': error });
                });
            });
            return;
        }

        let lfic = getLastCachedFile();
        if (fileInCache !== undefined || lfic !== undefined) {
            let fileName: string = '';
            let pfileName: string = '';
            if (fileInCache !== undefined) {
                fileName = fileInCache;
                pfileName = getTabId() + '/' + fileInCache;
            } else if (lfic !== undefined) {
                fileName = lfic.substr(lfic.indexOf('/') + 1);
                pfileName = lfic;
            }

            Database.getInstance().then((db: Database) => {
                return db.getFile(pfileName, true);
            }).then((content: string) => {
                this.setState((oldState) => {
                    return {
                        initialCode: content, fileName: fileName,
                        requiredVersion: this.extractVersion(content)
                    };
                });
            });
            return;
        }
    }

    render() {
        let topBar: any;
        let errorBar: any = '';
        let fileForm: any;

        if (this.state.requiredVersion > +PIPELINE_ID) {
            errorBar = (
                <Alert variant="danger" style={{ margin: '0 3px 3px' }}>
                    <b>Warning: </b>
                    The current code requires at least version {this.state.requiredVersion} of
                    SOOCaml. It may not work correctly in your version of SOOCaml
                    (version {+PIPELINE_ID}).
                    <div className="miniSpacer" />
                </Alert>
            );
        }

        if (this.state.error) {
            errorBar = (
                <Alert variant="danger" style={{ margin: '0 3px 3px' }}>
                    <b>Error: </b>
                    The specified file was not found.
                    <div className="miniSpacer" />
                    <Button className="button btn-dng-alt" onClick={(evt: any) => {
                        this.setState({ error: '' });
                    }}>Dismiss</Button>
                </Alert>
            );
        }

        if (this.state.shareReadMode) {
            topBar = (
                <Alert variant="info" style={{ margin: '0 3px 3px' }}>
                    <b>Warning: </b>
                    You are viewing a read-only file.
                    <div className="miniSpacer" />
                    <Button className="button btn-suc-alt" onClick={this.handleRedirectToEdit}>Create
                        an editable copy</Button>
                </Alert>
            );
        } else {
            let style: any = {};
            let settings = getInterfaceSettings();
            let dt: string | undefined = settings.autoSelectTheme ? settings.darkTheme : undefined;

            if (this.state.savedFeedback === FEEDBACK_SUCCESS) {
                style.backgroundColor = getColor(settings.theme, dt, 'success');
            } else if (this.state.savedFeedback === FEEDBACK_FAIL) {
                style.backgroundColor = getColor(settings.theme, dt, 'error');
            }
            style.maxWidth = this.state.width - 220;

            fileForm = (
                <Form inline={true} className="inlineBlock" onSubmit={this.handleFormSubmit}>
                    <input className="form-control" type="text"
                        value={this.state.fileName} onChange={this.handleFileNameChange}
                        style={style} placeholder="File name" />
                    <Button size="sm" className="button btn-pri-alt" onClick={this.handleSave}>
                        <span className="glyphicon glyphicon-file" /> Store
                    </Button>
                </Form>
            );
        }
        return (
            <div className="flexy flexcomponent">
                {errorBar}
                {topBar}
                <Playground readOnly={this.state.shareReadMode} onCodeChange={this.handleCodeChange}
                    onResize={this.onResize} initialCode={this.state.initialCode}
                    fileControls={fileForm} />
            </div>
        );
    }

    handleFormSubmit(e: any) {
        e.preventDefault();
        this.handleSave();
    }

    handleRedirectToEdit() {
        this.props.history.push('/editor', { shareHash: this.state.shareHash });
    }

    handleFileNameChange(evt: any) {
        let name = evt.target.value;
        this.setState(prevState => {
            return { fileName: name };
        });
    }

    restartFeedbackClear(feedback: number) {
        if (this.state.savedFeedbackTimer !== null) {
            clearTimeout(this.state.savedFeedbackTimer);
        }
        let timer = setTimeout(() => {
            this.setState({ savedFeedback: FEEDBACK_NONE, savedFeedbackTimer: null });
        }, 1300);
        this.setState({ savedFeedback: feedback, savedFeedbackTimer: timer });
    }

    handleSave() {
        let fileName = this.state.fileName.trim();
        if (fileName !== '') {
            Database.getInstance().then((db: Database) => {
                return db.saveFile(fileName, this.state.code);
            }).then(() => {
                this.restartFeedbackClear(FEEDBACK_SUCCESS);
            }).catch(() => {
                this.restartFeedbackClear(FEEDBACK_FAIL);
            });
        } else {
            this.restartFeedbackClear(FEEDBACK_FAIL);
        }
    }

    handleCodeChange(newCode: string) {
        if (this.state.shareReadMode) {
            return;
        }
        this.setState(prevState => {
            return { code: newCode, requiredVersion: this.extractVersion(newCode) };
        });

        this.props.history.replace('/editor?' + getTabId() + '&' + this.state.fileName);

        Database.getInstance().then((db: Database) => {
            return db.saveFile(getTabId() + '/' + this.state.fileName,
                this.state.code, true);
        });

        fileInCache = this.state.fileName;
        setLastCachedFile(getTabId() + '/' + fileInCache);
    }

    onResize() {
        if (this.state.shareHash === undefined) {
            this.setState(prevState => {
                return { initialCode: prevState.code };
            });
        }
        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        let height = (window.innerHeight > 0) ? window.innerHeight : window.screen.height;
        if (height <= width) {
            this.setState({ width: width / 2 });
        } else {
            this.setState({ width: width });
        }
    }
}

export default Editor;
