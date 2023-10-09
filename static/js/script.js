// Function to update the textarea with the variable value
// async function updateTextArea() {
//     try {
//         const response = await fetch('/getocr');
//         const data = await response.json();
//         document.getElementById('ocrText').value = data.ocr_text;
//     } catch (error) {
//         console.error(error);
//     }
// }
const pdfchk = document.getElementById('pdf-check');
const ocrchk = document.getElementById('ocr-check');
const transchk = document.getElementById('trans-check');

const pdfbox = document.getElementById('pdf-pills');
const ocrbox = document.getElementById('ocr-pills');
const transbox = document.getElementById('translation-pills');

pdfchk.addEventListener('change', (e) => {
    if(pdfchk.checked == true){
        pdfbox.classList.remove('d-none');
    }
    else{
        pdfbox.classList.add('d-none');
    }
})

ocrchk.addEventListener('change', (e) => {
    if(ocrchk.checked == true){
        ocrbox.classList.remove('d-none');
    }
    else{
        ocrbox.classList.add('d-none');
    }
})

transchk.addEventListener('change', (e) => {
    if(transchk.checked == true){
        transbox.classList.remove('d-none');
    }
    else{
        transbox.classList.add('d-none');
    }
})


var textArea = document.getElementById("ocrText");
textArea.addEventListener("change", (e) => {
if(textArea.value.trim() != ''){
    if (document.getElementById("submitBtn").disabled == false){
        if (!document.getElementById('translateBtn')){
        tran = document.createElement("button");
        tran.type = "button"
        tran.id = "translateBtn"
        tran.classList.add("btn")
        tran.classList.add("btn-success")
        tran.innerHTML = "Translate to English";
        // if (document.getElementById('translateBtn')){
        //     elem = document.getElementById('translateBtn');
        //     elem.parentNode.removeChild(elem)
        // }
        document.getElementById("tranDiv").appendChild(tran);
        translate_btn_press = document.getElementById("translateBtn").addEventListener("click", sendDataToTranslate);
    }
    }
}
else{
    elem = document.getElementById("translateBtn")
    elem.parentNode.removeChild(elem);
}
});

const fileSelect = document.getElementById("fileSelect");
const fileElem = document.getElementById("pdfFile");

fileSelect.addEventListener(
  "click",
  (e) => {
    if (fileElem) {
      fileElem.click();
    }
  },
  false,
);

fileElem.addEventListener(
    "change", (e) => {
        var pdfFileInput = document.getElementById("pdfFile");
        var pdfFile = pdfFileInput.files[0];
        console.log(pdfFile.name)
        if(pdfFile){
            document.getElementById("fileSelect").innerHTML = "<mark style=\"background-color: beige;\">" + pdfFile.name + "</mark>";
        }
    },
    false,
);

document.getElementById("cancelBtn").addEventListener("click", function() {
    fetch('/cancel_task',{
        method: 'POST',
        body: {},
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").textContent = data.message;
        hideLoading();
        document.getElementById("submitBtn").disabled = false;
        if (document.getElementById('translateBtn')){
            document.getElementById('translateBtn').disabled = false;
        }
    });
});

const loader = document.getElementById("animation");
        
// showing loading
   function displayLoading() {
    loader.innerHTML=`<div class="spinner-border" role="status" style="z-index:1; position:absolute;">
    <span class="visually-hidden">Loading...</span>
  </div>`;
        // loader.classList.add("loading");
       // to stop loading after some time
    //    setTimeout(() => {
    //        loader.classList.remove("display");
    //    }, 3000);
   }


// hide loading
   function hideLoading() {
    loader.innerHTML="";
   }  

