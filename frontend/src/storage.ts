import { DEFAULT_THEME, WISHING_ENABLED, WISHING_HIDDEN } from './config';
import { WishSeries } from './wishes';
import { getColor } from './theme';

export interface InterpreterSettings {
    allowUnicodeInStrings: boolean; // unused
    allowUnicode: boolean;
    allowUnicodeTypeVariables: boolean;
    showTypeVariablesAsUnicode: boolean;
    allowVector: boolean;
    allowSuccessorML: boolean;
    disableElaboration: boolean;
    disableEvaluation: boolean;
    allowLongFunctionNames: boolean;
    allowStructuresAnywhere: boolean;
    allowSignaturesAnywhere: boolean;
    allowFunctorsAnywhere: boolean;
    strictMode: boolean;
    realEquality: boolean;
    showUsedTimeWhenAbove: number; // show time it took to compute a state
}

export interface InterfaceSettings {
    fullscreen: boolean;
    timeout: number;
    errorColor: string;
    successColor1: string;
    successColor2: string;
    outputHighlight: boolean;
    autoIndent: boolean;
    userContributesEnergy: boolean;
    theme: string;
    darkTheme: string;
    maxTabCount: number;
    globalLastCache: boolean;
    showHiddenFiles: boolean;
    advancedMode: boolean;
    autoSelectTheme: boolean;
    useMobile: boolean;
    hideBeforeCodeResult: boolean;
    wishingHidden: boolean; // wishing interface is hidden until the user opens a wishare link
    vimMode?: boolean;
}

export enum FileType {
    LOCAL = 1,
    SERVER,
    SHARE
}

export enum WishType {
    LOCAL = 1,
    SERVER,
    SHARE,
    LOCAL_DEFAULT
}

export interface File {
    name: string;
    info: any;
    type: FileType;
}

export interface ExternalWish {
    fileName: string;
    info?: any;
    wishType: WishType;
}

export function displayName(share: File): string {
    if (share.type !== FileType.SHARE) {
        return share.name;
    }
    if (!Object.prototype.hasOwnProperty.call(share.info, 'date')
       || share.info.date === undefined) {
        return '????-??-??/' + share.name;
    }
    if (!(share.info.date instanceof Date)) {
        return (share.info.date + '').substr(0, 10) + '/' + share.name;
    }
    return share.info.date.toISOString().substr(0, 10) + '/' + share.name;
}

export function getWishDownloaded(wishName: string): boolean {
    let str: string | null = localStorage.getItem('wishDownloaded');
    if (typeof str === 'string') {
        let data: any = JSON.parse(str);
        if (data.hasOwnProperty(wishName)) {
            return data[wishName];
        }
    }
    return false;
}

export function setWishDownloaded(wishName: string, status: boolean): void {
    let str: string | null = localStorage.getItem('wishDownloaded');

    let data: any = {};
    if (typeof str === 'string') {
        data = JSON.parse(str);
    }
    data[wishName] = status;
    localStorage.setItem('wishDownloaded', JSON.stringify(data));
}


// Returns the number of solved parts of the specified wish
export function getWishStatus(wishSeriesId: string, wishId: string): number {
    let str: string | null = localStorage.getItem('wishProgress');
    let wishname = wishSeriesId + '@' + wishId;
    if (typeof str === 'string') {
        let data: any = JSON.parse(str);
        if (data.hasOwnProperty(wishname)) {
            return data[wishname];
        }
    }
    return 0;
}

export function setWishStatus(wishSeriesId: string, wishId: string, completedParts: number): void {
    let str: string | null = localStorage.getItem('wishProgress');
    let wishname = wishSeriesId + '@' + wishId;

    let data: any = {};
    if (typeof str === 'string') {
        data = JSON.parse(str);
    }
    data[wishname] = completedParts;
    localStorage.setItem('wishProgress', JSON.stringify(data));
}

export const HIDDEN_FILE_PREFIX = '.GRF_SD/';

function fillObjectWithString(obj: any, str: string | null) {
    if (typeof str === 'string') {
        let data: any = JSON.parse(str);
        for (let name in data) {
            if (data.hasOwnProperty(name)) {
                obj[name] = data[name];
            }
        }
    }
}

export function getInterpreterSettings(): InterpreterSettings {
    let str: string | null = localStorage.getItem('interpreterSettings');
    let ret: InterpreterSettings = {
        allowUnicodeInStrings: true,
        allowUnicode: false,
        allowUnicodeTypeVariables: false,
        showTypeVariablesAsUnicode: false,
        allowSuccessorML : false,
        disableElaboration: false,
        disableEvaluation: false,
        allowVector: true,
        allowLongFunctionNames: false,
        allowStructuresAnywhere: false,
        allowSignaturesAnywhere: false,
        allowFunctorsAnywhere: false,
        strictMode: true,
        realEquality: false,
        showUsedTimeWhenAbove: -500, // disabled by default; disabled when value is negative
    };
    fillObjectWithString(ret, str);
    return ret;
}

