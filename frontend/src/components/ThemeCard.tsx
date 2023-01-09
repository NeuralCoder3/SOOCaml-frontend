import * as React from 'react';
import { Card } from 'react-bootstrap';

import { getTheme, getColor } from '../theme';
import { getInterfaceSettings } from '../storage';
import Icon from './Icon';

interface Props {
    themeName: string;
    activeLight: boolean;
    activeDark: boolean;
    changeTheme: (type: 'light' | 'dark', name: string) => void;
    combine: boolean; // Combine light/dark theme buttons
}

class ThemeCard extends React.Component<Props, any> {
    render() {
        let theme = getTheme(this.props.themeName, undefined);
        if (theme === undefined) {
            return '';
        }
        let settings = getInterfaceSettings();
        let dt: string | undefined = settings.autoSelectTheme ? settings.darkTheme : undefined;
        let borderColor = getColor(settings.theme, dt, 'border');
        let bgColor = getColor(settings.theme, dt, 'background');
        let fgInvColor = getColor(settings.theme, dt, 'navbar_focus_fg');

        let lightButton = (
            <div className={this.props.activeLight ? 'btn btn-def-inv' : 'btn btn-def-alt'}
                style={{ padding: "0px 5px 2px 5px" }}
                onClick={(a: any) => this.props.changeTheme('light', this.props.themeName)}>
                <Icon icon='sun' size="16pt"
                    stroke={this.props.activeLight ? fgInvColor : borderColor}
                    fill={this.props.activeLight ? fgInvColor : bgColor} />
            </div>
        );
        let mixedButton = (
            <div className={this.props.activeLight ? 'btn btn-def-inv' : 'btn btn-def-alt'}
                style={{ padding: "0px 5px 2px 5px" }}
                onClick={(a: any) => this.props.changeTheme('light', this.props.themeName)}>
                <Icon icon='sunmoon' size="16pt"
                    stroke={this.props.activeLight ? fgInvColor : borderColor}
                    fill={this.props.activeLight ? fgInvColor : bgColor} />
            </div>
        );
        let darkButton = (
            <div className={this.props.activeDark ? 'btn btn-def-inv' : 'btn btn-def-alt'}
                style={{ padding: "0px 5px 2px 5px" }}
                onClick={(a: any) => this.props.changeTheme('dark', this.props.themeName)}>
                <Icon icon='moon' size="16pt"
                    stroke={this.props.activeDark ? fgInvColor : borderColor}
                    fill={this.props.activeDark ? fgInvColor : bgColor} />
            </div>
        );

        return (
            <Card>
                <div>
                    <div style={{
                        fontSize: "16px",
                        display: "inline-block",
                        paddingTop: "4px",
                        paddingLeft: "5px",
                        fontFamily: "monospace"
                    }}>{this.props.themeName}</div>
                    <div className="inlineBlock" style={{
                        marginTop: "-1px", marginRight: "-1px",
                        position: "relative",
                        display: "flex",
                        float: "right"
                    }}>
                        {this.props.combine ? mixedButton : lightButton}
                        {!this.props.combine ? (<div className="miniSpacer" />) : ''}
                        {!this.props.combine ? darkButton : ''}
                    </div>
                </div>
                <Card.Body style={{ paddingLeft: '0', paddingBottom: '0', paddingRight: '0' }}>
                    <div style={{
                        borderTop: '1px solid ' + getColor(settings.theme, dt, 'alert_fg'),
                        color: theme.foreground,
                        backgroundColor: theme.background,
                        paddingBottom: '1px'
                    }}>
                        <div style={{
                            padding: '5px 5px 0',
                            color: theme.navbar_fg,
                            backgroundColor: theme.navbar_bg
                        }}>
                            <Icon icon="sosml" stroke={theme.icon_bg}
                                fill={theme.icon_fg} size="24px" />
                            <span style={{ verticalAlign: "middle", fontSize: "12.5pt", fontFamily: "monospace" }}><b> SOOCaml
                            </b></span>
                        </div>
                        <div style={{
                            padding: '5px',
                            margin: '5px',
                            color: theme.alert_fg,
                            backgroundColor: theme.alert_bg,
                            border: '1px solid ' + theme.alert_border
                        }}>
                            <div style={{
                                float: 'right',
                                fontSize: "9pt",
                                color: theme.btn_dng_fg,
                                backgroundColor: theme.btn_dng_bg,
                                border: '1px solid ' + theme.btn_dng_border,
                                padding: '1px 2px',
                                marginTop: '-6px',
                                marginRight: '-6px',
                                fontFamily: 'monospace',
                            }}>
                                Btn
                            </div>
                            <div style={{
                                float: 'right',
                                fontSize: "9pt",
                                color: theme.btn_pri_fg,
                                backgroundColor: theme.btn_pri_bg,
                                border: '1px solid ' + theme.btn_pri_border,
                                padding: '1px 2px',
                                marginTop: '-6px',
                                marginRight: '6px',
                                fontFamily: 'monospace',
                            }}>
                                Btn
                            </div>
                            <div style={{
                                float: 'right',
                                fontSize: "9pt",
                                color: theme.btn_suc_fg,
                                backgroundColor: theme.btn_suc_bg,
                                border: '1px solid ' + theme.btn_suc_border,
                                padding: '1px 2px',
                                marginTop: '-6px',
                                marginRight: '6px',
                                fontFamily: 'monospace',
                            }}>
                                Btn
                            </div>

                            Alert
                        </div>
                        <div style={{
                            margin: '5px',
                            border: '1px solid ' + theme.border,
                            fontFamily: 'monospace'
                        }}>
                            <div style={{
                                backgroundColor: theme.success,
                                paddingLeft: '5px'
                            }}><span style={{ color: theme.cm_builtin }}>print
                                </span> <span style={{ color: theme.cm_string }}>"{this.props.themeName}"</span>;</div>
                            <div style={{
                                backgroundColor: theme.success_alt,
                                paddingLeft: '5px'
                            }}><span style={{ color: theme.cm_comment }}>(* Comment *)</span>;</div>
                            <div style={{
                                backgroundColor: theme.error,
                                paddingLeft: '5px'
                            }}><span style={{ color: theme.cm_keyword }}><b>val</b>
                                </span> <span style={{ color: theme.cm_variable }}>x
                                </span> <span style={{ color: theme.cm_keyword }}>*
                                </span> <span style={{ color: theme.cm_number }}>10</span>;</div>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    }
}

export default ThemeCard;
