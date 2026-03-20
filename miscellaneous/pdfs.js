const pdfFiles=[
 "ANNEXURE_A_ADVT_ER_01_2016.pdf",
 "Delivery_Management_System_Assignment.pdf",
 "FUNNY RESUME.pdf",
 "N42524022556.pdf",
 "N62524022556.pdf",
 "N92524022556.pdf",
 "PROJECT_ENGINEER_C-DACK_COCP_2025_01.pdf",
 "Roy_Tamojit_Resume_02.02.2026.pdf",
 "RRB GROUP-D PAYMENT SUCCESS RECEIPT.pdf",
 "RRB SECTION CONTROLLER 12 FEB 2026 ADMIT CARD.pdf",
 "Tamojit_Roy_Resume (1).pdf",
 "Tamojit_Roy_Resume (2).pdf",
 "Tamojit_Roy_Resume (3).pdf",
 "Tamojit_Roy_Resume.pdf",
 "RBI_Assistant_Application_Fee_Payment_Details_5th_March_2026.pdf",
 "RBI_Assistant_Application_Payment_Success_Receipt_5th_March_2026.pdf",
 "RBI_Assistant_Application_Printout_5th_March_2026.pdf",
 "RBI_Assistant_Application_Tax_Invoice_5th_March_2026.pdf",
 "RRB NTPC 22 MAR 2026 ADMIT CARD.pdf"
];

function loadPDFs(){

 const container=document.getElementById("pdfContainer");

 pdfFiles.forEach(file=>{

  const card=document.createElement("div");
  card.className="pdf-card";

  const title=document.createElement("div");
  title.className="pdf-title";
  title.textContent=file;

  const iframe=document.createElement("iframe");
  iframe.className="pdf-viewer";
  iframe.src=`pdfs/${file}`;

  card.appendChild(title);
  card.appendChild(iframe);

  container.appendChild(card);

 });
}

loadPDFs();
