/*

Defines API used to communicate with the backend server.

*/

import { WishSeries } from './wishes';

const LAST_SHARE_TIMEOUT = 15000;

// overwrite fetch

// function fetch(url: string, options: any) {
// }

const fetch = function(input: RequestInfo, init?: RequestInit): Promise<Response> {
    console.log('fetching ' + input);
    if (typeof input === 'string') {
        if (input.startsWith('/')) {
            input = "/soocaml" + input;
            console.log('redirected fetching ' + input);
        }
    }
    return window.fetch(input, init);
};

export class API {
    static EMULATE: boolean = false;
    static LAST_SHARE: Date | undefined;

    static shareWish(wish: WishSeries): Promise<string> {
        if (API.LAST_SHARE !== undefined) {
            if (new Date().getTime() - API.LAST_SHARE.getTime() <= LAST_SHARE_TIMEOUT) {
                return Promise.reject('Please wait a little until you try to share again.');
            }
        }
        API.LAST_SHARE = new Date();
        return fetch('/api/wishare/',
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'PUT',
                body: JSON.stringify(wish)
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.text();
            }
        });
    }

    static loadSharedWish(hash: string): Promise<WishSeries> {
        return fetch('/api/wishare/' + hash,
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.json();
            }
        });
    }

    static shareCode(code: string): Promise<string> {
        if (API.LAST_SHARE !== undefined) {
            if (new Date().getTime() - API.LAST_SHARE.getTime() <= LAST_SHARE_TIMEOUT) {
                return Promise.reject('Please wait a little until you try to share again.');
            }
        }
        API.LAST_SHARE = new Date();
        return fetch('/api/share/',
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'PUT',
                body: JSON.stringify({'code': code})
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.text();
            }
        });
    }

    static loadSharedCode(hash: string): Promise<string> {
        return fetch('/api/share/' + hash,
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.text();
            }
        });
    }

    static getPublicWishList(): Promise<string[]> {
        return fetch('/api/wishlist/',
            {
                headers: {
                  'Accept': 'text/json',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.json();
            }
        }).then(function(data: any) {
            return data.codes.map((name: any) => {
                return name.replace('.wish.json', '');
            });
        });
    }

    static getPublicWish(name: string): Promise<WishSeries> {
        return fetch('/api/wish/' + name.replace(/\//g, '%2F'),
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            }
            return response.json();
        });
    }

    static getCodeExamplesList(): Promise<string[]> {
        return fetch('/api/list/',
            {
                headers: {
                  'Accept': 'text/json',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.json();
            }
        }).then(function(data: any) {
            return data.codes.map((name: any) => {
                return name.replace('.sml', '');
            });
        });
    }

    static getCodeExample(name: string): Promise<string> {
        return fetch('/api/code/' + name.replace(/\//g, '%2F'),
            {
                headers: {
                  'Accept': 'text/plain',
                  'Content-Type': 'application/json'
                },
                method: 'GET'
            }
        ).then(function(response: any) {
            if (!response.ok) {
                return Promise.reject(response.status);
            } else {
                return response.text();
            }
        });
    }
}
