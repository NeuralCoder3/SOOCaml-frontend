import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import Editor from './Editor';
import Files from './Files';
import Wishes from './Wishes';
import Landing from './Landing';
import Settings from './Settings';
import FileIntermediate from './FileIntermediate';
import { getInterfaceSettings, wishingHidden } from '../storage';
import { renderTheme, getTheme } from '../theme';
// import ShareIntermediate from './ShareIntermediate';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import './RootPage.css';

class RootPage extends React.Component<any, any> {
    render() {
        let settings = getInterfaceSettings();
        let theme = renderTheme(getTheme(settings.theme, settings.autoSelectTheme ?
            settings.darkTheme : undefined));
        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;

        let footer: any;
        if (width < 600) {
            footer = (
                <div className="footer">
                    © 2022 <a href="https://github.com/SOSML">The SOSML developers</a> | <a
                        href="https://www.uni-saarland.de/footer/dialog/impressum.html">Imprint</a>
                </div>
            );
        } else {
            footer = (
                <div className="footer">
                    © 2022 <a href="https://github.com/SOSML">The SOSML Developers</a> | <a
                        href="https://github.com/SOSML/SOSML">Sources on GitHub</a> | <a
                            href="https://github.com/SOSML/SOSML/issues">File a Bug</a> | <a
                                href="https://www.uni-saarland.de/impressum">Imprint</a>
                </div>
            );
        }

        let wishes: any;
        if (!wishingHidden()) {
            wishes = (
                <Route path="/wishes" component={Wishes} />
            );
        } else {
            wishes = (
                <Route path="/wishes" component={Landing} />
            );
        }

        return (
            // <Router basename={ROUTE_BASENAME}>
            // TODO: handle using webpack
            // <Router basename={"/SOOCaml-frontend"}>
            <Router>
                <div className="rootPage">
                    <style>{theme}</style>
                    <MenuBar />
                    <Route exact={true} path="/" component={Landing} />
                    <Route path="/editor" component={Editor} />
                    <Route path="/files" component={Files} />
                    <Route path="/help" component={Landing} />
                    <Route path="/settings" component={Settings} />
                    {wishes}
                    <Route path="/file/:name" component={FileIntermediate} />
                    <Route path="/examplefile/:name" component={FileIntermediate} />
                    <Route path="/share/:hash" component={Editor} />
                    <Route path="/wishare/:hash" component={Wishes} />
                    {footer}
                </div>
            </Router >
        );
    }
}

export default RootPage;
