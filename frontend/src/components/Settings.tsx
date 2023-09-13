import * as React from 'react';
// import { CardDeck } from 'react-bootstrap';
import { Container} from 'react-bootstrap';

import { REF_NAME, COMMIT_SHA, PIPELINE_ID, BUILD_DATE } from './Version';
import { getColor, getTheme } from '../theme';
import { InterpreterSettings, InterfaceSettings, getInterpreterSettings,
    getInterfaceSettings } from '../storage';
import ThemeCard from './ThemeCard';
import Icon from './Icon';

interface State {
    inter: InterpreterSettings;
    front: InterfaceSettings;
}

class Settings extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = {
            inter: getInterpreterSettings(),
            front: getInterfaceSettings()
        };

        this.timeoutChangeHandler = this.timeoutChangeHandler.bind(this);
        this.timeDisplayChangeHandler = this.timeDisplayChangeHandler.bind(this);
        this.resetColorsToDefault = this.resetColorsToDefault.bind(this);
        this.themeChangeHandler = this.themeChangeHandler.bind(this);
        this.changeTheme = this.changeTheme.bind(this);
    }

    render() {
        return (
            <div className="container flexy">
            <h2>Settings</h2>
                <hr/>
                <p>
                My name is "{REF_NAME}-{COMMIT_SHA} run {PIPELINE_ID}/{BUILD_DATE}" aka. FRONTEND.
                    <br/>
                You can enable some additional features and extensions here.
                Things may break so be warned, though.
                </p>
                <br/>
                {this.renderSettings(this.state.front.advancedMode)}
                <br/> <br/>
            </div>
        );
    }

    resetColorsToDefault() {
        this.setState((oldState) => {
            let deepCopy: any = this.deepCopy(oldState);
            deepCopy.front.errorColor = getColor(deepCopy.front.theme, undefined, 'error');
            deepCopy.front.successColor1 = getColor(deepCopy.front.theme, undefined, 'success');
            deepCopy.front.successColor2 = getColor(deepCopy.front.theme, undefined, 'success_alt');
            return deepCopy;
        }, () => {
            this.saveState();
        });
    }

    private renderSettings(advanced: boolean): any[] {
        let style: any = {};
        style.textAlign = 'right';
        style.width = '4.5em';
        style.border = 'none';

        let result: any[] = [];
        result.push(
            <h4 key={0}>Interpreter Settings</h4>
        );
        if (advanced) {
            /*
            result.push(
                <div className="checkbox" key="d2">
                <label>
                <input type="checkbox" key={2} checked={this.state.inter.allowStructuresAnywhere}
                    onChange={this.changeHandler('inter', 'allowStructuresAnywhere')}/>
                    Allow structures to be defined in local declaration expressions.
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d3">
                <label>
                <input type="checkbox" key={3} checked={this.state.inter.allowSignaturesAnywhere}
                    onChange={this.changeHandler('inter', 'allowSignaturesAnywhere')}/>
                    Allow signatures to be defined in all non top-level declarations.
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d4">
                <label>
                <input type="checkbox" key={4} checked={this.state.inter.allowFunctorsAnywhere}
                    onChange={this.changeHandler('inter', 'allowFunctorsAnywhere')}/>
                    Allow functors to be defined in all non top-level declarations.
                </label>
                </div>
            );
            */
            result.push(
                <div className="checkbox" key="d5">
                <label>
                <input type="checkbox" key={5} checked={this.state.inter.allowVector}
                    onChange={this.changeHandler('inter', 'allowVector')}/>
                    Allow vector patterns and expressions.
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d6">
                <label>
                <input type="checkbox" key={6} checked={this.state.inter.allowSuccessorML}
                    onChange={this.changeHandler('inter', 'allowSuccessorML')}/>
                    Enable support for 'SuccessorML' (experimental)
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d6a">
                <label>
                <input type="checkbox" key={601} checked={this.state.inter.allowUnicode}
                    onChange={this.changeHandler('inter', 'allowUnicode')}/>
                    Enable support for Unicode (experimental)
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d6b">
                <label>
                <input type="checkbox" key={602} checked={this.state.inter.allowUnicodeTypeVariables}
                    onChange={this.changeHandler('inter', 'allowUnicodeTypeVariables')}/>
                    Enable support for writing type variables as α, β, γ, etc. (experimental)
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d6c">
                <label>
                <input type="checkbox" key={603} checked={this.state.inter.showTypeVariablesAsUnicode}
                    onChange={this.changeHandler('inter', 'showTypeVariablesAsUnicode')}/>
                    Display type variables as α, β, γ, etc. (experimental)
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d65">
                <label>
                <input type="checkbox" key={65} checked={this.state.inter.realEquality}
                    onChange={this.changeHandler('inter', 'realEquality')}/>
                    Turn real into a type with equality.
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d7">
                <label>
                <input type="checkbox" key={7} checked={this.state.inter.strictMode}
                    onChange={this.changeHandler('inter', 'strictMode')}/>
                    Enforce single-typed results
                </label>
                </div>
            );
        }
        result.push(
                <div className="checkbox" key="d8">
                <label>
            <input type="checkbox" key={8} checked={this.state.inter.disableElaboration}
                onChange={this.changeHandler('inter', 'disableElaboration')}/>
                <b>Disable</b> elaboration.
                </label>
            </div>
        );
        result.push(
                <div className="checkbox" key="d9">
                <label>
            <input type="checkbox" key={9} checked={this.state.inter.disableEvaluation}
                onChange={this.changeHandler('inter', 'disableEvaluation')}/>
                <b>Disable</b> evaluation.
                </label>
            </div>
        );
        result.push(
            <p key={10}>
                Abort evaluation after <input type="number" min="0" step="100"
                value={this.state.front.timeout} style={style}
                onChange={this.timeoutChangeHandler} placeholder="9029"/> ms.
                <br/><br/>
            </p>
        );
        result.push(
            <h4 key="n11">Theme Settings</h4>
        );
        result = result.concat(this.renderThemes());
        result.push(
            <h4 key={11}>Editor Settings</h4>
        );
        result.push(
            <div className="checkbox" key="d16">
                <label>
                <input type="checkbox" key={16} checked={this.state.front.advancedMode}
                    onChange={this.changeHandler('front', 'advancedMode')}/>
                Show <em>more</em> things to break.
                </label>
            </div>
        );
        result.push(
                <div className="checkbox" key="d13">
                <label>
            <input type="checkbox" key={13} checked={this.state.front.outputHighlight}
                onChange={this.changeHandler('front', 'outputHighlight')}/>
                Enable colored output
                </label>
            </div>
        );
        result.push(
                <div className="checkbox" key="d14">
                <label>
            <input type="checkbox" key={14} checked={this.state.front.autoIndent}
                onChange={this.changeHandler('front', 'autoIndent')}/>
                Enable auto-indent
                </label>
            </div>
        );
        if (advanced) {
            result.push(
                <div className="checkbox" key="d142">
                    <label>
                        <input type="checkbox" key={142} checked={this.state.front.useMobile}
                            onChange={this.changeHandler('front', 'useMobile')}/>
                        Switch to vertical editor mode on narrow screens and windows.
                    </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d140">
                <label>
                <input type="checkbox" key={140} checked={this.state.front.showHiddenFiles}
                    onChange={this.changeHandler('front', 'showHiddenFiles')}/>
                    Display hidden files.
                </label>
                </div>
            );
            result.push(
                <div className="checkbox" key="d141">
                <label>
                <input type="checkbox" key={141} checked={this.state.front.globalLastCache}
                    onChange={this.changeHandler('front', 'globalLastCache')}/>
                    Show last edited code when opening the editor.
                </label>
                </div>
            );
        }
        result.push(
                <div className="checkbox" key="d15">
                <label>
            <input type="checkbox" key={15} checked={this.state.front.fullscreen}
                onChange={this.changeHandler('front', 'fullscreen')}/>
                Switch editor into fullscreen mode (Use ESC to return to the normal mode.)
                </label>
            </div>
        );
        result.push(
                <div className="checkbox" key="d12">
                <label>
            <input type="checkbox" key={12} checked={this.state.inter.showUsedTimeWhenAbove >= 0}
                onChange={this.timeDisplayFlipHandler()}/>
                Show execution time
                </label>
            </div>
        );
        if (this.state.inter.showUsedTimeWhenAbove >= 0) {
            result.push(
                <p key={100}>
                    Show execution time only if larger than <input type="number" min="0" step="100"
                    value={this.state.inter.showUsedTimeWhenAbove} style={style}
                    onChange={this.timeDisplayChangeHandler} placeholder="9029"/> ms.
                </p>
            );
        }
        return result;
    }

    private renderThemes() {
        let style: any = {};
        style.textAlign = 'right';
        style.width = '4.5em';
        style.border = 'none';

        let result: any[] = [];
        let themeCards: any[] = [];
        let dt: string | undefined = this.state.front.autoSelectTheme ?
            this.state.front.darkTheme : undefined;
        let borderColor = getColor(this.state.front.theme, dt, 'foreground');
        let bgColor = getColor(this.state.front.theme, dt, 'background');

        let themeList = ['sayaka', 'madoka', 'homura', 'kyoko'];
        if (this.state.front.advancedMode) {
            themeList = ['sayaka', 'madoka', 'mami', 'homura', 'kyoko', 'nagisa',
                'sana', 'yachiyo'];
        }

        for (let tm of themeList) {
            themeCards.push(
                <ThemeCard key={tm} themeName={tm}
                    activeLight={this.state.front.theme === tm}
                    activeDark={this.state.front.darkTheme === tm}
                    changeTheme={this.changeTheme}
                    combine={!this.state.front.autoSelectTheme}/>
            );
        }

        if (this.state.front.autoSelectTheme) {
            result.push(
                <div key={12} className="selectable">
                    Using light theme <input maxLength={4}
                    placeholder={this.state.front.theme}
                    style={style} onChange={(e: any) => this.themeChangeHandler(e, 'light')} /> and
                    dark theme <input placeholder={this.state.front.darkTheme} maxLength={4}
                    style={style} onChange={(e: any) => this.themeChangeHandler(e, 'dark')} />.<br/>
                    Set a new light theme via the <p className="buttonSimul" style={{
                    padding: '0px 3px 0px 3px'}}><Icon icon="sun" size="13pt" stroke={borderColor}
                    fill={bgColor}/>
                    </p> buttons and a new dark theme via the <p className="buttonSimul"
                    style={{padding: '0px 3px 0px 3px'}}><Icon icon="moon" size="13pt"
                    stroke={borderColor} fill={bgColor}/></p> buttons
                    below.
                    <br/><br/>
                </div>
            );
        } else {
            result.push(
                <div key={12} className="selectable">
                    Using theme <input maxLength={4}
                    placeholder={this.state.front.theme}
                    style={style} onChange={(e: any) => this.themeChangeHandler(e, 'light')}/>.<br/>
                    Set a new theme via the <p className="buttonSimul" style={{
                    padding: '0px 3px 0px 3px'}}><Icon icon="sunmoon" size="13pt"
                    stroke={borderColor} fill={bgColor}/>
                    </p> buttons below.
                    <br/><br/>
                </div>
            );
        }
        result.push(
            // <CardDeck key={17}>
            //     {themeCards}
            // </CardDeck>
            <Container key={17}>
                {themeCards}
            </Container>
        )

        result.push(
                <div className="checkbox" key="d170">
                <label>
            <input type="checkbox" key={170} checked={this.state.front.autoSelectTheme}
                onChange={this.changeHandler('front', 'autoSelectTheme', true)}/>
                Try to detect a system-wide dark mode and correspondingly adjust the theme used.
                </label>
            </div>
        );
        if (!this.state.front.autoSelectTheme) {
            result.push(
                <div key={121} className="selectable">
                    Background color for erroneous code: <input type="color" value={this.state.front.errorColor}
                        onChange={this.colorChangeHandler('errorColor')}/><br/>
                    Background color for evaluated code: <input type="color" value={this.state.front.successColor1}
                        onChange={this.colorChangeHandler('successColor1')}/><br/>
                    Alternative background color for evaluated code: <input type="color"
                    value={this.state.front.successColor2}
                        onChange={this.colorChangeHandler('successColor2')}/><br /><br />
                    <button className="btn btn-dng-alt" onClick={this.resetColorsToDefault} type="button">
                        <span className="glyphicon glyphicon-repeat" /> Reset colors to theme default
                    </button>
                </div>
            );
        }

        result.push(
            <p key="b1">
            {' '}<br/ >
            </p>
        );

        return result;
    }

    private changeHandler(scope: string, property: string, needsReload: boolean = false) {
        return () => {
            this.setState((oldState) => {
                let deepCopy: any = this.deepCopy(oldState);
                deepCopy[scope][property] = !this.state[scope][property];
                return deepCopy;
            }, () => {
                this.saveState();
            });
            if (needsReload) {
                window.location.reload();
            }
        };
    }

    private colorChangeHandler(propName: string) {
        return (evt: React.ChangeEvent<HTMLInputElement>) => {
            let value = evt.target.value;
            this.setState((oldState) => {
                let deepCopy: any = this.deepCopy(oldState);
                deepCopy.front[propName] = value;
                return deepCopy;
            }, () => {
                this.saveState();
            });
        };
    }

    private timeoutChangeHandler(evt: React.ChangeEvent<HTMLInputElement>) {
        let value = parseInt(evt.target.value, 10);
        if (value < 0) {
            return;
        }
        this.setState((oldState) => {
            let deepCopy: any = this.deepCopy(oldState);
            deepCopy.front.timeout = Math.min(value, 10000000000);
            return deepCopy;
        }, () => {
            this.saveState();
        });
    }

    private timeDisplayChangeHandler(evt: React.ChangeEvent<HTMLInputElement>) {
        let value = parseInt(evt.target.value, 10);
        if (value < 0) {
            return;
        }
        this.setState((oldState) => {
            let deepCopy: any = this.deepCopy(oldState);
            deepCopy.inter.showUsedTimeWhenAbove = Math.min(value, 10000000000);
            return deepCopy;
        }, () => {
            this.saveState();
        });
    }

    private timeDisplayFlipHandler() {
        return () => {
            this.setState((oldState) => {
                let deepCopy: any = this.deepCopy(oldState);
                if (this.state.inter.showUsedTimeWhenAbove === 0) {
                    deepCopy.inter.showUsedTimeWhenAbove = -500;
                } else {
                    deepCopy.inter.showUsedTimeWhenAbove = -this.state.inter.showUsedTimeWhenAbove;
                }
                return deepCopy;
            }, () => {
                this.saveState();
            });
        };
    }

    private changeTheme(type: 'light' | 'dark', name: string) {
        let currentTheme = (type === 'light' ? this.state.front.theme : this.state.front.darkTheme);

        if (!getTheme(name, undefined) || name === currentTheme) {
            return;
        }
        this.setState((oldState) => {
            let deepCopy: any = this.deepCopy(oldState);
            if (type === 'light') {
                deepCopy.front.theme = name;
            } else {
                deepCopy.front.darkTheme = name;
            }
            return deepCopy;
        }, () => {
            this.saveState();
        });

        let themeIsDark = this.state.front.autoSelectTheme && window.matchMedia
            && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (type === (themeIsDark ? 'dark' : 'light')) {
            window.location.reload();
        }
    }

    private themeChangeHandler(evt: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') {
        let value = evt.target.value;

        if (!getTheme(value, undefined)
           || (type === 'light' && this.state.front.theme === value)
           || (type === 'dark' && this.state.front.darkTheme === value)) {
            return;
        }
        evt.target.value = '';
        this.changeTheme(type, value);
    }

    private deepCopy(json: any): any {
        return JSON.parse(JSON.stringify(json));
    }

    private saveState() {
        localStorage.setItem('interpreterSettings', JSON.stringify(this.state.inter));
        let inter = this.deepCopy(this.state.front);
        if (inter.timeout === null || isNaN(inter.timeout)) {
            inter.timeout = 5000;
        }
        localStorage.setItem('interfaceSettings', JSON.stringify(inter));
    }

}

export default Settings;
