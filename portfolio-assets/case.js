(()=>{
  const canvas=document.getElementById('asset-demo');
  if(canvas){
    const ctx=canvas.getContext('2d');
    const data=[{name:'活期零钱',value:5000,cost:5000,color:'#34C759'},{name:'银行固收',value:18000,cost:17500,color:'#007AFF'},{name:'外币账户',value:12000,cost:11000,color:'#5856D6'},{name:'指数基金',value:10000,cost:9200,color:'#FF9500'},{name:'黄金储备',value:5000,cost:4200,color:'#FFCC00'}];
    let mode='value',selected=-1,slices=[];
    const legend=document.getElementById('ring-legend');
    const money=n=>'¥ '+new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0}).format(n);
    const value=d=>mode==='pnl'?Math.max(0,d.value-d.cost):d[mode];
    function draw(){
      if(!ctx)return;
      ctx.clearRect(0,0,600,600);
      const total=data.reduce((t,d)=>t+value(d),0),denominator=total||1;
      let angle=-Math.PI/2;slices=[];
      data.forEach((d,i)=>{
        const end=angle+2*Math.PI*value(d)/denominator;
        const outer=i===selected?236:220,inner=i===selected?136:143;
        if(end>angle){ctx.beginPath();ctx.arc(300,300,outer,angle,end);ctx.arc(300,300,inner,end,angle,true);ctx.closePath();ctx.fillStyle=d.color;ctx.save();ctx.shadowColor=d.color+'22';ctx.shadowBlur=12;ctx.fill();ctx.restore();ctx.strokeStyle='rgba(255,255,255,.96)';ctx.lineWidth=4;ctx.stroke();}
        slices.push({start:angle,end,index:i});angle=end;
      });
      document.getElementById('ring-label').textContent=selected<0?({value:'合计市值',cost:'合计投入',pnl:'合计正浮盈'}[mode]):data[selected].name;
      document.getElementById('ring-value').textContent=money(selected<0?total:value(data[selected]));
      document.getElementById('ring-share').textContent=selected<0?'5 个账户':(100*value(data[selected])/denominator).toFixed(1)+'% 占比';
      legend.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===selected));b.querySelector('[data-percentage]').textContent=(100*value(data[i])/denominator).toFixed(1)+'%';});
      document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    }
    data.forEach((d,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed','false');b.innerHTML='<span><i style="background:'+d.color+'" aria-hidden="true"></i>'+d.name+'</span><span data-percentage></span>';b.addEventListener('click',()=>{selected=selected===i?-1:i;draw();});legend.appendChild(b);});
    canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*600/rect.width-300,y=(e.clientY-rect.top)*600/rect.height-300,d=Math.hypot(x,y);if(d<143){selected=-1;draw();return;}if(d>236)return;let angle=Math.atan2(y,x);if(angle<-Math.PI/2)angle+=Math.PI*2;const hit=slices.find(s=>angle>=s.start&&angle<s.end);if(hit){selected=selected===hit.index?-1:hit.index;draw();}});
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;selected=-1;draw();}));
    document.getElementById('ring-reset').addEventListener('click',()=>{selected=-1;draw();});draw();
  }
  const range=document.getElementById('water-range');
  if(range){const update=()=>{const amount=Number(range.value),ratio=amount/2000;document.getElementById('water-arc').setAttribute('stroke-dasharray',`${Math.min(100,ratio*100)} 100`);document.getElementById('water-percent').textContent=Math.round(ratio*100)+'%';document.getElementById('water-output').textContent=amount.toLocaleString('zh-CN')+' / 2,000 ml';range.setAttribute('aria-valuetext',amount+'毫升，目标2000毫升');};range.addEventListener('input',update);update();}
  if('IntersectionObserver'in window){const links=[...document.querySelectorAll('.case-toc a')];const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)links.forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -65% 0px',threshold:0});document.querySelectorAll('.case-chapter').forEach(s=>obs.observe(s));}
})();
