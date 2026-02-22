import * as vscode from 'vscode';
import { renderToSVG } from './mathRenderer';

export function activate(context: vscode.ExtensionContext) {
    const blockEnds: { [key: string]: string } = {
        '/*': '*/', '"""': '"""', "'''": "'''", '/-': '-/'
    };

    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position) {
            const lineText = document.lineAt(position.line).text;
            const singleLineRegex = /^\s*(?:\/\/|#|--|;+|%|')\s*md[:\s]*/;
            const blockStartRegex = /(\/\*+|"""|'''|\/-)\s*md/;

            let markdownRaw: string | null = null;
            let foundBlock = false;

            if (singleLineRegex.test(lineText)) {
                let startLine = position.line;
                let endLine = position.line;
                while (startLine > 0 && singleLineRegex.test(document.lineAt(startLine - 1).text)) {startLine--;}
                while (endLine < document.lineCount - 1 && singleLineRegex.test(document.lineAt(endLine + 1).text)) {endLine++;}

                let lines = [];
                for (let i = startLine; i <= endLine; i++) {
                    lines.push(document.lineAt(i).text.replace(singleLineRegex, ''));
                }
                markdownRaw = lines.join('\n');
                foundBlock = true;
            } 

            if (!foundBlock) {
                let startLine = -1;
                let blockType = '';
                
                for (let i = position.line; i >= Math.max(0, position.line - 100); i--) {
                    const text = document.lineAt(i).text;
                    const match = text.match(blockStartRegex);
                    if (match) {
                        startLine = i;
                        
                        blockType = match[1].startsWith('/*') ? '/*' : match[1];
                        break;
                    }
                    
                    if (i < position.line && Object.values(blockEnds).some(e => text.includes(e))) {break;}
                }

                if (startLine !== -1) {
                    const endMarker = blockEnds[blockType];
                    let endLine = -1;

                    
                    for (let i = startLine; i < Math.min(document.lineCount, startLine + 100); i++) {
                        let text = document.lineAt(i).text;
                        
                        if (i === startLine) {
                            text = text.replace(blockStartRegex, '');
                        }

                        if (text.includes(endMarker)) {
                            endLine = i;
                            break;
                        }
                    }

                    if (endLine !== -1 && position.line <= endLine) {
                        let lines = [];
                        for (let i = startLine; i <= endLine; i++) {
                            let t = document.lineAt(i).text;
                            
                            
                            if (i === startLine) {t = t.replace(/^.*?\bmd[:\s]*/, '');}
                            if (i === endLine) {t = t.split(endMarker)[0];}
                            
                            t = t.replace(/^\s*\*\s?/, '');
                            lines.push(t);
                        }
                        markdownRaw = lines.join('\n').trim();
                    }
                }
            }

            if (!markdownRaw) {return null;}

            try {
                const isDark = vscode.window.activeColorTheme.kind !== vscode.ColorThemeKind.Light;
                const textColor = isDark ? '#cccccc' : '#333333';

                markdownRaw = markdownRaw.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, math) => {
                    const { svgHtml } = renderToSVG(math, true, textColor);
                    return `\n\n<p align="center"><img src="data:image/svg+xml;base64,${Buffer.from(svgHtml).toString('base64')}"></p>\n\n`;
                });

                markdownRaw = markdownRaw.replace(/\$([^\$\n]+)\$/g, (_, math) => {
                    const { svgHtml } = renderToSVG(math, false, textColor);
                    return `<img src="data:image/svg+xml;base64,${Buffer.from(svgHtml).toString('base64')}" style="vertical-align:middle;">`;
                });

                const mdContent = new vscode.MarkdownString(markdownRaw);
                mdContent.isTrusted = true;
                mdContent.supportHtml = true;
                return new vscode.Hover(mdContent);
            } catch (err) {
                console.error("Error rendering math:", err);
                return new vscode.Hover(new vscode.MarkdownString("**Error rendering markdown**"));
            }
        }
    });

    context.subscriptions.push(hoverProvider);
}

export function deactivate() {}