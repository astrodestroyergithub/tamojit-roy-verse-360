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

    const pagination=document.getElementById("pagination");
    const noResults=document.getElementById("noResults");
    const searchInfo=document.getElementById("searchInfo");

    let url = searchMode
        ? `/.netlify/functions/get-humans?page=${page}&q=${encodeURIComponent(searchQuery)}`
        : `/.netlify/functions/get-humans?page=${page}`;

    const res=await fetch(url);
    const {rows,count}=await res.json();

    total=count;

    const tbody=document.getElementById("tableBody");
    tbody.innerHTML="";
    noResults.textContent="";

    /* ⭐ NO RESULT STATE */
    if(!rows.length){

        document.getElementById("tableHead").innerHTML="";
        pagination.classList.add("hidden");
        document.getElementById("pageInfo").textContent="";

        if(searchMode){
            noResults.textContent="No such result(s) found!";
            searchInfo.textContent="0 total records found!";
        }

        return;
    }

    pagination.classList.remove("hidden");

    /* ===== KEYS ===== */
    let keys=Object.keys(rows[0]);
    keys=keys.filter(k=>!["sno","serial","sl","sr","id"].includes(k.toLowerCase()));
    keys=keys.filter(k=>k!=="first_name" && k!=="last_name");
    keys.pop();
    keys.unshift("full_name");
    keys.unshift("natural_id");

    buildHeader(keys);

    /* ===== ROWS ===== */
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

    /* ===== INFO ===== */
    const start=page*LIMIT+1;
    const end=Math.min(start+rows.length-1,total);
    document.getElementById("pageInfo").textContent=`Showing ${start}-${end} of ${total}`;

    if(searchMode)
        searchInfo.textContent=`${total} total records found!`;
    else
        searchInfo.textContent="";
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
        searchQuery="";
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
    t=setTimeout(doSearch,400);
});

load();
