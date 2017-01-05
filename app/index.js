const {remote} = require('electron');
const win = remote.getCurrentWindow();
const path = require('path');
const iconv = require('iconv-lite');
const isWin = /^win/.test(process.platform);
const {killProcessById} = require('./node-kill-process');
const {spawn} = require('child_process');
const {fork} = require('child_process');
let config,actedBtn,actItem,actCfg;
const fr = document.createDocumentFragment();
const optBtns = document.querySelector('#opt_btns');
const content = document.querySelector('#out');
const list = document.querySelector('#list');
const title = document.querySelector('#title');
const detail = document.querySelector('.detail');
const detailNav = document.querySelector('.cn');
const cLis = document.querySelector('#cLis .s');
detail.content = detail.querySelector('.s');
list.load = loadList;
cLis.load = function () {
  cLis.innerHTML = '';
  config.n.forEach((c) => {
    let isAct = c === detail.content._cfg && ' act' || '';
  const node = document.createElement('div');
  if (isAct) cLis.act = node;
  node.className = 'cl' + isAct;
  node.appendChild(document.createElement('div')).textContent = c.name;
  node.cfg = c;
  node.onclick = function () {
    if (cLis.act !== node) {
      if (cLis.act) cLis.act.className = 'cl';
      (cLis.act = node).className = 'cl act';
      cfgPanel.load(node.cfg);
    }
  }
  fr.appendChild(node);
});
  cLis.appendChild(fr);
}
{
  let sly1 = detail.style;
  let sly2 = detailNav.style;
  sly1.left = '-50em';
  sly2.right = '-31em';
  sly1.display = 'block';
  sly2.display = 'block';
  sly1.width = document.body.offsetWidth - detailNav.offsetWidth + 'px';
}
const createCMDInput = function (o) {
  const btns = detail.content.cfg.btns;
  let idx = btns.indexOf(o);
  if (idx === -1) btns.push(o);
  let node = document.createElement('div');
  node.className = 'field';
  let l = node.appendChild(document.createElement('label'));
  node.appendChild(document.createElement('b')).onclick = function () {
    idx = btns.indexOf(o);
    if (idx !== -1) btns.splice(idx,1);
    node.parentNode.removeChild(node);
  };
  l.textContent = 'CMD'
  node.appendChild(createInput('名称',o,'name'));
  node.appendChild(createInput('执行位置',o,'cwd'));
  node.appendChild(createInput('命令',o,'cmd'));
  return node;
}
const createDeployInput = function (o) {
  const btns = detail.content.cfg.btns;
  let idx = btns.indexOf(o);
  if (idx === -1) btns.push(o);
  o = o || {};
  let node = document.createElement('div');
  node.className = 'field';
  let l = node.appendChild(document.createElement('label'));
  node.appendChild(document.createElement('b')).onclick = function () {
    idx = btns.indexOf(o);
    if (idx !== -1) btns.splice(idx,1);
    node.parentNode.removeChild(node);
  };
  l.textContent = 'DEPLOY'
  let s = o.server;
  node.appendChild(createInput('名称',o,'name'));
  node.appendChild(createInput('本地相对目录',o,'cwd'));
  node.appendChild(createInput('主机',s,'host'));
  node.appendChild(createInput('远程相对目录',s,'remotePath'));
  node.appendChild(createInput('端口',s,'port'));
  node.appendChild(createInput('用户',s,'user'));
  node.appendChild(createInput('密码',s,'pass','password'));
  node.appendChild(createPathLisArea('上传文件列表[使用glob语法]',o,'local'));
  return node;
}
const createPathLisArea = function (name,o,key) {
  let node = document.createElement('div');
  node.className = 'f path';
  node.cfg = o = o || {};
  let input = node.appendChild(document.createElement('textArea'))
  node.appendChild(document.createElement('i'));
  node.appendChild(document.createElement('i'));
  node.appendChild(document.createElement('i'));
  node.appendChild(document.createElement('i'));
  let label = node.appendChild(document.createElement('label'));
  input.onblur = function () {
    let v = input.value.replace(/ +/g,'');
    v = v.replace(/[\n,;\r]+/,',')
    if (v) input.dataset.v = v;
    else delete input.dataset.v;
    input.value = v.replace(/[\n,;]+/g,'\n');
    node.cfg[key] = v.split(/[\n,;]/);
  }
  Object.defineProperties(node,{
    value: {
      get(){
        return input.value
      },
      set(v){
        if (Array.isArray(v)) v = v.join('\n');
        input.value = v;
        input.onblur();
      },
    },
    label: {
      get(){
        return label.textContent
      },
      set(v){
        label.textContent = v
      }
    }
  });
  node.key = key;
  node.cfg = o || {};
  node.value = o && o[key];
  node.label = name;
  return node;
}
const createInput = function (name,o,key,type) {
  let node = document.createElement('div');
  node.className = 'f';
  node.cfg = o = o || {};
  let input = node.appendChild(document.createElement('input'))
  node.appendChild(document.createElement('i'));
  let label = node.appendChild(document.createElement('label'));
  input.type = type || 'text';
  input.onblur = function () {
    let v = input.value;
    v = v.replace(/^\s+|\s+$/g,'');
    if (v) input.dataset.v = v;
    else delete input.dataset.v;
    node.cfg[key] = v;
  }
  Object.defineProperties(node,{
    value: {
      get(){
        return input.value
      },
      set(v){
        input.value = v;
        input.onblur();
      },
    },
    label: {
      get(){
        return label.textContent
      },
      set(v){
        label.textContent = v
      }
    }
  });
  node.key = key;
  node.cfg = o || {};
  node.value = o && o[key];
  node.label = name;
  return node;
}
const cfgPanel = {
  detail: detail,
  nav: detailNav,
  show() {
    this.isShow = 1;
    list.hide();
    list.choose.className = '';
    detail.style.left = 0;
    detailNav.style.right = 0;
    cLis.load();
  },
  hide() {
    this.isShow = 0;
    detail.style.left = '-' + detail.style.width;
    detailNav.style.right = '-11em';
  },
  load(o) {
    if (!o) o = {
      name: '新建配置',
      btns: []
    }
    detail.content._cfg = o;
    o = JSON.parse(JSON.stringify(o))
    detail.content.cfg = o;
    fr.innerHTML = '';
    [createInput('配置名称',o,'name')].concat(o.btns.map(
        (cfg) => ('cmd' in cfg && createCMDInput(cfg)) || (cfg.server && createDeployInput(cfg))
    )).forEach((el) => fr.appendChild(el));
    detail.content.innerHTML = '';
    detail.content.appendChild(fr);
  }
};
cfgPanel.hide();
function getId() {
  return (+((Date.now() - 1483091713196 + Math.random()) * 10000).toFixed()).toString(32);
}
const event = {
  add_c(){
    cfgPanel.load();
  },
  del_c(e){
    e.stopPropagation();
    let cfg = this.parentNode.cfg || detail.content._cfg;
    const cfgLis = config.n;
    const idx = cfgLis.indexOf(cfg);
    if (idx !== -1) {
      if (idx < config.a) config.a--;
      cfgLis.splice(idx,1);
      if (this.className === "delete") this.parentNode.removeChild(this);
      else {
        delete detail.content._cfg;
        delete detail.content.cfg;
        detail.content.innerHTML = '';
      }
      refresh();
      writeCfg();
    }
  },
  save_c(){
    const o2 = detail.content.cfg; // new
    const o1 = detail.content._cfg; //el
    o1.name = o2.name;
    o2.btns.forEach((c) => {
      let b,el,btns = o1.btns;
    for (let i = 0,l = btns.length; i < l; i++) {
      b = btns[i];
      el=null;
      if (b.id === c.id) {
        btns.splice(i,1);
        el = b.el;
        if(el){
          el.cfg = c;
          el.textContent = c.name;
        }
        break;
      }
    }
    Object.defineProperty(c,'el',{
      value: el,
      enumerable: false,
      writable: true
    })
  })
    o1.btns = o2.btns;
    if (actCfg === o1) cfgPanel.load(o1);
    else if (config.n.indexOf(o1) === -1) config.n.push(o1);
    refresh();
  },
  flush(){
    cfgPanel.load(detail.content._cfg);
  },
  new_cmd(){
    const o = {
      id: getId(),
      name: '',
      cwd: '',
      cmd: ''
    };
    detail.content.cfg.btns.push(o)
    detail.content.appendChild(createCMDInput(o)).scrollIntoViewIfNeeded();
  },
  new_deploy(){
    const o = {
      id: getId(),
      name: '',
      cwd: '',
      local: [
        'public/style/**/*_all.min.css',
        'template/**/*.html',
        'public/dist/js/**/*.js',
        '!public/dist/js/r.js',
        'public/dist/js/config*.js'
      ],
      server: {
        host: '',
        port: 22,
        pass: '',
        user: '',
        remotePath: ''
      }
    };
    detail.content.cfg.btns.push(o)
    detail.content.appendChild(createDeployInput(o)).scrollIntoViewIfNeeded();
  },
  back(){
    cfgPanel.hide()
  },
  add_cfg(){
    cfgPanel.load();
    cfgPanel.show();
  },
  clean_curr(){
    (content.out) && (content.out.innerHTML = '');
  },
  choose(){
    if (cfgPanel.isShow)return;
    list.choose = this;
    if (this.className === 'act') {
      list.hide();
      this.className = '';
    } else {
      this.className = 'act'
      list.show();
    }
  },
  kill_curr(){
    let c = content,t;
    c = c.out;
    t = c && (c.target);
    t && (t._stop = true);
    if (t && t.process) {
      killProcessById(t.process.pid)
      delete c.process;
      setTimeout(() => {
        let out = content.out;
      out.appendChild(document.createElement('pre')).textContent = '\n\n---已停止---\n\n';
      out.scrollTop = out.scrollHeight + 1;
    },300);
    }
    t && (t.dataset.state = '');
  },
  run_curr(){
    let c = content;
    c && (c = c.out);
    if (c && (c = c.target)) {
      if (c.dataset.state === 'run') kill_curr();
      delete c.dataset.state;
      delete content.out
      c.onclick({target: c});
    }
  },
  min_win(){
    win.minimize();
  },
  close_win(){
    win.close();
  }
}
Object.keys(event).forEach((id) => {
  document.querySelector('#' + id).onclick = event[id]
});
{
  let sly;
  list.list = list.querySelector('div');
  list.show = function () {
    sly.top = 0;
  };
  list.hide = function () {
    sly.top = -list.offsetHeight - 100 + 'px';
  };
  sly = list.style;
  sly.display = 'none';
  sly.top = -9999 + 'px';
  sly.display = 'block';
  list.hide();
}
optBtns.load = function () {
  fr.innerHTML = '';
  const btnLis = actCfg.btns || [];
  btnLis.forEach((b) => {
    if (b.el) fr.appendChild(b.el);
  else fr.appendChild(createBtn(b));
});
  optBtns.innerHTML = '';
  optBtns.appendChild(fr);
}

