import * as React from 'react';

import Playground from './Playground';
import { Button, Container, Table } from 'react-bootstrap';
import { API } from '../api';
import { SAMPLE_WISHES_ENABLED /*, WISHARING_ENABLED */ } from '../config';
import { Database, ExternalWish, WishType, getWishStatus, setWishStatus, getWishDownloaded,
         setWishDownloaded } from '../storage';
import { WishPart, Wish, WishSeries, DEFAULT_WISHES } from '../wishes';

import FileListItem from './FileListItem';
import FileListFolder from './FileListFolder';
import FileListButton from './FileListButton';

import { WishNotification, WishNotificationModal } from './WishNotificationModal';
const Modal = require('react-bootstrap').Modal;
// const FileSaver = require('file-saver');

const WISHES_LOADING = 0;
const WISHES_LOADED = 1;
const WISHES_FAILED = 2;

const MINIMODE_LB = 768;

const TEST_START_STRING = '--- Checking your solution ---';
const TEST_COMPLETE_STRING = '--- All checks passed. Part complete! ---';

interface State {
    wishes: [WishSeries, ExternalWish][]; // wish series shipped with SOSML-frontend
    localWishes: [WishSeries, ExternalWish][]; // wishes saved in the browser

    externalWishes: ExternalWish[]; // names of wish files available on the server
    externalWishesStatus: number;
    miniMode: boolean; // shrink everything on small screens
    folder: any;

    initialCode: string | undefined;
    code: string | undefined;
    wishSeries: WishSeries | undefined; // currently opened wish series
    wish: Wish | undefined; // currently opened Wish
    wishPart: number | undefined; // currently opened wish part
    wishPartSolved: boolean | undefined; // true if the user solved the current part
    wishPartNotification: boolean | undefined; // show a notification for

    wishNotification: WishNotification | undefined; // notification that a wishare link was successful
}

