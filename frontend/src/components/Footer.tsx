import React from "react";

type FooterProps = {
    statusText: string;
};

export default function Footer({ statusText }: FooterProps) {
        let footer: any;
        let width = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;

        const [_statusText, _setStatusText] = React.useState("SOOCaml is loading...");

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
        return (
            <div>
                <div className="leftfooter">
                    {statusText}
                    {footer}
                </div>
            </div>
        )
}
