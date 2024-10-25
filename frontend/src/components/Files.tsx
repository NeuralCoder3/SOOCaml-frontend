import * as React from 'react';

import { Container, Table } from 'react-bootstrap';
import { API } from '../api';
import { SAMPLE_FILES_ENABLED, SHARING_ENABLED } from '../config';
import ShareModal from './ShareModal';
import { displayName, getInterfaceSettings, File, FileType, Database } from '../storage';
import FileListItem from './FileListItem';
import FileListFolder from './FileListFolder';
import FileListButton from './FileListButton';

const FileSaver = require('file-saver');

const EXAMPLES_LOADING = 0;
const EXAMPLES_LOADED = 1;
const EXAMPLES_FAILED = 2;

const MINIMODE_LB = 450;

interface State {
    files: File[];
    shares: File[];
    examples: File[];
    examplesStatus: number;
    shareLink: string;
    folder: any;
    miniMode: boolean;
}

class Files extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            files: [],
            shares: [],
            examples: [],
            examplesStatus: EXAMPLES_LOADING,
            shareLink: '',
            folder: {},
            miniMode: false
        };

        this.modalCloseCallback = this.modalCloseCallback.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
    }

    componentDidMount() {
        this.refreshFiles();
        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        this.setState({miniMode: (width < MINIMODE_LB)});
        window.addEventListener('resize', this.handleBrowserResize, {passive: true});
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleBrowserResize);
    }

    render() {
        let modal: JSX.Element | undefined;
        if (this.state.shareLink !== '') {
            modal = (
                <ShareModal error={false}
                    link={this.state.shareLink} closeCallback={this.modalCloseCallback}
                    enocontract={false} formContractCallback={this.modalCloseCallback}/>
            );
        }


        if (this.state.files.length === 0) {
            return (
                <Container className="flexy">
                    <h2>Files</h2>
                    <hr/>
                    <h4>Local Files</h4>
                    <p>
                        Files saved from the editor will appear here.
                    </p>
                    {this.renderShares()}
                    {this.renderExamples()}
                    {modal}
                    <br/> <br/>
                </Container>
            );
        }

        let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        let files = this.deepCopy(this.state.files);
        files.sort((f1: File, f2: File) => {
            return collator.compare(displayName(f1), displayName(f2));
        });

        return (
            <Container className="flexy">
                    <h2>Files</h2>
                    <hr/>
                    <h4>Local Files</h4>
                    <p>
                    You can find your saved files here.
                        Click on a file to load it into the editor.
                    </p>
                    {this.renderFileList(files)}
                    {this.renderShares()}
                    {this.renderExamples()}
                    {modal}
                    <br/> <br/>
            </Container>
        );
    }

    modalCloseCallback() {
        this.setState({
            shareLink: ''
        });
    }

    private handleBrowserResize() {
        let nwidth = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        this.setState({miniMode: (nwidth < MINIMODE_LB)});
    }

    private renderShares() {
        if (!SHARING_ENABLED) {
            return '';
        }

        let sharesView: any[] = [];
        sharesView.push(
            <br key="s@1"/>
        );
        sharesView.push(
            <h4 key="s@2">Shared Files</h4>
        );
        sharesView.push(
            <p key="s@3">Below you can find the share links you created
            (denoted by <span className="glyphicon glyphicon-upload"/>), as well
            as external share links you opened (denoted by <span className="glyphicon glyphicon-download" />).
                Click on a file to view it in the editor.
            </p>
        );

        let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        let shares = this.deepCopy(this.state.shares);

        if (shares.length === 0) {
            return '';
        }

        shares.sort((f1: File, f2: File) => {
            return collator.compare(displayName(f1), displayName(f2));
        });

        sharesView.push(
            <div key="s@4">
                {this.renderFileList(shares)}
            </div>
        );
        return sharesView;
    }

    private renderExamples() {
        if (!SAMPLE_FILES_ENABLED) {
            return '';
        }

        let examplesView: any[] = [];
        examplesView.push(
            <br key="1"/>
        );
        examplesView.push(
            <h4 key="2">Sample Files</h4>
        );
        if (this.state.examplesStatus === EXAMPLES_LOADED) {
            let examples = this.renderFileList(this.state.examples);

            if (this.state.examples.length === 0) {
                examplesView.push(
                    <p key="3">There is no such thing as a sample file.</p>
                );
            } else {
                examplesView.push(
                    <Table key="3" hover={true}>
                        <tbody>
                            {examples}
                        </tbody>
                    </Table>
                );
            }
        } else if (this.state.examplesStatus === EXAMPLES_FAILED) {
            examplesView.push(
                <p key="3">Sample files unavailable.</p>
            );
        } else {
            examplesView.push(
                <p key="3">Loading sample files…</p>
            );
        }

        return examplesView;
    }

    private renderFileList(files: File[], prefix: string = ''): any {
        let style: any = {};
        style.textAlign = 'center';
        let filesView: any[] = [];

        let currentFolder: File[] = [];
        let currentFolderName: string = '';

        for (let i = 0; i < files.length; ++i) {
            // If filename starts with '<string>/', render it as part of a folder
            let currentName = displayName(files[i]).substr(prefix.length).split('/');
            if (currentName.length > 1 && currentName[0] !== '') {
                let newFolder = currentName[0];
                if (currentFolderName === newFolder) {
                    currentFolder.push(files[i]);
                } else {
                    if (currentFolderName !== '') {
                        if (currentFolder.length > 1) {
                            filesView.push(this.renderFolder(currentFolderName,
                                                             currentFolder, i - 1, prefix));
                        } else {
                            filesView.push(this.renderFile(currentFolder[0], i - 1, prefix));
                        }
                        filesView.push(this.renderFile(undefined, files.length + i - 1));
                    }
                    currentFolder = [files[i]];
                    currentFolderName = newFolder;
                }
                continue;
            } else if (currentFolder.length > 0) {
                if (currentFolder.length > 1) {
                    filesView.push(this.renderFolder(currentFolderName,
                                                     currentFolder, i - 1, prefix));
                } else {
                    filesView.push(this.renderFile(currentFolder[0], i - 1, prefix));
                }
                filesView.push(this.renderFile(undefined, files.length + i - 1));
                currentFolder = [];
                currentFolderName = '';
            }

            filesView.push(this.renderFile(files[i], i, prefix));
            if (i < files.length - 1) {
                filesView.push(this.renderFile(undefined, files.length + i));
            }
        }
        if (currentFolder.length > 0) {
            if (currentFolder.length > 1) {
                if (currentFolder.length === files.length && prefix !== '') {
                    // Folder only contains subfolder
                    return undefined;
                }
                filesView.push(this.renderFolder(currentFolderName,
                                                 currentFolder, files.length - 1, prefix));
            } else {
                filesView.push(this.renderFile(currentFolder[0], files.length - 1, prefix));
            }
        }

        return (
            <Table hover={true}>
                <tbody>
                    {filesView}
                </tbody>
            </Table>
        );
    }

    private renderFolder(name: string, files: File[], key: number, prefix: string = ''): any {
        let renderedFiles = this.renderFileList(files, prefix + name + '/');
        if (renderedFiles === undefined) {
            // Folder contains only a single subfolder
            let newPrefix = displayName(files[0]).substr(prefix.length).split('/')[1];
            return this.renderFolder(name + '/' + newPrefix, files, key, prefix);
        }

        let folderState: boolean = this.state.folder[prefix + name + files[0].type];

        let headerButtons: any[] = [];
        if (files.length >= 1 && files[0].type !== FileType.SERVER) {
            let space = (
                <div className="miniSpacer" key={key + '@fhead1'}/>
            );
            let deleteBtn = (
                <FileListButton iconName="trash" key={key + '@fhead2'} onClick={this.deleteHandlerForAll(files)}>
                    {this.state.miniMode ? '' : (files.length >= 1 && files[0].type
                        === FileType.SHARE ? "Forget All" : "Delete All")}
                </FileListButton>
            );
            headerButtons.push(space);
            headerButtons.push(deleteBtn);
        }

        return (
            <FileListFolder isOpened={folderState} folderName={name}
                onClick={this.toggleFolder(prefix + name + files[0].type)}
                headerButtons={headerButtons}
                keyHint={key} key={key} openCloseButtonText={files.length + ' Files'}>
                {renderedFiles}
            </FileListFolder>
        );
    }

    private renderFile(file: File | undefined, key: number, prefix: string = '') {
        if (file === undefined) {
            return (
                <FileListItem key={key} />
            );
        }

        let printName = displayName(file).substr(prefix.length);
        let space = (
            <div className="miniSpacer" />
        );
        let deleteBtn = (
            <FileListButton onClick={this.deleteHandlerFor(file.name)}>
                {this.state.miniMode ? "" : "Delete"}
            </FileListButton>
        );
        let forgetBtn = (
            <FileListButton onClick={this.deleteHandlerFor(file.name, true)}>
                {this.state.miniMode ? "" : "Forget"}
            </FileListButton>
        );
        let linkBtn = (
            <FileListButton iconName="link" btnType="pri" onClick={this.linkHandlerFor(file)}>
                {this.state.miniMode ? "" : "Link"}
            </FileListButton>
        );

        let glicon = 'file';
        if (file.type === FileType.SHARE) {
            glicon = 'download';

            if (file.info !== undefined && file.info.origin !== undefined
                && file.info.origin === FileType.LOCAL) {
                glicon = 'upload';
            }
        }

        return (
            <FileListItem key={key} onClick={this.openHandlerFor(file)} iconName={glicon}
                fileName={printName}>
                <FileListButton btnType="suc" onClick={this.openHandlerFor(file)}
                    iconName={(file.type === FileType.SHARE ? 'search' : 'pencil')}>
                        {this.state.miniMode ? "" : (file.type === FileType.SHARE ? "View" : "Edit")}
                </FileListButton>
                {file.type === FileType.SHARE ? space : ''}
                {file.type === FileType.SHARE ? linkBtn : ''}
                <div className="miniSpacer" />
                <FileListButton btnType="pri" iconName="download-alt"
                    onClick={this.downloadHandlerFor(file)}>
                    {this.state.miniMode ? "" : "Save"}
                </FileListButton>
                {file.type !== FileType.SERVER ? space : ''}
                {file.type === FileType.LOCAL ? deleteBtn : ''}
                {file.type === FileType.SHARE ? forgetBtn : ''}
            </FileListItem>
        );
    }

    private refreshFiles() {
        if (SAMPLE_FILES_ENABLED) {
            Database.getInstance().then((db: Database) => {
                return db.getFiles(getInterfaceSettings().showHiddenFiles, true);
            }).then((data: File[]) => {
                this.setState({files: data.filter((f: File) => f.type !== FileType.SHARE)});
                this.setState({shares: data.filter((f: File) => f.type === FileType.SHARE)});
                return API.getCodeExamplesList();
            }).then((list: string[]) => {
                let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                list.sort(collator.compare);

                this.setState({examples: list.map((file) => {
                    return {
                        'name': file,
                        'info': '',
                        'type': FileType.SERVER
                    };
                }), examplesStatus: EXAMPLES_LOADED});
            }).catch((e) => {
                this.setState({examplesStatus: EXAMPLES_FAILED});
            });
        } else {
            Database.getInstance().then((db: Database) => {
                return db.getFiles(getInterfaceSettings().showHiddenFiles, true);
            }).then((data: File[]) => {
                this.setState({files: data.filter((f: File) => f.type !== FileType.SHARE)});
                this.setState({shares: data.filter((f: File) => f.type === FileType.SHARE)});
            });
        }
    }

    private deepCopy(json: any): any {
        return JSON.parse(JSON.stringify(json));
    }

    private toggleFolder(folderName: string): (evt: any) => void {
        return (evt: any) => {
            this.setState((oldState) => {
                let deepCopy: any = this.deepCopy(oldState);
                deepCopy.folder[folderName] = !deepCopy.folder[folderName];
                return deepCopy;
            });
            evt.stopPropagation();
        };
    }

    private linkHandlerFor(file: File): (evt: any) => void {
        return (evt: any) => {
            this.setState({
                shareLink: window.location.origin + '/soocaml/share/' + file.name
            });
            evt.stopPropagation();
        };
    }

    private openHandlerFor(file: File): (evt: any) => void {
        if (file.type === FileType.SHARE) {
            return (evt: any) => {
                this.props.history.push('/share/' + file.name);
                evt.stopPropagation();
            };
        }
        return (evt: any) => {
            this.props.history.push('/editor', {fileName: file.name,
                                    example: file.type === FileType.SERVER});
            evt.stopPropagation();
        };
    }

    private downloadHandlerFor(file: File): (evt: any) => void {
        return (evt: any) => {
            let promise: any;
            if (file.type !== FileType.SERVER) {
                promise = Database.getInstance().then((db: Database) => {
                    return db.getFile(file.name, false, file.type === FileType.SHARE);
                });
            } else {
                promise = API.getCodeExample(file.name);
            }

            promise.then((content: string) => {
                let blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
                file.name += '.ml';
                FileSaver.saveAs(blob, file.name);
            });
            evt.stopPropagation();
        };
    }

    private deleteHandlerFor(fileName: string, isShare: boolean = false): (evt: any) => void {
        return (evt: any) => {
            Database.getInstance().then((db: Database) => {
                return db.deleteFile(fileName, false, isShare);
            }).then((ok: boolean) => {
                if (ok) {
                    this.refreshFiles();
                }
            });
            evt.stopPropagation();
        };
    }

    private deleteHandlerForAll(files: File[]): (evt: any) => void {
        return (evt: any) => {
            files.forEach((file: File) => {
                Database.getInstance().then((db: Database) => {
                    return db.deleteFile(file.name, false, file.type === FileType.SHARE);
                });
            });
            this.refreshFiles();
            evt.stopPropagation();
        };
    }
}

export default Files;
