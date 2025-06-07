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
import Footer from './Footer';

class RootPage extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            statusText: ""
        };
    }

    render() {
        let settings = getInterfaceSettings();
        let theme = renderTheme(getTheme(settings.theme, settings.autoSelectTheme ?
            settings.darkTheme : undefined));

	/*
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
                        href="https://github.com/NeuralCoder3/SOOCaml-frontend">Sources on GitHub</a> | <a
                            href="https://github.com/NeuralCoder3/SOOCaml-frontend/issues/new">File a Bug</a> | <a
                                href="https://www.uni-saarland.de/impressum">Imprint</a>
                </div>
            );
        }
	*/

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

        const setStatusTextWrapper = (statusText: string) => {
            this.setState({ statusText: statusText });
        };

        return (
            // <Router basename={ROUTE_BASENAME}>
            // TODO: handle using webpack
            // <Router basename={"/SOOCaml-frontend"}>
            <Router basename={"/soocaml"}>
                <div className="rootPage">
                    <style>{theme}</style>
                    <MenuBar />
                    <Route exact={true} path="/" component={Landing} />
                    {/* <Route path="/editor" component={Editor} setStatusText={(statusText: string) => this.setState({ statusText: statusText })} /> */}
                    <Route path="/editor" render={(props) => <Editor {...props} setStatusText={setStatusTextWrapper} />} />
                    <Route path="/files" component={Files} />
                    <Route path="/help" component={Landing} />
                    <Route path="/settings" component={Settings} />
                    {wishes}
                    <Route path="/file/:name" component={FileIntermediate} />
                    <Route path="/examplefile/:name" component={FileIntermediate} />
                    <Route path="/share/:hash" component={Editor} />
                    <Route path="/wishare/:hash" component={Wishes} />
                    <Footer statusText={this.state.statusText} />
                </div>
            </Router >
        );
    }
}

export default RootPage;
