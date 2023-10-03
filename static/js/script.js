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
    });
});

const loader = document.getElementById("animation");
        
// showing loading
   function displayLoading() {
        loader.classList.add("loading");
       // to stop loading after some time
    //    setTimeout(() => {
    //        loader.classList.remove("display");
    //    }, 3000);
   }


// hide loading
   function hideLoading() {
        loader.classList.remove("loading");
   }  

// if (document.getElementById("translateBtn")){
function sendDataToTranslate() {
    console.log("sending Data to translate");
    text = document.getElementById("ocrText").value;
    // console.log(text);
    cool = JSON.stringify({sentences:text})
    console.log(cool)
    textarr = text.split('`~>');
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
            document.getElementById("result").textContent = data.message;
            translatedTxt = data.translated;
            for(let i=0; i<translatedTxt.length; i++){
                console.log("ദി:" + translatedTxt[i]);
            }
            document.getElementById("ocrText").value = data.translated;
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