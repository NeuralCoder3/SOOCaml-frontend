import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import Editor from './Editor';
import Files from './Files';
import Help from './Help';
import FileIntermediate from './FileIntermediate';
// import ShareIntermediate from './ShareIntermediate';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import './RootPage.css';

class RootPage extends React.Component<any, any> {
    constructor() {
        super();
    }

    render() {
        return (
            <Router>
                <div className="rootPage">
                    <MenuBar />
                    <Route exact={true} path="/" component={Editor} />
                    <Route path="/files" component={Files} />
                    <Route path="/help" component={Help} />

                    <Route path="/file/:name" component={FileIntermediate} />
                    <Route path="/examplefile/:name" component={FileIntermediate} />
                    <Route path="/share/:hash" component={Editor} />

                    <div className="footer">
                        © 2017 <a href="https://github.com/SOSML">The SOSML developers</a> | <a href="https://github.com/SOSML/SOSML">Sources on GitHub</a> | <a href="https://github.com/SOSML/SOSML/issues">Report a Bug</a>
                    </div>
                </div>
            </Router>);
    }
}

export default RootPage;