class Wishes extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            wishes: DEFAULT_WISHES,
            localWishes: [],
            externalWishes: [],
            externalWishesStatus: WISHES_LOADING,
            miniMode: false,
            folder: {},

            initialCode: undefined,
            code: undefined,
            wishSeries: undefined,
            wish: undefined,
            wishPart: undefined,
            wishPartSolved: undefined,
            wishPartNotification: undefined,

            wishNotification: undefined,
        };

        this.notificationCloseCallback = this.notificationCloseCallback.bind(this);
        this.markCurrentTaskSolved = this.markCurrentTaskSolved.bind(this);
        this.checkWishComplete = this.checkWishComplete.bind(this);
        this.onWishCodeChange = this.onWishCodeChange.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
        this.handleResetWish = this.handleResetWish.bind(this);
    }

    componentDidMount() {
        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        this.setState({miniMode: (width < MINIMODE_LB)});
        this.refreshExternalWishes();
        window.addEventListener('resize', this.handleBrowserResize, {passive: true});

        if (this.props.history && this.props.history.location.state) {
            let state: any = this.props.history.location.state;

            if (state.wish && state.wishPart) {
                this.setState({wish: state.wish, wishPart: state.wishPart});
            }
        }

        if (this.props.match && this.props.match.params && this.props.match.params.hash) {
            // got redirected from a /wishare/:hash link
            let shareName = this.props.match.params.hash;

            Database.getInstance().then((db: Database) => {
                return db.getWish(shareName);
            }).then((content: [WishSeries, WishType, any]) => {
                this.setState((oldState) => {
                    return {
                        wishNotification: {
                            wishName: shareName,
                            wishType: content[1],
                            isNewWish: false
                        }
                    }
                });
            }).catch((error: any) => {
                API.loadSharedWish(shareName).then((content: WishSeries) => {
                    this.setState((oldState) => {
                        return {
                            wishNotification: {
                                wishName: shareName,
                                wishType: WishType.SHARE,
                                isNewWish: true
                            }
                        }
                    });

                    // Cache the shared file as it does not yet exist
                    Database.getInstance().then((db: Database) => {
                        return db.saveWish(shareName, content, WishType.SHARE);
                    });
                }).catch((error: any) => {
                    this.setState({
                        wishNotification: {
                            wishName: shareName,
                            wishType: WishType.SHARE,
                            isNewWish: false,
                            error: error
                        }
                    });
                });
            });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleBrowserResize);
    }

    render() {
        let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        let wishes = this.deepCopy(this.state.wishes);
        wishes.sort((q1: WishSeries, q2: WishSeries) => {
            return collator.compare(q1.id, q2.id);
        });
        let localWishes = this.deepCopy(this.state.localWishes);
        localWishes.sort((q1: WishSeries, q2: WishSeries) => {
            return collator.compare(q1.id, q2.id);
        });

        let notification: JSX.Element | undefined;
        if (this.state.wishNotification !== undefined) {
            // there is some notification to be shown
            notification = (
                <WishNotificationModal closeCallback={this.notificationCloseCallback}
                    notification={this.state.wishNotification} />
            );
        }

        if (this.state.wishSeries === undefined
            || this.state.wish === undefined || this.state.wishPart === undefined) {
            // User is not currently working on a wish
            return (
                <Container className="flexy">
                        <h2>Wishes</h2>
                        <hr/>
                        {this.renderWishList(wishes)}
                        <h4>Local Wishes</h4>
                        <p>
                        {localWishes.length === 0
                            ? "Wishes stored locally in your browser will appear here."
                            : "You can find the wishes that you downloaded from the server here."}
                        </p>
                        {this.renderWishList(localWishes)}
                        {this.renderExternalWishes()}
                        <br/> <br/>
                        {notification}
                </Container>
            );
        } else {
            // Render the current wish (part)
            return (
                <Container key={this.state.wish.name + '@' + this.state.wishPart} className="flexy">
                        {this.state.wishPartNotification ?
                            this.renderWishPartCompleted(this.state.wishSeries,
                                                         this.state.wish,
                                                         this.state.wishPart) : ''}
                        <h2><span style={{fontSize: 'smaller'}}>{this.state.wishSeries.name}
                        :</span> {this.state.wish.name}</h2>
                        <hr/>
                        {this.renderWishProgress(this.state.wishSeries, this.state.wish,
                                                 this.state.wishPart)}
                        <br/>
                        {this.renderCurrentWish(this.state.wishSeries, this.state.wish,
                                                this.state.wishPart)}
                        <br/> <br/>
                </Container>
            );
        }
    }

    notificationCloseCallback(needsReload: boolean) {
        this.setState((oldState) => {
            return {
                wishNotification: undefined
            }
        });
        this.props.history.push('/wishes/');
        if (needsReload) {
            window.location.reload();
        }
    }

    isWishCompleted(wishSeries: WishSeries, wish: Wish) {
        return getWishStatus(wishSeries.id, wish.name) >= wish.parts.length;
    }

    private renderWishPartCompleted(wishSeries: WishSeries, wish: Wish, part: number): any {
        // Shows a modal informing the user that they completed a (part of a) wish for the
        // first time.
        // Also informs about the current progress in the current wish and has a button to
        // the next part / wish

        let headerText = 'Your Wish Has Not Yet Been Granted';
        let nxtbtn: any = (
            <button className="btn btn-suc-alt" type="button"
            onClick={this.openHandlerFor(wishSeries, wish, part + 1)}
            >I Wish to Proceed</button>
        );
        let nxtbody: any = (
            <Modal.Body>
                Congratulations! You successufully completed
                Part {part + 1} of this Wish.<br/>
                But there is more: {wish.parts.length - part - 1} more
                part{wish.parts.length - part === 1 ? '' : 's'} await you!
            </Modal.Body>
        );

        if (wish.parts.length === part + 1) {
            headerText = 'A Part of Your Wish Has Been Fulfilled';
            nxtbtn = (
                <button className="btn btn-suc-alt" type="button"
                onClick={(evt) => {this.setState({wishSeries: undefined, wish: undefined,
                    wishPart: undefined})}}>Return to the Wishes Overview</button>
            );
            nxtbody = (
                <Modal.Body>
                    Congratulations! You successfully completed all tasks of this Wish.<br/>
                    Check out the Wishes Overview to find new Wishes to work on!
                </Modal.Body>
            );
        }

        return (
            <Modal show={true} onHide={() => { this.setState({wishPartNotification: false}); } }>
                <Modal.Header closeButton={false}>
                    <Modal.Title>{headerText}</Modal.Title>
                </Modal.Header>
                {nxtbody}
                <Modal.Footer>
                    <button className="btn btn-def-alt" type="button"
                    onClick={() => {this.setState({wishPartNotification: false});}}>Dismiss</button>
                    {nxtbtn}
                </Modal.Footer>
            </Modal>
        );
    }

    private renderWishProgress(wishSeries: WishSeries, wish: Wish, part: number): any {
        let qnbtn: any[] = [];
        let partsCompleted = getWishStatus(wishSeries.id, wish.name);

        let space = (key: number) => { return (
                <div key={'wpr@spacer@' + key} className="miniSpacer" />
            );
        };
        qnbtn.push(
            <span key={'lbl'} style={{fontFamily: 'monospace'}}>
                Select a Part:
            </span>
        );
        for (let i = 0; i < wish.parts.length; i++) {
            qnbtn.push(space(i));
            let btnType = 'button btn-suc-alt';
            let icon = 'glyphicon-ok-sign'
            if (i > partsCompleted) {
                btnType = 'button btn-dng-alt';
                icon = 'glyphicon-lock'
            } else if (i === partsCompleted) {
                btnType = 'button btn-pri-alt';
                icon = 'glyphicon-exclamation-sign';
            }

            qnbtn.push(
                <Button size="sm" className={btnType}
                    onClick={this.openHandlerFor(wishSeries, wish, i)}
                    key={'quicknav@b@' + i}
                    disabled={i > partsCompleted || part === i}>
                        <div className={'glyphicon ' + icon} />
                    </Button>
            );
        }

        return(
            <Table>
            <tbody>
            <tr>
                <td style={{border: 'none', padding: 'unset'}}>
                    <Button size="sm" className="button btn-suc-alt"
                    onClick={(evt) => {this.setState({wishSeries: undefined, wish: undefined,
                    wishPart: undefined})}}>
                        Return to the Wishes Overview
                    </Button>
                </td>
                <td style={{border: 'none', padding: 'unset', textAlign: 'right'}}>
                    {qnbtn}
                </td>
            </tr>
            </tbody>
            </Table>
        );
    }

    private markCurrentTaskSolved( ): void {
        if (this.state.wishSeries === undefined
            || this.state.wish === undefined
            || this.state.wishPart === undefined) {
            return;
        }

        let wishSeriesId = (this.state.wishSeries as WishSeries).id;
        let wishId = (this.state.wish as Wish).name;
        let wishPart = (this.state.wishPart as number);

        let wasSolved: boolean = this.state.wishPartSolved === true; // guard against undefined
        this.setState({
            wishPartNotification: !wasSolved,
            wishPartSolved: true
        });

        if (!wasSolved) {
            setWishStatus(wishSeriesId, wishId,
                          Math.max(getWishStatus(wishSeriesId, wishId), wishPart + 1));
        }
    }

    private checkWishComplete(output: string, complete: boolean): void {
        if (!complete) {
            return;
        }

        if (output.endsWith('\n')) {
            output = output.substr(0, output.length - 1);
        }
        let lines: string[] = output.split('\n');

        // Find the last line that contains the string TEST_START_STRING
        // (This is were the tests start)

        let teststart = lines.length - 1;

        for (; teststart >= 0; teststart--) {
            if (lines[teststart].includes(TEST_START_STRING)) {
                break;
            }
        }

        if (teststart < 0) {
            return;
        }

        // Check that no errors were encountered after that point
        for (; teststart < lines.length; ++teststart) {
            if (lines[teststart].startsWith('\\3')) {
                // Found an error / failed test
                return;
            }
        }

        this.markCurrentTaskSolved( );
    }

    private renderCurrentWish(wishSeries: WishSeries, wish: Wish, part: number): any {
        if(part >= wish.parts.length) { return []; }

        let curPart: WishPart = wish.parts[part];

        let res: any[] = [];

        // Description of the current part (containing the task/explanation/etc.)
        res.push(
            <div key={wish.name + '@des'}>
                {this.parseDescriptionString(curPart.description.join(''), wish.name)[0]}
            </div>
        );
        res.push(
            <br key={wish.name + '@br'}/>
        );


        // Code field
        res.push(
            <div className="flexy flexcomponent" style={{minHeight: '500px'}}
                key={wish.name + '@code@' + this.state.initialCode}>
                <Playground readOnly={this.state.wishPartNotification === true}
                onCodeChange={this.onWishCodeChange}
                initialCode={this.state.initialCode as string}
                outputCallback={this.checkWishComplete}
                onReset={this.handleResetWish}
                interpreterSettings={curPart.code.interpreterSettings}
                overwriteFilename={(_) => {return;}}
                beforeCode={curPart.code.beforeCode === undefined ? undefined :
                    curPart.code.beforeCode.join('')}
                afterCode={'\n local val _ = printLn "' + TEST_START_STRING + '" in end; local\n'
                    + (curPart.code.afterCode === undefined ? '' : curPart.code.afterCode.join(''))
                    + '\n val _ = printLn "' + TEST_COMPLETE_STRING + '"; in end;' } />
            </div>
        );

        return res;
    }

    handleResetWish() {
        if (this.state.wishSeries === undefined
            || this.state.wish === undefined || this.state.wishPart === undefined) {
            // There is no code, this method should  not have been called at all...
            return;
        }

        let initCode: string = '';
        if(this.state.wish.parts[this.state.wishPart].code.userDefaultCode !== undefined) {
            initCode = (this.state.wish.parts[this.state.wishPart].code.userDefaultCode as string[]).join('');
        }

        this.setState({initialCode: initCode, code: initCode});
    }

    onWishCodeChange(newCode: string) {
        if (this.state.wishSeries === undefined
            || this.state.wish === undefined || this.state.wishPart === undefined) {
            // There is no code, this method should  not have been called at all...
            return;
        }

        this.setState({code: newCode});

        Database.getInstance().then((db: Database) => {
            return db.saveFile(this.getFileName(this.state.wishSeries as WishSeries,
                               this.state.wish as Wish,
                               this.state.wishPart as number), this.state.code as string, true);
        });
    }

    private parseDescriptionString(description: string, key: string, endDelim: string = ''): any {
        if(description === undefined) { return '<undefined>'; }

        let descr: any[] = [];

        let pos = 0;
        let curpart = "";
        while (pos < description.length) {
            switch(description[pos]) {
                case '\n':
                    descr.push(<span key={'td@' + key + '@' + pos}>{curpart}</span>);
                    descr.push(<br key={'tdb@' + key + '@' + pos }/>);
                    curpart = "";
                    break;
                case '\t':
                    descr.push(<span key={'td@' + key + '@' + pos}>{curpart}</span>);
                    descr.push(<span key={'tbs@' + key + '@' + pos }>&nbsp;&nbsp;&nbsp;&nbsp;</span>);
                    curpart = "";
                    break;
                default:
                    break;
            }
            if (pos + 1 < description.length) {
                if (description[pos] + description[pos + 1] === endDelim) {
                    break;
                }
                let found = false;
                switch (description[pos] + description[pos + 1]) {
                    case '**':
                    case '__':
                    case '``':
                        found = true;
                        break;
                    default:
                        break;
                }
                if (found) {
                    let inner = this.parseDescriptionString(description.substr(pos + 2), key,
                                description[pos] + description[pos + 1]);
                    descr.push(<span key={'td@' + key + '@' + pos}>{curpart}</span>);
                    curpart = "";
                    switch(description[pos] + description[pos + 1]) {
                    case '**':
                        descr.push(<b key={'tdbold@' + key + '@' + pos }>{inner[0]}</b>);
                        break;
                    case '__':
                        descr.push(<i key={'tdit@' + key + '@' + pos }>{inner[0]}</i>);
                        break;
                    case '``':
                        descr.push(<code key={'tdcode@' + key + '@' + pos }>{inner[0]}</code>);
                        break;
                    default:
                       break;
                    }
                    pos += inner[1] + 4;
                    continue;
                }
            }

            curpart += description[pos];
            pos++;
        }

        descr.push(<span key={'td@' + key + '@' + pos}>{curpart}</span>);
        return [descr, pos];
    }

    private renderExternalWishes() : any {
        if (!SAMPLE_WISHES_ENABLED) {
            return '';
        }

        let examplesView: any[] = [];
        examplesView.push(
            <br key="ex@1"/>
        );
        examplesView.push(
            <h4 key="ex@2">Downloadable Wishes</h4>
        );

        if (this.state.externalWishesStatus === WISHES_LOADED) {
            let externalWishes = this.renderExternalWishList(this.state.externalWishes);
            examplesView.push(externalWishes);
        } else if (this.state.externalWishesStatus === WISHES_FAILED) {
            examplesView.push(
                <p key="3">External wishes unavailable.</p>
            );
        } else {
            examplesView.push(
                <p key="3">Loading external wishes…</p>
            );
        }

        return examplesView;
    }

    private renderFolder(name: string, shortName: string, description: string[], inner: any,
                         key: string, wishInfo: ExternalWish): any {
        let folderState: boolean = this.state.folder[name + key];

        if (description === undefined) {
            description = [];
        }

        let desc = (
            <div key={"sd@" + key}>
                {this.parseDescriptionString(description.join(''), key)[0]}
            </div>
        );

        // TODO: show wishInfo

        return (
            <FileListFolder isOpened={folderState}
            folderName={this.state.miniMode ? shortName : name}
            onClick={this.toggleFolder(name + key)}
            keyHint={key} key={key} openCloseButtonText={'Progress'}
            description={description.length > 0 ? desc : undefined}>
                {inner}
            </FileListFolder>
        );
    }

    private renderWish(wishSeries: WishSeries, wish: Wish, key: string): any {
        let partsCompleted = getWishStatus(wishSeries.id, wish.name);

        let unlocked = true;
        // a wish is unlocked if all prerequisites are completed
        for (let i = 0; i < wish.prerequisites.length; ++i) {
            let pq = wish.prerequisites[i];

            for (let j = 0; j < wishSeries.wishes.length; ++j) {
                if (wishSeries.wishes[j].name === pq) {
                    if (!this.isWishCompleted(wishSeries, wishSeries.wishes[j])) {
                        unlocked = false;
                    }
                    break;
                }
            }
            if (!unlocked) { break; }
        }

        let parts: any[] = [];
        for (let i = 0; i < wish.parts.length; i++) {
            if (i > 0) {
                parts.push(
                    <div key={'space@' + i} className="miniSpacer" />
                );
            }
            let btnType = 'suc';
            let icon = 'ok-sign'
            if (!unlocked || i > partsCompleted) {
                btnType = 'dng';
                icon = 'lock'
            } else if (i === partsCompleted) {
                btnType = 'pri';
                icon = 'exclamation-sign';
            }
            parts.push(
                <FileListButton btnType={btnType} onClick={this.openHandlerFor(wishSeries, wish, i)}
                    key={key + '@b@' + i}
                    disabled={!unlocked || i > partsCompleted} iconName={icon} />
            );
        }

        if (partsCompleted >= wish.parts.length) {
            partsCompleted = wish.parts.length - 1;
        }

        return (
            <Table key={'tbl1@wish@tbl@' + key + '@' + wish.name} hover={true}>
                <tbody>
                    <FileListItem key={'tbl1@wish@itm@' + key + '@' + wish.name}
                        iconName={'exclamation-sign'} fileName={wish.name}
                        onClick={unlocked ? this.openHandlerFor(wishSeries, wish, partsCompleted)
                        : undefined}>
                        {parts}
                    </FileListItem>
                    <FileListItem key={key} />
                </tbody>
            </Table>
        );
    }

    private renderExternalWishList(externalWishList: ExternalWish[]): any {
        if (externalWishList.length === 0) {
            return (
                <p key="ex@3">No external wishes available.</p>
            );
        }

        let filesView: any[] = [];

        // For now, no folder support for external wishes
        for (let i = 0; i < externalWishList.length; ++i ) {
            let downloaded: boolean = getWishDownloaded(externalWishList[i].fileName);

            let downloadBtn = [(
                <FileListButton btnType="pri" iconName={downloaded ? 'ok-sign' : 'download'}
                    disabled={downloaded} onClick={downloaded ? undefined
                        : this.downloadExternalWish(externalWishList[i])}>
                    {downloaded ? 'Accepted' : 'Accept'}
                </FileListButton>
            )];
            filesView.push(
                <FileListItem key={'exwish@' + i}
                onClick={downloaded ? undefined : this.downloadExternalWish(externalWishList[i])}
                fileName={externalWishList[i].fileName} iconName={'exclamation-sign'}>
                    {downloadBtn}
                </FileListItem>
            );
            filesView.push(
                <FileListItem key={'exwish@a' + i} />
            );
        }

        return (
            <Table hover={true}>
                <tbody>
                    {filesView}
                </tbody>
            </Table>
        );
    }

    private downloadExternalWish(externalWish: ExternalWish): (evt: any) => void {
        return (evt: any) => {
            // try to download wish over api
            API.getPublicWish(externalWish.fileName).then((content: WishSeries) => {
                Database.getInstance().then((db: Database) => {
                    // store wish in db
                    return db.saveWish(externalWish.fileName, content, WishType.SERVER);
                }).then(() => {
                    this.refreshStoredWishes();
                    setWishDownloaded(externalWish.fileName, true);
                    this.setState((oldState) => {
                        return {
                            wishNotification: {
                                wishName: externalWish.fileName,
                                wishType: WishType.SERVER,
                                isNewWish: true
                            }
                        }
                    });
                }).catch((error: any) => {
                    this.setState((oldState) => {
                        return {
                            wishNotification: {
                                wishName: externalWish.fileName,
                                wishType: WishType.SERVER,
                                isNewWish: false,
                                error: error
                            }
                        }
                    });
                    setWishDownloaded(externalWish.fileName, false);
                });
            }).catch((error: any) => {
                this.setState((oldState) => {
                    return {
                        wishNotification: {
                            wishName: externalWish.fileName,
                            wishType: WishType.SERVER,
                            isNewWish: false,
                            error: error
                        }
                    }
                });
                setWishDownloaded(externalWish.fileName, false);
            });
            evt.stopPropagation();
        };
    }

    private renderWishList(wishSeries: [WishSeries, ExternalWish][]): any {
        return wishSeries.map((q: [WishSeries, ExternalWish]) => {
            return this.renderWishSeries(q[0], q[1]);
        });
    }

    private renderWishSeries(wishSeries: WishSeries, wishInfo: ExternalWish): any {
        let wishes: any[] = wishSeries.wishes !== undefined ? wishSeries.wishes.map((q: Wish) => {
            return this.renderWish(wishSeries, q, wishSeries.id);
        }) : [];
        let style4: any = {};
        style4.padding = '2.5px';
        return (
            <Table key={'tbl1@' + wishSeries.id} hover={true}>
                <tbody>
                {this.renderFolder(wishSeries.name, wishSeries.shortName,
                                   wishSeries.description, wishes, wishSeries.id, wishInfo)}
                <tr key={'tbl1@pad@' + wishSeries.id} className="no-hover">
                    <td style={style4}/>
                    <td style={style4}/>
                </tr>
                </tbody>
            </Table>
        );
    }

    private handleBrowserResize() {
        let nwidth = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
        this.setState({miniMode: (nwidth < MINIMODE_LB)});
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

    private getFileName(wishSeries: WishSeries,
                        wish: Wish, wishPart: number): string {
        return 'WSH/' + wishSeries.id + '/' + wish.name + '/' + wishPart;
    }

    private openHandlerFor(wishSeries: WishSeries,
                           wish: Wish, wishPart: number): (evt: any) => void {
        return (evt: any) => {
            this.setState((oldState) => ({
                wishSeries: wishSeries,
                wish: wish,
                wishPart: wishPart,
                wishPartNotification: false,
                wishPartSolved: getWishStatus(wishSeries.id, wish.name) > wishPart,
                initialCode: undefined
            }));

            Database.getInstance().then((db: Database) => {
                return db.getFile(this.getFileName(wishSeries, wish, wishPart), true);
            }).then((content: string) => {
                this.setState((oldState) => {
                    return {initialCode: content};
                });
            }).catch(err => { });
            if (this.state.initialCode === undefined) {
                // User has no code of previous attempts
                this.setState((oldState) => ({initialCode:
                              wish.parts[wishPart].code.userDefaultCode === undefined ? ''
                    : (wish.parts[wishPart].code.userDefaultCode as string[]).join('')}));
            }
            evt.stopPropagation();
        };
    }

    private refreshStoredWishes() {
        // update downloaded files
        Database.getInstance().then((db: Database) => {
            return db.getWishes();
        }).then((data: [WishSeries, ExternalWish][]) => {
            this.setState({localWishes: data});
        });
    }

    private refreshExternalWishes() {
        if (SAMPLE_WISHES_ENABLED) {
            API.getPublicWishList().then((list: string[]) => {
                let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                list.sort(collator.compare);

                this.setState({externalWishes: list.map((file) => {
                    return {
                        'fileName': file,
                        'wishType': WishType.SERVER
                    };
                }), externalWishesStatus: WISHES_LOADED});
            }).catch((e) => {
                this.setState({externalWishesStatus: WISHES_FAILED});
            });
        }
        this.refreshStoredWishes();
    }
}

export default Wishes;
