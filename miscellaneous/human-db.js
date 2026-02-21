let page = 0;
const LIMIT = 50;
let total = 0;
let searchMode = false;
let searchQuery = "";

/* ===== FORMAT DOB ===== */
function formatDate(dob){
    if(!dob) return "";
    const d = new Date(dob);
    if(isNaN(d)) return dob;
    return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

/* ===== HEADER ===== */
function buildHeader(keys){
    const thead = document.getElementById("tableHead");
    thead.innerHTML="";
    const tr=document.createElement("tr");
    keys.forEach(k=>{
        const th=document.createElement("th");
        th.textContent=k.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
        tr.appendChild(th);
    });
    thead.appendChild(tr);
}

/* ===== LOAD ===== */
async function load(){

    let url;

    if(searchMode)
        url=`/.netlify/functions/get-humans?page=${page}&q=${encodeURIComponent(searchQuery)}`;
    else
        url=`/.netlify/functions/get-humans?page=${page}`;

    const res=await fetch(url);
    const {rows,count}=await res.json();

    total=count;

    const tbody=document.getElementById("tableBody");
    tbody.innerHTML="";

    if(!rows.length) return;

    let keys=Object.keys(rows[0]);

    keys=keys.filter(k=>!["sno","serial","sl","sr","id"].includes(k.toLowerCase()));
    keys=keys.filter(k=>k!=="first_name" && k!=="last_name");
    keys.pop();
    keys.unshift("full_name");
    keys.unshift("natural_id");

    buildHeader(keys);

    rows.forEach((r,index)=>{
        const tr=document.createElement("tr");
        const naturalId=page*LIMIT + index + 1;
        const fullName=`${r.first_name??""} ${r.last_name??""}`.trim();

        keys.forEach(k=>{
            const td=document.createElement("td");
            if(k==="natural_id") td.textContent=naturalId;
            else if(k==="full_name") td.textContent=fullName;
            else if(k==="dob") td.textContent=formatDate(r[k]);
            else td.textContent=r[k]??"";
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    /* page info */
    const start=page*LIMIT+1;
    const end=Math.min(start+rows.length-1,total);
    document.getElementById("pageInfo").textContent=`Showing ${start}-${end} of ${total}`;
}

/* ===== NAV ===== */
function next(){
    if((page+1)*LIMIT>=total) return;
    page++; load();
}
function prev(){
    if(page===0) return;
    page--; load();
}

/* ===== SEARCH ===== */
function doSearch(){
    const v=document.getElementById("searchInput").value.trim();
    page=0;
    if(!v){
        searchMode=false;
        document.getElementById("searchInfo").textContent="";
    }else{
        searchMode=true;
        searchQuery=v;
    }
    load();
}

/* debounce */
let t;
document.getElementById("searchInput").addEventListener("input",()=>{
    clearTimeout(t);
    t=setTimeout(doSearch,500);
});

load();
