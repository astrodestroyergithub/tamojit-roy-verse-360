let page=0;

async function load(){
 const res=await fetch(`/.netlify/functions/get-humans?page=${page}`);
 const data=await res.json();

 const table=document.getElementById("table");
 table.innerHTML="";

 data.forEach(r=>{
  const tr=document.createElement("tr");
  Object.values(r).forEach(v=>{
   const td=document.createElement("td");
   td.textContent=v;
   tr.appendChild(td);
  });
  table.appendChild(tr);
 });
}

function next(){page++;load();}
load();
