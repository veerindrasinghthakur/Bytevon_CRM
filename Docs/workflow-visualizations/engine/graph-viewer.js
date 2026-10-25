
(function(){
var COLORS={client:"#64748b",route:"#3b82f6",service:"#22c55e",repository:"#f59e0b",model:"#a855f7",db:"#7c3aed","side-effect":"#ef4444",response:"#14b8c7",util:"#0ea5e9"};
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
function shortStep(s){return s.length>64?s.slice(0,61)+"...":s;}
function render(){
  var nodes=new vis.DataSet(graphData.nodes.map(function(n){
    return {id:n.id,label:(n.unresolved?"[?] ":"")+shortStep(n.business_step),
      color:{background:COLORS[n.layer]||"#475569",border:"#0f172a"},
      font:{color:"#fff",size:13},shape:"box",margin:8,
      title:esc(n.business_step)};
  }));
  var edges=new vis.DataSet(graphData.edges.map(function(e,i){
    var c=e.type==="triggers"?"#ef4444":e.type==="writes"?"#a855f7":e.type==="reads"?"#38bdf8":"#94a3b8";
    return {id:"e"+i,from:e.from,to:e.to,arrows:"to",color:{color:c},label:e.label||e.type||"",font:{color:c,size:11}};
  }));
  var net=new vis.Network(document.getElementById("graph"),{nodes:nodes,edges:edges},
    {layout:{hierarchical:{direction:"UD",sortMethod:"directed",nodeSpacing:140,levelSeparation:110}},
     physics:false,interaction:{hover:true,navigationButtons:true}});
  net.on("click",function(p){if(p.nodes.length)show(p.nodes[0]);});
  var tb=document.getElementById("nodetable");
  if(tb){tb.innerHTML="<tr><th>ID</th><th>Step</th><th>Layer</th><th>Ref</th></tr>"+graphData.nodes.map(function(n){
    return "<tr><td>"+n.id+"</td><td>"+esc(n.business_step)+(n.unresolved?' <span class="unres">[unresolved]</span>':"")+"</td><td>"+n.layer+"</td><td>"+esc(n.file||"")+(n.function?" :: "+esc(n.function):"")+(n.line?" :"+n.line:"")+"</td></tr>";}).join("");}
  window._net=net;
}
function show(id){
  var n=null;graphData.nodes.forEach(function(x){if(x.id===id)n=x;});
  if(!n)return;
  var h="<h2>"+n.id+" &middot; "+n.layer+"</h2><dl>";
  h+="<dt>Business step</dt><dd>"+esc(n.business_step)+"</dd>";
  h+="<dt>File</dt><dd>"+esc(n.file||"—")+"</dd>";
  h+="<dt>Function</dt><dd>"+esc(n.function||"—")+"</dd>";
  h+="<dt>Line</dt><dd>"+(n.line||"—")+"</dd>";
  if(n.table)h+="<dt>Table</dt><dd>"+esc(n.table)+"</dd>";
  if(n.unresolved)h+='<dt>Status</dt><dd class="unres">UNRESOLVED — '+esc(n.note||"")+"</dd>";
  h+="</dl>";
  document.getElementById("detail").innerHTML=h;
}
document.addEventListener("DOMContentLoaded",function(){
  if(window.vis){render();}
  else{document.getElementById("graph").innerHTML="<p style='padding:24px'>vis-network CDN failed to load (offline?). Node table below still shows the full trace.</p>";var tb=document.getElementById("nodetable");
    if(tb&&window.graphData){tb.innerHTML="<tr><th>ID</th><th>Step</th><th>Layer</th><th>Ref</th></tr>"+graphData.nodes.map(function(n){return "<tr><td>"+n.id+"</td><td>"+n.business_step+"</td><td>"+n.layer+"</td><td>"+(n.file||"")+"</td></tr>";}).join("");}}
});
})();
