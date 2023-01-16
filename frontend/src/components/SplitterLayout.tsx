/*
Copyright (c) 2016 Yang Liu <hi@zesik.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as React from 'react';

import Pane from './Pane';

function clearSelection() {
    // I don't care about IE 9/10/11.
    if (window.getSelection !== null) {
        let sel = window.getSelection();
        if (sel !== null && sel.empty) {
            sel.empty();
        } else if (sel !== null && sel.removeAllRanges) {
            sel.removeAllRanges();
        }
    } /* else if (document.selection) {
         document.selection.empty();
         } */
}

const DEFAULT_SPLITTER_SIZE = 4;

interface Props {
    customClassName: string;
    vertical: boolean;
    percentage: boolean;
    primaryIndex: number;
    primaryMinSize: number;
    secondaryInitialSize: number;
    secondaryMinSize: number;
    onUpdate: any;
    onDragStart: any;
    onDragEnd: any;
    onSecondaryPaneSizeChange: any;
    children: any[];
    splitterChildren: any[];
};

interface State {
    secondaryPaneSize: number;
    resizing: boolean;
}

class SplitterLayout extends React.Component<Props, State> {
    public static defaultProps = {
        customClassName: '',
        vertical: false,
        percentage: false,
        primaryIndex: 0,
        primaryMinSize: 0,
        secondaryInitialSize: undefined,
        secondaryMinSize: 0,
        onUpdate: null,
        onDragStart: null,
        onDragEnd: null,
        onSecondaryPaneSizeChange: null,
        children: [],
        splitterChildren: []
    };

