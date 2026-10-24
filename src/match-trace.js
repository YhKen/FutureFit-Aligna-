import {jdMatchTraceView} from './match-trace-panel.js';
if(typeof document!=='undefined'&&typeof document.querySelector==='function'&&document.head&&!document.querySelector('#match-trace-style')){const link=document.createElement('link');link.id='match-trace-style';link.rel='stylesheet';link.href='match-trace.css';document.head.insertBefore(link,document.querySelector('link[href="hr-polish.css"]'));}
if(typeof document!=='undefined'&&typeof document.querySelector==='function'&&document.head&&!document.querySelector('#jd-sankey-style')){const link=document.createElement('link');link.id='jd-sankey-style';link.rel='stylesheet';link.href='jd-sankey.css';document.head.insertBefore(link,document.querySelector('link[href="hr-polish.css"]'));}
export const matchTraceView=jdMatchTraceView;
