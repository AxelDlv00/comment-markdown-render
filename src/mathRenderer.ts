import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: AllPackages });
const svg = new SVG({ fontCache: 'none' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

export function renderToSVG(mathString: string, isBlock: boolean, color: string): { svgHtml: string } {
    const node = html.convert(mathString, { display: isBlock });
    const svgNode = adaptor.firstChild(node);
    
    let svgHtml = adaptor.outerHTML(svgNode as any);
    svgHtml = svgHtml.replace(/currentColor/g, color);
    
    return { svgHtml };
}