    container: any;
    splitter: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            secondaryPaneSize: 0,
            resizing: false
        };

        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleSplitterMouseDown = this.handleSplitterMouseDown.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('touchend', this.handleMouseUp);
        document.addEventListener('touchmove', this.handleTouchMove);

        let secondaryPaneSize;
        if (typeof this.props.secondaryInitialSize !== 'undefined') {
            secondaryPaneSize = this.props.secondaryInitialSize;
        } else {
            const containerRect = this.container.getBoundingClientRect();
            let splitterRect;
            if (this.splitter) {
                splitterRect = this.splitter.getBoundingClientRect();
            } else {
                // Simulate a splitter
                splitterRect = { width: DEFAULT_SPLITTER_SIZE, height: DEFAULT_SPLITTER_SIZE };
            }
            secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
                left: containerRect.left + ((containerRect.width - splitterRect.width) / 2),
                top: containerRect.top + ((containerRect.height - splitterRect.height) / 2)
            }, false);
        }
        this.setState({ secondaryPaneSize });
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevState.secondaryPaneSize !== this.state.secondaryPaneSize && this.props.onSecondaryPaneSizeChange) {
            this.props.onSecondaryPaneSizeChange(this.state.secondaryPaneSize);
        }
        if (this.props.onUpdate && this.state.secondaryPaneSize !== prevState.secondaryPaneSize) {
            this.props.onUpdate(this.state.secondaryPaneSize);
        }
        if (prevState.resizing !== this.state.resizing) {
            if (this.state.resizing) {
                if (this.props.onDragStart) {
                    this.props.onDragStart();
                }
            } else if (this.props.onDragEnd) {
                this.props.onDragEnd();
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('touchend', this.handleMouseUp);
        document.removeEventListener('touchmove', this.handleTouchMove);
    }

    getSecondaryPaneSize(containerRect: any, splitterRect: any, clientPosition: any, offsetMouse: any) {
        let totalSize;
        let splitterSize;
        let offset;
        if (this.props.vertical) {
            totalSize = containerRect.height;
            splitterSize = splitterRect.height;
            offset = clientPosition.top - containerRect.top;
        } else {
            totalSize = containerRect.width;
            splitterSize = splitterRect.width;
            offset = clientPosition.left - containerRect.left;
        }
        if (offsetMouse) {
            offset -= splitterSize / 2;
        }
        if (offset < 0) {
            offset = 0;
        } else if (offset > totalSize - splitterSize) {
            offset = totalSize - splitterSize;
        }

        let secondaryPaneSize;
        if (this.props.primaryIndex === 1) {
            secondaryPaneSize = offset;
        } else {
            secondaryPaneSize = totalSize - splitterSize - offset;
        }
        let primaryPaneSize = totalSize - splitterSize - secondaryPaneSize;
        if (this.props.percentage) {
            secondaryPaneSize = (secondaryPaneSize * 100) / totalSize;
            primaryPaneSize = (primaryPaneSize * 100) / totalSize;
            splitterSize = (splitterSize * 100) / totalSize;
            totalSize = 100;
        }

        if (primaryPaneSize < this.props.primaryMinSize) {
            secondaryPaneSize = Math.max(secondaryPaneSize - (this.props.primaryMinSize - primaryPaneSize), 0);
        } else if (secondaryPaneSize < this.props.secondaryMinSize) {
            secondaryPaneSize = Math.min(totalSize - splitterSize - this.props.primaryMinSize, this.props.secondaryMinSize);
        }

        return secondaryPaneSize;
    }

    handleResize() {
        if (this.splitter && !this.props.percentage) {
            const containerRect = this.container.getBoundingClientRect();
            const splitterRect = this.splitter.getBoundingClientRect();
            const secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
                left: splitterRect.left,
                top: splitterRect.top
            }, false);
            this.setState({ secondaryPaneSize });
        }
    }

    handleMouseMove(e: any) {
        if (this.state.resizing) {
            const containerRect = this.container.getBoundingClientRect();
            const splitterRect = this.splitter.getBoundingClientRect();
            const secondaryPaneSize = this.getSecondaryPaneSize(containerRect, splitterRect, {
                left: e.clientX,
                top: e.clientY
            }, true);
            clearSelection();
            this.setState({ secondaryPaneSize });
        }
    }

    handleTouchMove(e: any) {
        this.handleMouseMove(e.changedTouches[0]);
    }

    handleSplitterMouseDown() {
        clearSelection();
        this.setState({ resizing: true });
    }

    handleMouseUp() {
        this.setState(prevState => (prevState.resizing ? { resizing: false } : null));
    }

    render() {
        let containerClasses = 'splitter-layout';
        if (this.props.customClassName) {
            containerClasses += ` ${this.props.customClassName}`;
        }
        if (this.props.vertical) {
            containerClasses += ' splitter-layout-vertical';
        }
        if (this.state.resizing) {
            containerClasses += ' layout-changing';
        }

        const children = React.Children.toArray(this.props.children).slice(0, 2);
        if (children.length === 0) {
            children.push(<div />);
        }
        const wrappedChildren = [];
        let primaryIndex = (this.props.primaryIndex !== 0 && this.props.primaryIndex !== 1) ? 0 : this.props.primaryIndex;
        if (this.props.vertical) {
            primaryIndex = 1 - primaryIndex;
        }
        for (let i = 0; i < children.length; ++i) {
            let primary = true;
            let size = undefined;
            if (children.length > 1 && i !== primaryIndex) {
                primary = false;
                size = this.state.secondaryPaneSize;
            }
            wrappedChildren.push(
                <Pane vertical={this.props.vertical} percentage={this.props.percentage} primary={primary} size={size}>
                    {children[i]}
                </Pane>
            );
        }

        return (
            <div className={containerClasses} ref={(c) => { this.container = c; }}>
                {wrappedChildren[0]}
                {wrappedChildren.length > 1 &&
                    (
                        <div
                            role="separator"
                            className="layout-splitter"
                            ref={(c) => { this.splitter = c; }}
                            onMouseDown={this.handleSplitterMouseDown}
                            onTouchStart={this.handleSplitterMouseDown}
                        >
                            {this.props.splitterChildren}
                        </div>
                    )
                }
                {wrappedChildren.length > 1 && wrappedChildren[1]}
            </div>
        );
    }
}

export default SplitterLayout;