function readCfg() {
  let cfg = localStorage.getItem('cfg');
  cfg&&(cfg=JSON.parse(cfg))||(cfg={a:0,n:[]})&&localStorage.setItem('cfg',JSON.stringify(cfg));
  config = cfg;
}
function writeCfg() {
  localStorage.setItem('cfg',JSON.stringify(config))
}
function createBtn(o) {
  let node = document.createElement('button');
  node.cfg = o;
  node.textContent = o.name;
  node.onclick = function (e) {
    const cfg = this.cfg;
    if (cfg.cmd) exec(e,cfg.cmd,cfg.cwd);
    else if (cfg.server) upload(e,cfg.cwd,cfg.local,cfg.server)
  }
  node.reload = function () {
    node.textContent = node.cfg.name;
    const btns = actCfg.btns;
    for (let i = 0,l = btns.length; i < l; i++) {
      if (btns[i] === node.cfg)return;
    }
    node.cfg.el = null;
    const out = node.outPut;
    if (out && content.contains(out)) {
      content.removeChild(out);
    }
    node.parentNode.removeChild(node);
    node = null;
  }
  Object.defineProperty(o,'el',{
    enumerable: false,
    writable: true,
    value: node
  })
  return node;
}
function activeCfg() {
  let o = config.n[config.a || 0];
  if (!o) {
    title.textContent = '';
    actCfg = {};
    optBtns.innerHTML = '';
  } else {
    actCfg = o;
    title.textContent = o.name;
    optBtns.load();
  }
}
function isActiveOut(e) {
  const target = e.target;
  if (actedBtn) actedBtn.className = '';
  (actedBtn = target).className = 'act';
  let outPut = target.outPut;
  if (!outPut) {
    (outPut = target.outPut = content.appendChild(document.createElement('div'))).className = 'out';
    outPut.target = target;
  }
  let c;
  if ((c = content.out) !== outPut) {
    if (c) c.style.display = 'none';
    (content.out = outPut).style.display = '';
    if (target.dataset.state !== undefined)return true;
    outPut.innerHTML = '';
    target.dataset.state = 'run';
  } else return true;
}
function print(str,target) {
  let p = document.createElement('pre');
  p.textContent = str
  target.appendChild(p);
  let children = target.childNodes;
  if (children.length >= 800) target.removeChild(children[0])
  if (target.scrollHeight) target.scrollTop = target.scrollHeight + 1;
}
function buffer2GBK(buffer) {
  return iconv.decode(new Buffer(buffer),'GBK')
}
function exec(e,cmd,cwd) {
  if (isActiveOut(e)) return;
  const outPut = content.out;
  let args = cmd.split(/ +/g);
  let _cmd = args[0];
  args = args.slice(1);
  if (isWin) {
    args.unshift('/c',_cmd);
    _cmd = process.env.COMSPEC || 'cmd.exe';
  }
  let terminal = outPut.target.process = spawn(_cmd,args,{
    cwd: cwd
  });
  const out = function (buffer) {
    print(buffer2GBK(buffer),outPut);
  };
  return new Promise((resolve,reject) => {
    terminal.on('error',(err) => {
    e.target.dataset.state = '';
  delete e.target.process;
  reject(err);
});
  terminal.on('exit',() => {
    resolve();
  e.target.dataset.state = '';
  delete e.target.process;
});
  terminal.stdout.on('data',out.bind(process.stdout));
  terminal.stderr.on('data',out.bind(process.stderr));
})
}
function upload(e,cwd,local,server) {
  if (isActiveOut(e)) return;
  const outPut = content.out;
  print(server.host + '\n' + server.remotePath,outPut);
  const btn = outPut.target;
  const terminal = btn.process = fork(path.join(__dirname,'./deploy.js'),{
    silent: true
  })
  const out = function (buffer) {
    print(buffer2GBK(buffer),outPut);
  };
  terminal.on('error',() => {
    btn.dataset.state = '';
  delete btn.process;
});
  terminal.on('exit',() => {
    btn.dataset.state = '';
  delete btn.process;
});
  terminal.on('message',function (m) {
    if (m === 'end') {
      if (btn.process) {
        killProcessById(btn.process.pid);
        btn.dataset.state = '';
        delete btn.process;
      }
    }
  });
  terminal.stdout.on('data',out.bind(process.stdout));
  terminal.stderr.on('data',out.bind(process.stderr));
  terminal.send({
    paths: local.map((o) => path.join(cwd,o)),
    server: server,
    base: cwd
})
}
function loadList() {
  if (Array.isArray(config.n)) {
    let _list = list.list;
    _list.innerHTML = '';
    config.n.forEach((item,i) => {
      let n = document.createElement('div');
    n.index = i;
    n.cfg = item;
    n.className = 'l' + (config.a === i ? ' act' : '');
    n.textContent = item.name;
    n.onclick = function () {
      if (actItem !== n) {
        if (actItem) actItem.className = 'l';
        (actItem = n).className = 'l act';
        delete content.out;
        [].forEach.call(document.querySelectorAll('.nav button'),(btn) => {
          if (btn.process) killProcessById(btn.process.pid);
        delete btn.dataset.state;
        btn.className = '';
      });
        config.a = n.index;
        writeCfg();
        activeCfg();
        list.hide();
      }
    }
    let edit,del;
    (del = n.appendChild(document.createElement('i'))).className = 'delete';
    (edit = n.appendChild(document.createElement('i'))).className = 'edit edit_cfg';
    edit.onclick = function (e) {
      e.stopPropagation();
      cfgPanel.load(n.cfg);
      cfgPanel.show();
    }
    del.onclick = event.del_c;
    _list.appendChild(n);
  });
  }
  list.hide();
}
const refresh = function () {
  cLis.load();
  list.load();
  writeCfg();
  activeCfg();
}
readCfg();
activeCfg();
loadList();