let page = 0;

/* ===== DOB FORMATTER ===== */
function formatDate(dob){
    if(!dob) return "";
    const d = new Date(dob);
    if(isNaN(d)) return dob;

    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

/* ===== LOAD DATA ===== */
async function load(){

    const res = await fetch(`/.netlify/functions/get-humans?page=${page}`);
    const data = await res.json();

    /* ⭐ Sort latest → oldest */
    data.sort((a,b)=> new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const tbody = document.getElementById("tableBody");

    /* Clear only body (not header) */
    tbody.innerHTML = "";

    data.forEach((r,index)=>{

        const tr = document.createElement("tr");

        /* ⭐ Natural Id */
        const id = page*data.length + index + 1;

        /* ⭐ Map only required columns */
        const cells = [
            id,
            r.name,
            formatDate(r.dob),
            r.gender,
            r.address
        ];

        cells.forEach(v=>{
            const td=document.createElement("td");
            td.textContent = v ?? "";
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

/* ===== INITIAL ===== */
load();