// if (document.getElementById("translateBtn")){
function sendDataToTranslate() {
    // console.log("sending Data to translate");
    text = document.getElementById("ocrText").value;
    document.getElementById("ocrText").readOnly = true;
    document.getElementById("submitBtn").disabled = true;
    if (document.getElementById('translateBtn')){
        document.getElementById('translateBtn').disabled = true;
    }
    // console.log(text);
    cool = JSON.stringify({sentences:text})
    console.log(cool)
    textarr = text.split('`~>');
    console.log(textarr.length);
    for (i=0;i<textarr.length;i++){
        if (textarr[i]==='' || textarr[i]==='/\n*/'){
            textarr.splice(i,1);
        }
    }
    console.log(textarr.length);
    fetch('/translate',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({sentences:textarr}),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.status === 'success')
        {
            document.getElementById("ocrText").readOnly = false;
            document.getElementById("result").textContent = data.message;
            translatedTxt = data.translated;
            for(let i=0; i<translatedTxt.length; i++){
                // console.log("ദി:" + translatedTxt[i]);
                // textarr.splice(i+1, 0, translatedTxt[i]);
                c = i+1;
                if (i==0){
                    // document.getElementById("transText").value = textarr[i];
                    document.getElementById("transText").value = 'Sentence '+ c + '\n' + translatedTxt[i];
                }
                else{
                // document.getElementById("ocrText").value += textarr[i];
                document.getElementById("transText").value += 'Sentence '+ c + '\n' + translatedTxt[i];
            }
            }
            document.getElementById("submitBtn").disabled = false;
            if (document.getElementById('translateBtn')){
                document.getElementById('translateBtn').disabled = false;
            }
            // document.getElementById("ocrText").value = ;
        }
    });
    // .catch(error => {
    //     console.error('Error:', error);
    // });

}
// }
   
   document.getElementById("submitBtn").addEventListener("click", function() {
    var pdfFileInput = document.getElementById("pdfFile");
    var pdfFile = pdfFileInput.files[0];
    console.log(pdfFile.name)
    if (pdfFile) {
        displayLoading();
        document.getElementById("submitBtn").disabled = true;
        if (document.getElementById('translateBtn')){
            document.getElementById('translateBtn').disabled = true;
        }
        var formData = new FormData();
        formData.append("pdf_file", pdfFile);
        pdf_view = document.getElementById("pdfView");
        // Send an asynchronous POST request to update the global string
        fetch('/file_upload',{
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // path = "static/documents/"+pdfFile.name.toString();
                pdf_view.src = data.pdf_path;
                document.getElementById("result").textContent = data.message;
                    fetch('/doc_ocr', {
                    method: 'POST',
                    body: {},
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        hideLoading();
                        document.getElementById("result").textContent = data.message;
                        document.getElementById("ocrText").value = data.sentences;
                        var sentences_list = data.sentences_list;
                        document.getElementById("submitBtn").disabled = false;
                        if (document.getElementById('translateBtn')){
                            document.getElementById('translateBtn').disabled = false;
                        }
                        // tranDiv = document.createElement("div");
                        // tranDiv.classList.add("col-4")
                        // tranDiv.id = "tranDiv"
                        // document.getElementById("buttonsDiv").appendChild(tranDiv);
                        if (!document.getElementById('translateBtn')){
                            tran = document.createElement("button");
                            tran.type = "button"
                            tran.id = "translateBtn"
                            tran.classList.add("btn")
                            tran.classList.add("btn-success")
                            tran.innerHTML = "Translate to English";
                            document.getElementById("tranDiv").appendChild(tran);
                            translate_btn_press = document.getElementById("translateBtn").addEventListener("click", sendDataToTranslate);
                    }
                        // alert(data.message);
                    } else {
                        alert('Failed to update text area');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while doing OCR');
                })
            } else {
                alert('Failed to upload file.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while uploading the file');
        });
    }
});


// function uploadFile() {
//     const fileInput = document.getElementById('pdfFile');
//     const resultDiv = document.getElementById('result');
//     const file = fileInput.files[0];
//     if (!file) {
//         resultDiv.textContent = 'Please select a file.';
//         return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     fetch('/doc_ocr', {
//         method: 'POST',
//         body: formData
//     })
//     .then(response => response.json())
//     .then(data => {
//         resultDiv.textContent = data.message;
//     })
//     .catch(error => {
//         resultDiv.textContent = 'Error uploading file.';
//         console.error(error);
//     });
//     console.log('Inside uF')
// }

// Periodically update the textarea
// document.getElementById("submitBtn").addEventListener("click", uploadFile());


// function check_ocr_status()
// {
//     uploadFile()
// }

// setInterval(updateTextArea, 1000);