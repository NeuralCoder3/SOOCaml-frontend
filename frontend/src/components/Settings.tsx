import * as React from 'react';
import { Checkbox } from 'react-bootstrap';

interface InterpreterSettings {
    allowUnicodeInStrings: boolean;
    allowSuccessorML: boolean;
    disableElaboration: boolean;
    allowLongFunctionNames: boolean;
    allowStructuresAnywhere: boolean;
    allowSignaturesAnywhere: boolean;
    allowFunctorsAnywhere: boolean;
}

interface InterfaceSettings {
    fullscreen: boolean;
}

interface State {
    inter: InterpreterSettings;
    front: InterfaceSettings;
}

class Settings extends React.Component<any, State> {
    constructor() {
        super();
        this.state = {
            inter: this.getInterpreterSettings(),
            front: this.getInterfaceSettings()
        };
    }

    render() {
        return (
            <div className="container flexy">
            <h2>Einstellungen für den Interpreter</h2>
                <hr/>
                <p>
                Auf dieser Seite kannst Du einige Einstellungen am Interpreter vornehmen
                und optionale Features aktivieren.
                </p>
                <br/>
                <h4>Einstellungen für den Parser</h4>
                <Checkbox checked={this.state.inter.allowUnicodeInStrings}
                    onChange={this.changeHandler('inter', 'allowUnicodeInStrings')}>
                    Erlaube Unicode-Symbole in Zeichenketten.
                </Checkbox>
                <Checkbox checked={this.state.inter.allowStructuresAnywhere}
                    onChange={this.changeHandler('inter', 'allowStructuresAnywhere')}>
                    Erlaube, dass Strukturen in lokalen Deklarationen defeniert werden können.
                </Checkbox>
                <Checkbox checked={this.state.inter.allowSignaturesAnywhere}
                    onChange={this.changeHandler('inter', 'allowSignaturesAnywhere')}>
                    Erlaube, dass Signaturen auch außerhalb der obersten Programmebene definiert werden können.
                </Checkbox>
                <Checkbox checked={this.state.inter.allowFunctorsAnywhere}
                    onChange={this.changeHandler('inter', 'allowFunctorsAnywhere')}>
                    Erlaube, dass Funktoren auch außerhalb der obersten Programmebene definiert werden können.
                </Checkbox>
                <br/>
                <h4>Verschiedenes</h4>
                <Checkbox checked={this.state.inter.disableElaboration}
                    onChange={this.changeHandler('inter', 'disableElaboration')}>
                    Elaborierung <b>abschalten</b>. (Benutze diese Option, falls der Interpreter komische Geräusche
                        macht oder versucht, wegzurennen.)
                </Checkbox>
                <Checkbox checked={this.state.front.fullscreen}
                    onChange={this.changeHandler('front', 'fullscreen')}>
                    Vollbildmodus im Editor akitivieren (Beenden mit ESC).
                </Checkbox>
            </div>
        );
    }

    private changeHandler(scope: string, property: string) {
        return () => {
            this.setState((oldState) => {
                let deepCopy: any = JSON.parse(JSON.stringify(oldState));
                deepCopy[scope][property] = !this.state[scope][property];
                return deepCopy;
            }, () => {
                this.saveState();
            });
        };
    }

    private saveState() {
        localStorage.setItem('interpreterSettings', JSON.stringify(this.state.inter));
        localStorage.setItem('interfaceSettings', JSON.stringify(this.state.front));
    }

    private getInterpreterSettings(): InterpreterSettings {
        let str: string | null = localStorage.getItem('interpreterSettings');
        let ret: InterpreterSettings = {
            allowUnicodeInStrings: false,
            allowSuccessorML : false,
            disableElaboration: false,
            allowLongFunctionNames: false,
            allowStructuresAnywhere: false,
            allowSignaturesAnywhere: false,
            allowFunctorsAnywhere: false
        };
        this.fillObjectWithString(ret, str);
        return ret;
    }

    private getInterfaceSettings(): InterfaceSettings {
        let str: string | null = localStorage.getItem('interfaceSettings');
        let ret: InterfaceSettings = {
            fullscreen: false
        };
        this.fillObjectWithString(ret, str);
        return ret;
    }

    private fillObjectWithString(obj: any, str: string | null) {
        if (typeof str === 'string') {
            let data: any = JSON.parse(str);
            for (let name in data) {
                if (data.hasOwnProperty(name)) {
                    obj[name] = data[name];
                }
            }
        }
    }
}

export default Settings;