export function setInterpreterSettings(settings: InterpreterSettings) {
    // TODO
}

export function getInterfaceSettings(): InterfaceSettings {
    let str: string | null = localStorage.getItem('interfaceSettings');
    let ret: InterfaceSettings = {
        fullscreen: false,
        timeout: 5000,
        errorColor: getColor(DEFAULT_THEME, undefined, 'error'),
        successColor1: getColor(DEFAULT_THEME, undefined, 'success'),
        successColor2: getColor(DEFAULT_THEME, undefined, 'success_alt'),
        outputHighlight: true,
        autoIndent: true,
        userContributesEnergy: false,
        theme: DEFAULT_THEME,
        darkTheme: 'homura',
        maxTabCount: 75,
        globalLastCache: true,
        showHiddenFiles: false,
        advancedMode: false,
        autoSelectTheme: true,
        useMobile: true,
        hideBeforeCodeResult: true,
        wishingHidden: WISHING_HIDDEN
    };
    fillObjectWithString(ret, str);
    return ret;
}

export function wishingHidden(): boolean {
    if (!WISHING_ENABLED) { return true; }

    if (WISHING_HIDDEN) {
        return getInterfaceSettings().wishingHidden;
    }

    return false;
}

export function setInterfaceSettings(settings: InterfaceSettings) {
    // TODO
    // NOTE: Need to adjust set 'tabCount' if 'maxTabCount' changed
}

export function getLastCachedFile(): string | undefined {
    if (!getInterfaceSettings().globalLastCache) {
        return undefined;
    }

    let lcf: string | null = localStorage.getItem('lastCachedFile');
    if (lcf === null) {
        return undefined;
    } else {
        return lcf as string;
    }
}

export function setLastCachedFile(name: string) {
    localStorage.setItem('lastCachedFile', name);
}

function getNewTabId(): number {
    let maxTabCount = getInterfaceSettings().maxTabCount;

    let tabid: string | null = localStorage.getItem('tabCount');

    if (tabid === null) {
        localStorage.setItem('tabCount', '0');
        return 0;
    }

    let result: number = ((+tabid) + 1) % maxTabCount;
    localStorage.setItem('tabCount', '' + result);

    return result;
}

let tabId = -1;

export function getTabId(): number {
    if (tabId === -1) {
        tabId = getNewTabId();
    }
    return tabId;
}

export function setTabId(newId: number) {
    tabId = newId;
}

export class Database {
    private static instance: Database;
    private database: IDBDatabase;
    private dbRequest: any;

    static getInstance(): Promise<Database> {
        if (Database.instance == null) {
            Database.instance = new Database();
        }
        return Database.instance.getReady();
    }

    getReady(): Promise<Database> {
        return new Promise((resolve: (val: any) => void, reject: (err: any) => void) => {
            if (this.database != null) { // != instead of !== intended
                resolve(this);
            } else if (this.dbRequest == null) { // == instead of === intended
                this.init();
            }
            this.dbRequest.onsuccess = (event: any) => {
                this.database = event.target.result;
                resolve(this);
            };
            this.dbRequest.onerror = (error: any) => {
                reject('Database could not be loaded');
            };
        });
    }

