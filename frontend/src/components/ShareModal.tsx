import * as React from 'react';

import QRCode from './QRCode';
const Modal = require('react-bootstrap').Modal;

interface Props {
    error: boolean;
    link: string;
    closeCallback: () => void;
    formContractCallback: () => void;
    enocontract: boolean;
}

class ShareModal extends React.Component<Props, any> {
    constructor(props: Props) {
        super(props);

        this.closeShareModal = this.closeShareModal.bind(this);
        this.formContract = this.formContract.bind(this);
    }

    render() {
        const link = this.props.link.startsWith('http') ? this.props.link : 'https://' + this.props.link;
        if (!this.props.error) {
            let style: any = {};
            style.margin = '10px 0 0 0';
            return (
                <Modal show={true} onHide={this.closeShareModal}>
                    <Modal.Header closeButton={false}>
                        <Modal.Title>Share Link Creation Successful</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <QRCode link={link}/>
                        <div className="input-group">
                            <input type="text" className="form-control js-copytextarea"
                                value={link} readOnly={true}/>
                            <span className="input-group-btn">
                                <button className="btn btn-def-alt" onClick={this.copyShareLink} type="button">
                                    <span className="glyphicon glyphicon-copy" />
                                </button>
                            </span>
                        </div>
                        <p className="text-justify" style={style}>
                            Use the above link to share your code.<br/>
                            <b>Attention:</b> The link refers to a read-only version of your code.
                            To share a modified version of your code, please create a new share link.
                        </p>
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-def-alt" type="button"
                        onClick={this.closeShareModal}>Close</button>
                    </Modal.Footer>
                </Modal>
            );
        } else if (this.props.enocontract) {
            return (
                <Modal show={true} onHide={this.closeShareModal}>
                    <Modal.Header closeButton={false}>
                        <Modal.Title>Share Link Creation Failed</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Creating a share link for your code failed.<br/>
                        But I think only other <em>Magical Users</em> have the right to
                        criticize that.
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-suc-alt" type="button"
                        onClick={this.formContract}>Become a <em>Magical
                        User</em></button>
                        <button className="btn btn-def-alt" type="button"
                        onClick={this.closeShareModal}>Close</button>
                    </Modal.Footer>
                </Modal>
            );
        } else {
            return (
                <Modal show={true} onHide={this.closeShareModal}>
                    <Modal.Header closeButton={false}>
                        <Modal.Title>Share Link Creation Failed</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Creating a share link for your code failed.<br/>
                        Please try again later.
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-def-alt" type="button"
                        onClick={this.closeShareModal}>Close</button>
                    </Modal.Footer>
                </Modal>
            );
        }
    }

    formContract() {
        this.props.formContractCallback();
    }

    closeShareModal() {
        this.props.closeCallback();
    }

    copyShareLink() {
        let copyTextarea = document.querySelector('.js-copytextarea') as HTMLTextAreaElement;
        copyTextarea.select();
        document.execCommand('copy');
    }
}

export default ShareModal;
