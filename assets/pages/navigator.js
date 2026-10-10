import {Workspace,WorkspaceUI} from '../runtime.js';
import {mount} from '../navigator.js';
import {productLink} from '../shell.js';
const profile=Workspace.profile(new URLSearchParams(location.search).get('user')||Workspace.active()).id;
mount({select:document.getElementById('problemSelect'),result:document.getElementById('routeResult'),store:Workspace,profile});
document.querySelectorAll('main a[href]').forEach(a=>a.href=productLink(a.getAttribute('href'),profile));