    getWishes(): Promise<[WishSeries, ExternalWish][]> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let cursorReq = this.database.transaction(['wishes']).objectStore('wishes').openCursor();
            cursorReq.onerror = (event: any) => {
                reject('Error during read');
            };
            let wishes: [WishSeries, ExternalWish][] = [];
            cursorReq.onsuccess = (event: any) => {
                let cursor = event.target.result;
                if (cursor) {
                    if (cursor.value !== undefined) {
                        wishes.push([cursor.value.value,
                        {
                            fileName: cursor.key,
                            info: cursor.value,
                            wishType: cursor.value.type,
                        }]);
                    }
                    cursor.continue();
                } else {
                    resolve(wishes);
                }
            };
        });
    }


    getFiles(allowHidden: boolean = false, readShares: boolean = false): Promise<File[]> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let cursorReq = this.database.transaction(['files']).objectStore('files').openCursor();
            cursorReq.onerror = (event: any) => {
                reject('Error during read');
            };
            let files: File[] = [];
            cursorReq.onsuccess = (event: any) => {
                let cursor = event.target.result;
                if (cursor) {
                    if (cursor.value !== undefined &&
                        (!cursor.value.hidden || allowHidden)) {
                        files.push({
                            name: cursor.key,
                            info: cursor.value,
                            type: FileType.LOCAL
                        });
                    }
                    cursor.continue();
                } else {
                    if (!readShares) {
                        resolve(files);
                    } else {
                        let cursorReqS =
                            this.database.transaction(['shares'])
                            .objectStore('shares').openCursor();
                        cursorReqS.onerror = (event: any) => {
                            reject('Error during read');
                        };
                        cursorReqS.onsuccess = (event: any) => {
                            let cursorS = event.target.result;
                            if (cursorS) {
                                if (cursorS.value !== undefined) {
                                    files.push({
                                        name: cursorS.key,
                                        info: cursorS.value,
                                        type: FileType.SHARE
                                    });
                                }
                                cursorS.continue();
                            } else {
                                resolve(files);
                            }
                        };
                    }
                }
            };
        });
    }

    saveFile(name: string, content: string, isHidden: boolean = false): Promise<boolean> {
        let fileName = (isHidden ? HIDDEN_FILE_PREFIX : '') + name;
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['files'], 'readwrite').objectStore('files').put({
                name: fileName, value: content, date: new Date().toISOString(), hidden: isHidden
            });
            request.onerror = (event) => {
                reject(false);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    saveShare(fileName: string, content: string, local: boolean = true): Promise<boolean> {
        let fileOrigin = local ? FileType.LOCAL : FileType.SERVER;

        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['shares'], 'readwrite').objectStore('shares').put({
                name: fileName, value: content, date: new Date().toISOString(), origin: fileOrigin
            });
            request.onerror = (event) => {
                reject(false);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    saveWish(wishName: string, content: WishSeries, wishType: WishType): Promise<boolean> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['wishes'], 'readwrite').objectStore('wishes').put({
                name: wishName, value: content, date: new Date().toISOString(), type: wishType
            });
            request.onerror = (event) => {
                reject(false);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    getFile(fileName: string, isHidden: boolean = false, isShare: boolean = false): Promise<string> {
        let name = (isHidden ? HIDDEN_FILE_PREFIX : '') + fileName;
        let location = isShare ? 'shares' : 'files';
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction([location]).objectStore(location).get(name);
            request.onerror = (event) => {
                reject('Error during read');
            };
            request.onsuccess = (event: any) => {
                try {
                    if (event.target.result === undefined) {
                        reject('Reading ' + name + ' failed: File does not exist.');
                    } else {
                        resolve(event.target.result.value);
                    }
                } catch (e) {
                    reject('Reading ' + name + ' failed with error ' +  e.name + ': ' + e.message);
                }
            };
        });
    }

    getShare(name: string): Promise<[string, FileType, any]> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['shares']).objectStore('shares').get(name);
            request.onerror = (event) => {
                reject('Error during read');
            };
            request.onsuccess = (event: any) => {
                try {
                    resolve([event.target.result.value, event.target.result.origin, event.target.result]);
                } catch (e) {
                    reject('Reading ' + name + ' failed with error ' +  e.name + ': ' + e.message);
                }
            };
        });
    }

    getWish(name: string): Promise<[WishSeries, WishType, any]> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction(['wishes']).objectStore('wishes').get(name);
            request.onerror = (event) => {
                reject('Error during read');
            };
            request.onsuccess = (event: any) => {
                try {
                    resolve([event.target.result.value, event.target.result.origin, event.target.result]);
                } catch (e) {
                    reject('Reading wish ' + name + ' failed with error ' +  e.name + ': ' + e.message);
                }
            };
        });
    }

    deleteDBObject(fileName: string, location: string): Promise<boolean> {
        return new Promise( (resolve: (val: any) => void, reject: (err: any) => void) => {
            let request = this.database.transaction([location], 'readwrite').objectStore(location).delete(fileName);
            request.onerror = (event) => {
                reject(false);
            };
            request.onsuccess = (event) => {
                resolve(true);
            };
        });
    }

    deleteFile(fileName: string, isHidden: boolean = false, isShare: boolean = false): Promise<boolean> {
        let name = (isHidden ? HIDDEN_FILE_PREFIX : '') + fileName;
        let location = isShare ? 'shares' : 'files';
        return this.deleteDBObject(name, location);
    }

    deleteWish(wishName: string): Promise<boolean> {
        return this.deleteDBObject(wishName, 'wishes');
    }


    private init(): void {
        this.dbRequest = window.indexedDB.open('FilesDB', 5);
        this.dbRequest.onupgradeneeded = (event: any) => {
            let db = event.target.result;
            try {
                db.createObjectStore('files', { keyPath: 'name'});
            } catch (e) { }
            try {
                db.createObjectStore('shares', { keyPath: 'name'});
            } catch (e) { }
            try {
                db.createObjectStore('wishes', { keyPath: 'name'});
            } catch (e) { }
        };
        this.dbRequest.onsuccess = (event: any) => {
            this.database = event.target.result;
        };
    }
}
