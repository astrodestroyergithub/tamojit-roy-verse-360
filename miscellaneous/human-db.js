let page = 0;

/* ===== FORMAT DOB ===== */
function formatDate(dob){
    if(!dob) return "";
    const d = new Date(dob);
    if(isNaN(d)) return dob;

    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

/* ===== BUILD HEADER ===== */
function buildHeader(keys){

    const thead = document.getElementById("tableHead");
    thead.innerHTML="";

    const tr=document.createElement("tr");

    keys.forEach(k=>{
        const th=document.createElement("th");

        /* Pretty labels */
        let label=k
            .replaceAll("_"," ")
            .replace(/\b\w/g,c=>c.toUpperCase());

        th.textContent=label;
        tr.appendChild(th);
    });

    thead.appendChild(tr);
}

/* ===== LOAD ===== */
async function load(){

    const res = await fetch(`/.netlify/functions/get-humans?page=${page}`);
    let data = await res.json();

    if(!data.length) return;

    /* ⭐ Sort latest → oldest */
    data.sort((a,b)=> new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML="";

    /* ===== Determine columns dynamically ===== */

    const sample = data[0];
    let keys = Object.keys(sample);

    /* ⭐ Remove first serial-like column automatically */
    keys = keys.filter(k =>
        !["sno","serial","sl","sr","id"].includes(k.toLowerCase())
    );

    /* ⭐ Remove first_name & last_name (we will replace with full name) */
    keys = keys.filter(k => k!=="first_name" && k!=="last_name");

    /* ⭐ Remove last column automatically */
    keys.pop();

    /* ⭐ Insert computed columns */
    keys.unshift("full_name");
    keys.unshift("natural_id");

    /* ⭐ Build header only first time */
    if(page===0) buildHeader(keys);

    /* ===== Render rows ===== */
    data.forEach((r,index)=>{

        const tr=document.createElement("tr");

        const naturalId = page*data.length + index + 1;
        const fullName = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();

        keys.forEach(k=>{

            const td=document.createElement("td");

            if(k==="natural_id") td.textContent = naturalId;
            else if(k==="full_name") td.textContent = fullName;
            else if(k==="dob") td.textContent = formatDate(r[k]);
            else td.textContent = r[k] ?? "";

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

/* ===== PAGINATION ===== */
function next(){
    page++;
    load();
}

/* ===== INIT ===== */
load();